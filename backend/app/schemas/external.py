"""Pydantic-схемы для external API (BELSI и т.п.)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator


# ╔══════════════════════════════════════════════════════════════╗
# ║   Request schemas                                            ║
# ╚══════════════════════════════════════════════════════════════╝
class AnalyzeImageRequest(BaseModel):
    """Запрос на анализ изображения через AI-провайдера."""

    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    prompt_template: str = Field(
        ..., description="Ключ шаблона: photo_quality | idle_verify | ..."
    )
    custom_context: Optional[Dict[str, Any]] = None
    expected_schema: Optional[Dict[str, Any]] = None
    model_preference: str = Field(
        "fast", description="fast | best | cheap"
    )
    model_override: Optional[str] = None
    max_tokens: int = Field(500, ge=10, le=4000)
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    request_id: Optional[str] = Field(None, max_length=128)
    client_context: Optional[Dict[str, Any]] = None
    # v1.4 — если True и весь free-chain упал, идём в paid_fallback_chain.
    # По умолчанию платные модели НЕ вызываются автоматически.
    allow_paid_fallback: bool = False

    @model_validator(mode="after")
    def _check_image_source(self):
        if not (self.image_url or self.image_base64):
            raise ValueError("Either image_url or image_base64 must be provided")
        return self


class GenerateRequest(BaseModel):
    """Запрос на текстовую генерацию по шаблону."""

    prompt_template: str
    data: Dict[str, Any] = Field(default_factory=dict)
    expected_schema: Optional[Dict[str, Any]] = None
    model_preference: str = "fast"
    model_override: Optional[str] = None
    max_tokens: int = Field(1000, ge=10, le=8000)
    temperature: float = Field(0.5, ge=0.0, le=2.0)
    request_id: Optional[str] = Field(None, max_length=128)
    # v1.4 — см. AnalyzeImageRequest
    allow_paid_fallback: bool = False


# ╔══════════════════════════════════════════════════════════════╗
# ║   Response envelope                                          ║
# ╚══════════════════════════════════════════════════════════════╝
class ExternalEnvelope(BaseModel):
    """Унифицированный JSON-envelope для всех external endpoints."""

    ok: bool
    request_id: Optional[str] = None
    timestamp: datetime
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


# ╔══════════════════════════════════════════════════════════════╗
# ║   Admin schemas — service-account creation                   ║
# ╚══════════════════════════════════════════════════════════════╝
class ServiceAccountCreate(BaseModel):
    """Запрос на создание нового service-аккаунта (admin only)."""

    name: str = Field(..., min_length=3, max_length=64, description="Например 'belsi-prod'")
    description: Optional[str] = Field(None, max_length=500)
    organization_id: Optional[str] = None  # UUID as string
    allowed_endpoints: List[str] = Field(default_factory=lambda: ["analyze-image", "generate"])
    allowed_models: List[str] = Field(default_factory=list)  # пусто = все из шаблонов
    rate_limit_per_minute: int = Field(60, ge=1, le=10000)
    rate_limit_per_day: int = Field(5000, ge=1, le=1000000)
    monthly_budget_usd: float = Field(0.0, ge=0.0)


class ServiceAccountCreateResponse(BaseModel):
    """Ответ при создании — ОДИН РАЗ показывается plaintext-токен."""

    id: str
    name: str
    token_plaintext: str
    token_prefix: str
    warning: str = "Сохраните токен сейчас — он больше не будет показан."


class ServiceAccountInfo(BaseModel):
    """Информация о service-аккаунте без токена."""

    id: str
    name: str
    description: Optional[str]
    token_prefix: str
    allowed_endpoints: List[str]
    allowed_models: List[str]
    rate_limit_per_minute: int
    rate_limit_per_day: int
    monthly_budget_usd: float
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]


# ╔══════════════════════════════════════════════════════════════╗
# ║   Usage / quota                                              ║
# ╚══════════════════════════════════════════════════════════════╝
class UsageResponse(BaseModel):
    """Текущая квота и расход для service-аккаунта."""

    requests_today: int
    requests_per_day_limit: int
    cost_today_usd: float
    cost_this_month_usd: float
    monthly_budget_usd: float
    last_request_at: Optional[datetime]
    is_active: bool
