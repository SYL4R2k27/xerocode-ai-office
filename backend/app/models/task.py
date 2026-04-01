from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID, StringArray


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(
        String(30), default="general"  # research | code | design | analysis | general
    )
    status: Mapped[str] = mapped_column(
        String(30), default="backlog"
        # backlog | in_progress | review_operator | review_manager | done | failed
    )
    priority: Mapped[int] = mapped_column(Integer, default=0)

    # Which agent/model is assigned
    assigned_agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("agents.id"), nullable=True
    )

    # DAG dependencies
    depends_on: Mapped[Optional[List[str]]] = mapped_column(StringArray(), nullable=True)

    # Result
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_files: Mapped[Optional[List[str]]] = mapped_column(StringArray(), nullable=True)

    # Workflow fields
    created_by_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    operator_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    operator_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    manager_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ai_result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    review_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    goal: Mapped["Goal"] = relationship(back_populates="tasks")
    assigned_agent: Mapped[Optional["Agent"]] = relationship(back_populates="tasks")
