from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    goal_id: uuid.UUID
    content: str = Field(..., min_length=1)
    sender_type: str = Field(default="user", pattern="^(user|agent|system)$")
    sender_agent_id: uuid.UUID | None = None
    sender_name: str = Field(default="User")
    message_type: str = Field(
        default="chat",
        pattern="^(chat|task_assignment|task_result|status_update|user_command|system)$",
    )


class UserInput(BaseModel):
    """Когда пользователь-дирижер вмешивается в процесс."""

    goal_id: uuid.UUID
    content: str = Field(..., min_length=1, examples=["Добавьте раздел про риски"])
    input_type: str = Field(
        default="command",
        pattern="^(command|edit|idea)$",
        description="command = прямое указание, edit = изменить задачу, idea = предложение",
    )


class MessageResponse(BaseModel):
    id: uuid.UUID
    goal_id: uuid.UUID
    sender_type: str
    sender_agent_id: uuid.UUID | None
    sender_name: str
    content: str
    message_type: str
    tokens_used: int
    cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}
