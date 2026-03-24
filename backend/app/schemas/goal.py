from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(..., max_length=500, examples=["Сделать лендинг для кофейни"])
    description: str | None = None
    distribution_mode: str = Field(
        default="manager",
        pattern="^(manager|discussion|auto)$",
        description="manager = одна модель распределяет, discussion = модели договариваются, auto = платформа назначает",
    )
    economy_mode: bool = False
    max_exchanges: int | None = Field(default=None, ge=1, le=500)
    output_folder: str | None = None
    runtime_mode: str = Field(
        default="text",
        pattern="^(text|cloud|local)$",
        description="text = только текст, cloud = sandbox на сервере, local = агент на компе",
    )


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = Field(default=None, pattern="^(active|paused|completed|failed)$")
    distribution_mode: str | None = Field(default=None, pattern="^(manager|discussion|auto)$")
    economy_mode: bool | None = None
    max_exchanges: int | None = None
    runtime_mode: str | None = Field(default=None, pattern="^(text|cloud|local)$")


class GoalResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    distribution_mode: str
    economy_mode: bool
    max_exchanges: int | None
    output_folder: str | None
    runtime_mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
