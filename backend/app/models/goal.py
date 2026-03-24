from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="active"  # active | paused | completed | failed
    )
    distribution_mode: Mapped[str] = mapped_column(
        String(20), default="manager"  # manager | discussion | auto
    )
    economy_mode: Mapped[bool] = mapped_column(default=False)
    max_exchanges: Mapped[Optional[int]] = mapped_column(nullable=True)
    output_folder: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    runtime_mode: Mapped[str] = mapped_column(
        String(20), default="text"  # text | cloud | local
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    tasks: Mapped[List["Task"]] = relationship(back_populates="goal", cascade="all, delete-orphan")
    messages: Mapped[List["Message"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )
    memory: Mapped["Memory"] = relationship(
        back_populates="goal", uselist=False, cascade="all, delete-orphan"
    )
