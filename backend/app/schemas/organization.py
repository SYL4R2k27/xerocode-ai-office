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
    total_tasks: int
    tasks_done: int
    tasks_in_progress: int
    tasks_pending: int
