from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WorkflowStep(BaseModel):
    id: str
    title: str
    prompt: str = ""
    model: str = "auto"
    task_type: str = "general"
    depends_on: list[str] = []
    # Canvas position
    x: float = 0
    y: float = 0


class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    steps: list[WorkflowStep] = []
    category: str | None = None


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    steps: list[WorkflowStep] | None = None
    category: str | None = None


class WorkflowResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    user_id: uuid.UUID
    organization_id: uuid.UUID | None
    steps: list[dict]
    is_template: bool
    category: str | None
    run_count: int
    last_run_goal_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowRunResponse(BaseModel):
    goal_id: uuid.UUID
    tasks_created: int
    message: str
