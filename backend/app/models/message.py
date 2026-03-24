from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID


class Message(Base):
    """
    Communication Bus — все сообщения между моделями и пользователем.
    Это "групповой чат" где модели общаются между собой.
    """

    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )

    # Who sent it
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False)
    sender_agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("agents.id"), nullable=True
    )
    sender_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String(30), default="chat")

    # Cost of this message (if AI-generated)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    goal: Mapped["Goal"] = relationship(back_populates="messages")
    sender_agent: Mapped[Optional["Agent"]] = relationship()
