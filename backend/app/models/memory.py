from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Memory(Base):
    """
    Memory System — хранит контекст для каждой цели.
    Модели используют этот контекст чтобы понимать общую картину.
    """

    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("goals.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Context layers
    global_context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_decisions: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    task_results: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    goal: Mapped["Goal"] = relationship(back_populates="memory")
