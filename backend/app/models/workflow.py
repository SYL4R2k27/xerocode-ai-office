from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)

    # Steps stored as JSONB array
    # Each step: {id, title, prompt, model, task_type, depends_on: []}
    steps: Mapped[dict] = mapped_column(JSONB(), default=list)

    # Template info
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Last run
    last_run_goal_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    run_count: Mapped[int] = mapped_column(default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
