"""AI Usage Log — persistent quota tracking per cost-tier."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID


class AIUsageLog(Base):
    """One row per AI call. Used for quota enforcement + cost tracking + analytics."""

    __tablename__ = "ai_usage_log"
    __table_args__ = (
        Index("ix_ai_usage_user_tier_created", "user_id", "cost_tier", "created_at"),
        Index("ix_ai_usage_org_tier_created", "org_id", "cost_tier", "created_at"),
        Index("ix_ai_usage_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    org_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Model + tier (denormalized for fast aggregation)
    model_id: Mapped[str] = mapped_column(String(80), nullable=False)
    cost_tier: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..4
    provider: Mapped[str] = mapped_column(String(30), nullable=False)  # actual provider used
    kind: Mapped[str] = mapped_column(String(20), nullable=False, default="text")  # text/image/video/audio

    # Usage
    tokens_in: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # for image/video/audio

    # Cost (in USD * 1000000 to avoid float — store as integer microcents)
    cost_micro_usd: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Routing info
    via_byok: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    error_msg: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def cost_usd(self) -> float:
        return self.cost_micro_usd / 1_000_000.0

    def __repr__(self) -> str:
        return (
            f"AIUsageLog(user={self.user_id}, model={self.model_id}, "
            f"tier=T{self.cost_tier}, in/out={self.tokens_in}/{self.tokens_out}, "
            f"cost=${self.cost_usd:.6f})"
        )
