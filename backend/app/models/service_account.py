"""Service Account models — внешние API-клиенты (BELSI и т.п.).

Изолировано от users / organizations / messages / tasks.
Аутентификация по Bearer service-token, отдельный rate-limit, отдельный usage-log.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    func,
)
from sqlalchemy.dialects.sqlite import INTEGER as SQLITE_INTEGER

# Cross-DB autoincrement BigInt — на PG = BIGSERIAL, на SQLite = INTEGER PRIMARY KEY
# (SQLite требует именно INTEGER, не BIGINT, для autoincrement)
_BigIntPK = BigInteger().with_variant(SQLITE_INTEGER(), "sqlite")
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID, StringArray


class ServiceAccount(Base):
    """Service-аккаунт внешнего клиента (BELSI и т.п.)."""

    __tablename__ = "service_accounts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Token ──
    service_token_hash: Mapped[str] = mapped_column(Text, nullable=False)  # bcrypt
    token_prefix: Mapped[str] = mapped_column(
        Text, nullable=False, unique=True, index=True
    )

    # ── Permissions ──
    allowed_endpoints: Mapped[List[str]] = mapped_column(
        StringArray(), nullable=False, default=list
    )
    allowed_models: Mapped[List[str]] = mapped_column(
        StringArray(), nullable=False, default=list
    )
    # v1.5 (SSRF defense): per-SA allowlist хостов для image_url в /analyze-image.
    # Пустой список = explicit-only (все image_url отвергнутся с 422).
    # Wildcards поддерживаются: '*.amazonaws.com' matchит 's3.amazonaws.com'.
    allowed_image_hosts: Mapped[List[str]] = mapped_column(
        StringArray(), nullable=False, default=list
    )

    # ── Rate limits ──
    rate_limit_per_minute: Mapped[int] = mapped_column(
        Integer, nullable=False, default=60
    )
    rate_limit_per_day: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5000
    )
    monthly_budget_usd: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0")
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"ServiceAccount(name={self.name!r}, prefix={self.token_prefix!r}, "
            f"active={self.is_active})"
        )


class ServiceAccountUsage(Base):
    """One row per external API call. Cost-tracking + idempotency + analytics."""

    __tablename__ = "service_account_usage"
    __table_args__ = (
        Index(
            "idx_sa_usage_account_date_orm",
            "service_account_id",
            "created_at",
        ),
        Index("idx_sa_usage_request_id_orm", "service_account_id", "request_id"),
    )

    id: Mapped[int] = mapped_column(_BigIntPK, primary_key=True, autoincrement=True)
    service_account_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("service_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(Text, nullable=False)

    tokens_input: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    tokens_output: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(10, 6), default=Decimal("0"), nullable=True
    )

    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # cached envelope for idempotency replay (стор как JSON-строка)
    response_cache: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return (
            f"SAUsage(sa={self.service_account_id}, ep={self.endpoint}, "
            f"model={self.model}, status={self.status_code}, "
            f"cost=${float(self.cost_usd or 0):.6f})"
        )
