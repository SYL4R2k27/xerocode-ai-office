from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID, StringArray


class Agent(Base):
    """
    Agent = подключенная AI-модель.
    Пользователь добавляет свои модели через настройки.
    Каждая модель становится "сотрудником" в офисе.
    """

    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)

    # Identity — как модель выглядит в офисе
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Provider connection
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_key_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    base_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Capabilities
    skills: Mapped[Optional[List[str]]] = mapped_column(StringArray(), nullable=True)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Ownership
    owner_type: Mapped[str] = mapped_column(String(20), default="user")  # "user" | "platform"
    subscription_tier: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default=None)  # "free_pool" | "premium" | None

    # Status
    status: Mapped[str] = mapped_column(String(20), default="idle")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Cost tracking
    total_tokens_used: Mapped[int] = mapped_column(default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    cost_per_1k_input: Mapped[float] = mapped_column(Float, default=0.0)
    cost_per_1k_output: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    tasks: Mapped[List["Task"]] = relationship(back_populates="assigned_agent")
