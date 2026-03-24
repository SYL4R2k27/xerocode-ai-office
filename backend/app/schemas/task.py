from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    goal_id: uuid.UUID
    title: str = Field(..., max_length=500)
    description: str | None = None
    task_type: str = Field(default="general", pattern="^(research|code|design|analysis|general)$")
    priority: int = Field(default=0, ge=0, le=10)
    depends_on: list[str] | None = None
    assigned_agent_id: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = Field(
        default=None, pattern="^(pending|assigned|in_progress|done|failed)$"
    )
    assigned_agent_id: uuid.UUID | None = None
    result: str | None = None
    result_files: list[str] | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    goal_id: uuid.UUID
    title: str
    description: str | None
    task_type: str
    status: str
    priority: int
    assigned_agent_id: uuid.UUID | None
    depends_on: list[str] | None
    result: str | None
    result_files: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
