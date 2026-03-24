from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    """Пользователь подключает свою AI-модель."""

    name: str = Field(..., max_length=100, examples=["Аналитик"])
    role: str = Field(..., max_length=100, examples=["Data Analyst"])
    avatar: str | None = Field(default=None, examples=["🧠"])

    # Connection
    provider: str = Field(..., pattern="^(openai|anthropic|ollama|groq|google|gemini|openrouter|stability|grok|custom)$")
    model_name: str = Field(..., max_length=100, examples=["gpt-4", "claude-sonnet-4-20250514", "llama3"])
    api_key: str | None = Field(default=None, description="API ключ (будет зашифрован)")
    base_url: str | None = Field(default=None, examples=["http://localhost:11434"])

    # Capabilities
    skills: list[str] | None = Field(default=None, examples=[["code", "analysis", "text"]])
    system_prompt: str | None = None

    # Ownership
    owner_type: str = "user"
    subscription_tier: str | None = None

    # Cost
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0


class AgentUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    avatar: str | None = None
    model_name: str | None = None
    api_key: str | None = None
    base_url: str | None = None
    skills: list[str] | None = None
    system_prompt: str | None = None
    is_active: bool | None = None


class AgentResponse(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    avatar: str | None
    provider: str
    model_name: str
    base_url: str | None
    skills: list[str] | None
    owner_type: str
    subscription_tier: str | None
    status: str
    is_active: bool
    total_tokens_used: int
    total_cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}
