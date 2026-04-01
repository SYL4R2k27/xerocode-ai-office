from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class OrgCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)


class OrgResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    max_members: int
    member_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgMember(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    org_role: str | None
    tasks_used_this_month: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class InviteCreate(BaseModel):
    email: str = Field(..., max_length=320)
    role: str = Field(default="member", pattern="^(manager|member)$")


class RoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(manager|member)$")


class TaskReview(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|comment)$")
    comment: str | None = None


class OrgStats(BaseModel):
    total_members: int
    total_goals: int
    active_projects: int = 0
    total_tasks: int
    tasks_done: int
    tasks_in_progress: int
    tasks_pending: int
    tasks_backlog: int = 0
    tasks_review_operator: int = 0
    tasks_review_manager: int = 0
    completed_this_week: int = 0
    total_cost_usd: float = 0.0


class OrgTaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    task_type: str
    status: str
    priority: int
    goal_id: uuid.UUID
    goal_title: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    agent_name: str | None = None
    created_by_ai: bool = False
    operator_id: uuid.UUID | None = None
    operator_name: str | None = None
    reviewer_id: uuid.UUID | None = None
    ai_result: str | None = None
    review_comment: str | None = None
    operator_approved_at: datetime | None = None
    manager_approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OrgActivity(BaseModel):
    id: uuid.UUID
    user_name: str
    action: str
    target: str = ""
    details: dict | None = None
    created_at: datetime | None = None


class WorkflowTransition(BaseModel):
    status: str = Field(..., pattern="^(backlog|in_progress|review_operator|review_manager|done|failed)$")
    comment: str | None = None
