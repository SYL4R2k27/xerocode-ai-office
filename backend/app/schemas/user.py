from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=200)
    invite_code: str = Field(default="", max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    plan: str
    tasks_used_this_month: int
    is_admin: bool = False
    organization_id: uuid.UUID | None = None
    org_role: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    avatar: str | None = Field(default=None, max_length=10)


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes
