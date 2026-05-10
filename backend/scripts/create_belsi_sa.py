"""One-shot скрипт создания production service-account для BELSI.

Запускать ТОЛЬКО на проде (нужен PostgreSQL ai_office + bcrypt + python).
Stdout = plaintext token (для пайплайна).  Stderr = диагностика.
"""
from __future__ import annotations

import asyncio
import os
import secrets
import sys
import uuid
from decimal import Decimal

# sys.path: ~/ai-office/backend/
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import bcrypt
from sqlalchemy import select

from app.core.database import async_session
from app.models.service_account import ServiceAccount


SA_CONFIG = {
    "name": "belsi-prod",
    "description": "BELSI.Монтаж production AI integration",
    "allowed_endpoints": ["analyze-image", "generate", "transcribe", "usage"],
    "allowed_models": [],
    "rate_limit_per_minute": 60,
    "rate_limit_per_day": 5000,
    "monthly_budget_usd": Decimal("50.0"),
}


async def main() -> int:
    # token-prefix должен НЕ содержать '_' (используется как разделитель в parse_token)
    # token_hex даёт только [0-9a-f] — безопасно для split
    rand_prefix = secrets.token_hex(4)            # 8 hex chars
    rand_secret = secrets.token_hex(16)           # 32 hex chars
    plaintext = f"belsi_{rand_prefix}_{rand_secret}"
    # plaintext = 47 chars total (≤ 72-byte bcrypt limit)

    token_hash = bcrypt.hashpw(
        plaintext.encode("utf-8"),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")

    async with async_session() as db:
        # Защита от дубликата
        existing = await db.scalar(
            select(ServiceAccount).where(
                (ServiceAccount.name == SA_CONFIG["name"])
                | (ServiceAccount.token_prefix == rand_prefix)
            )
        )
        if existing:
            print(
                f"[ERROR] SA already exists: id={existing.id} "
                f"name={existing.name!r} prefix={existing.token_prefix!r}",
                file=sys.stderr,
            )
            return 2

        sa = ServiceAccount(
            id=uuid.uuid4(),
            name=SA_CONFIG["name"],
            description=SA_CONFIG["description"],
            service_token_hash=token_hash,
            token_prefix=rand_prefix,
            allowed_endpoints=SA_CONFIG["allowed_endpoints"],
            allowed_models=SA_CONFIG["allowed_models"],
            rate_limit_per_minute=SA_CONFIG["rate_limit_per_minute"],
            rate_limit_per_day=SA_CONFIG["rate_limit_per_day"],
            monthly_budget_usd=SA_CONFIG["monthly_budget_usd"],
            is_active=True,
            created_by=None,  # системно созданный
        )
        db.add(sa)
        await db.commit()
        await db.refresh(sa)

        # plaintext → stdout (для парсинга родительским shell)
        print(plaintext)

        # info → stderr (для человека)
        print(f"[OK] id            = {sa.id}", file=sys.stderr)
        print(f"[OK] name          = {sa.name}", file=sys.stderr)
        print(f"[OK] token_prefix  = {sa.token_prefix}", file=sys.stderr)
        print(f"[OK] endpoints     = {sa.allowed_endpoints}", file=sys.stderr)
        print(f"[OK] rate/minute   = {sa.rate_limit_per_minute}", file=sys.stderr)
        print(f"[OK] rate/day      = {sa.rate_limit_per_day}", file=sys.stderr)
        print(f"[OK] budget/month  = ${sa.monthly_budget_usd} USD", file=sys.stderr)
        print(f"[OK] is_active     = {sa.is_active}", file=sys.stderr)
        print(f"[OK] created_at    = {sa.created_at}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
