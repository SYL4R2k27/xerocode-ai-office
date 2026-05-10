"""Service-token authentication для external API gateway.

Формат токена: '<name_prefix>_<rand_8>_<rand_24+>'
Пример:  belsi_a1b2c3d4_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Поток валидации:
  1. Парсим Authorization: Bearer <token>
  2. Извлекаем token_prefix (вторая группа)
  3. Поиск ServiceAccount.token_prefix в БД
  4. bcrypt-проверка hash
  5. is_active
  6. Rate limit per minute (Redis sliding window)
  7. Bump last_used_at
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis_client import rate_limit_check
from app.models.service_account import ServiceAccount

logger = logging.getLogger(__name__)


def _parse_token(auth_header: Optional[str]) -> tuple[str, str]:
    """
    Извлекает (token_prefix, full_token) из 'Bearer <name_prefix>_<8>_<rest>'.
    Raises 401 если формат неверный.
    """
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = auth_header.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization must be 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()
    segments = token.split("_")
    if len(segments) < 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed service token",
        )

    # name_prefix_<rand8>_<rest>  → token_prefix = segments[1]
    token_prefix = segments[1]
    if len(token_prefix) < 6 or len(token_prefix) > 16:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token prefix",
        )

    return token_prefix, token


async def get_service_account(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ServiceAccount:
    """FastAPI dependency: validate Bearer service-token → return ServiceAccount."""

    token_prefix, plaintext = _parse_token(authorization)

    # ── Lookup ──
    stmt = select(ServiceAccount).where(ServiceAccount.token_prefix == token_prefix)
    result = await db.execute(stmt)
    sa: Optional[ServiceAccount] = result.scalar_one_or_none()

    if sa is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        )

    # ── bcrypt verify ──
    try:
        valid = bcrypt.checkpw(
            plaintext.encode("utf-8"),
            sa.service_token_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        valid = False

    if not valid:
        # Логируем, но не раскрываем детали клиенту
        logger.warning(
            "[external] bcrypt mismatch for prefix=%s ip=%s",
            token_prefix,
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        )

    # ── is_active ──
    if not sa.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service account is deactivated",
        )

    # ── Rate limit per minute (Redis sliding window) ──
    rate_key = f"sa_rate:{sa.id}:{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"
    allowed = await rate_limit_check(
        rate_key,
        max_requests=sa.rate_limit_per_minute,
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {sa.rate_limit_per_minute} req/min",
            headers={"Retry-After": "60"},
        )

    # ── Bump last_used_at (best-effort, не падать если не получилось) ──
    try:
        sa.last_used_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(sa)
    except Exception as e:
        logger.warning("[external] failed to bump last_used_at: %s", e)
        await db.rollback()

    return sa
