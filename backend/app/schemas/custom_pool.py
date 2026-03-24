from __future__ import annotations

from pydantic import BaseModel


class AgentConfig(BaseModel):
    name: str
    role: str
    provider: str
    model_name: str
    skills: list[str] = []
    api_key_source: str = "user"  # "user" or "platform"
    api_key: str | None = None


class CustomPoolCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "custom"
    agents_config: list[AgentConfig]


class CustomPoolResponse(BaseModel):
    id: str
    name: str
    description: str | None
    category: str
    agents_config: list[dict]
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True
