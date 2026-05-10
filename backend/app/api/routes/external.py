"""External API gateway — изолированные endpoints для service-клиентов (BELSI).

Префикс: /api/v1/external
Аутентификация: Bearer service-token (см. app.auth.service_token).
НЕ пересекается с supervisor / orchestration / messages.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func as sa_func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service_token import get_service_account
from app.core.config import settings
from app.core.database import get_db
from app.models.service_account import ServiceAccount, ServiceAccountUsage
from app.schemas.external import (
    AnalyzeImageRequest,
    ExternalEnvelope,
    GenerateRequest,
    UsageResponse,
)
from app.services.external_router import (
    BELSI_PROMPT_TEMPLATES,
    call_transcribe,
    call_with_fallback,
    get_template_keys,
)

router = APIRouter(prefix="/api/v1/external", tags=["external"])


# ╔══════════════════════════════════════════════════════════════╗
# ║   Health (no auth — для smoke-теста)                         ║
# ╚══════════════════════════════════════════════════════════════╝
@router.get("/health")
async def health() -> Dict[str, Any]:
    """No auth — для smoke-теста и мониторинга."""
    return {
        "ok": True,
        "service": "external-gateway",
        "templates": len(BELSI_PROMPT_TEMPLATES),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ╔══════════════════════════════════════════════════════════════╗
# ║   Templates                                                  ║
# ╚══════════════════════════════════════════════════════════════╝
@router.get("/templates")
async def list_templates(
    sa: ServiceAccount = Depends(get_service_account),
) -> Dict[str, Any]:
    """Список доступных prompt-шаблонов для этого service-account."""
    return {
        "templates": [
            {
                "key": key,
                "endpoint_kind": tmpl.get("endpoint_kind", "text"),
                "default_model": "/".join(tmpl.get("default_model", ("?", "?"))),
                "fallback_chain": [
                    f"{p}/{m}" for (p, m) in (tmpl.get("fallback_chain") or [])
                ],
                "paid_fallback_chain": [
                    f"{p}/{m}" for (p, m) in (tmpl.get("paid_fallback_chain") or [])
                ],
                "max_tokens": tmpl.get("max_tokens"),
                "temperature": tmpl.get("temperature"),
            }
            for key, tmpl in BELSI_PROMPT_TEMPLATES.items()
        ],
        "service_account": sa.name,
    }


# ╔══════════════════════════════════════════════════════════════╗
# ║   Analyze image — vision-based                               ║
# ╚══════════════════════════════════════════════════════════════╝
@router.post("/analyze-image", response_model=ExternalEnvelope)
async def analyze_image(
    payload: AnalyzeImageRequest,
    sa: ServiceAccount = Depends(get_service_account),
    db: AsyncSession = Depends(get_db),
) -> ExternalEnvelope:
    """Анализ изображения по prompt-шаблону. Возвращает структурированный JSON."""
    if "analyze-image" not in (sa.allowed_endpoints or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint 'analyze-image' not allowed for this service account",
        )
    if payload.prompt_template not in BELSI_PROMPT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown prompt_template '{payload.prompt_template}'",
        )

    return await call_with_fallback(
        template_key=payload.prompt_template,
        payload=payload,
        sa=sa,
        db=db,
        endpoint="analyze-image",
    )


# ╔══════════════════════════════════════════════════════════════╗
# ║   Generate — text-based                                      ║
# ╚══════════════════════════════════════════════════════════════╝
@router.post("/generate", response_model=ExternalEnvelope)
async def generate(
    payload: GenerateRequest,
    sa: ServiceAccount = Depends(get_service_account),
    db: AsyncSession = Depends(get_db),
) -> ExternalEnvelope:
    """Текстовая генерация по prompt-шаблону. Возвращает структурированный JSON."""
    if "generate" not in (sa.allowed_endpoints or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint 'generate' not allowed for this service account",
        )
    if payload.prompt_template not in BELSI_PROMPT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown prompt_template '{payload.prompt_template}'",
        )

    return await call_with_fallback(
        template_key=payload.prompt_template,
        payload=payload,
        sa=sa,
        db=db,
        endpoint="generate",
    )


# ╔══════════════════════════════════════════════════════════════╗
# ║   Transcribe — audio → text (multipart)                      ║
# ╚══════════════════════════════════════════════════════════════╝
_ALLOWED_AUDIO_MIME = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/flac",
    "application/octet-stream",  # некоторые клиенты так шлют
}


@router.post("/transcribe", response_model=ExternalEnvelope)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file (mp3/wav/m4a/webm/ogg, ≤25MB)"),
    language: str = Form("ru"),
    prompt_hint: str | None = Form(None),
    request_id: str | None = Form(None),
    model_override: str | None = Form(None),
    allow_paid_fallback: bool = Form(False),
    sa: ServiceAccount = Depends(get_service_account),
    db: AsyncSession = Depends(get_db),
) -> ExternalEnvelope:
    """
    Транскрибация голосовых сообщений в текст через Groq Whisper-large-v3-turbo.
    Заточено под русский + строительный/мебельный жаргон (default prompt-hint).
    """
    if "transcribe" not in (sa.allowed_endpoints or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endpoint 'transcribe' not allowed for this service account",
        )

    # MIME guardrail (мягкая проверка — клиенты-Android иногда не выставляют тип)
    ctype = (audio.content_type or "").lower()
    if ctype and ctype not in _ALLOWED_AUDIO_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio mime '{audio.content_type}'",
        )

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty audio file",
        )

    max_mb = int(getattr(settings, "external_max_body_size_mb", 25)) or 25
    # для transcribe лимит из спецификации Groq — 25МБ независимо от env
    hard_limit = 25 * 1024 * 1024
    cap = min(hard_limit, max_mb * 1024 * 1024) if max_mb > 0 else hard_limit
    if len(audio_bytes) > cap:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio too large (max {cap // (1024*1024)} MB)",
        )

    return await call_transcribe(
        audio_bytes=audio_bytes,
        filename=audio.filename or "audio.mp3",
        mime_type=ctype or "audio/mpeg",
        language=language,
        prompt_hint=prompt_hint,
        request_id=request_id,
        sa=sa,
        db=db,
        model_override=model_override,
        allow_paid_fallback=allow_paid_fallback,
    )


# ╔══════════════════════════════════════════════════════════════╗
# ║   Usage / quota                                              ║
# ╚══════════════════════════════════════════════════════════════╝
@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    sa: ServiceAccount = Depends(get_service_account),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """Текущая квота, расход и статус. BELSI вызывает чтобы знать остаток."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    today_cnt = await db.scalar(
        select(sa_func.count(ServiceAccountUsage.id)).where(
            ServiceAccountUsage.service_account_id == sa.id,
            ServiceAccountUsage.created_at >= today_start,
        )
    ) or 0

    today_cost = await db.scalar(
        select(sa_func.coalesce(sa_func.sum(ServiceAccountUsage.cost_usd), 0)).where(
            ServiceAccountUsage.service_account_id == sa.id,
            ServiceAccountUsage.created_at >= today_start,
        )
    ) or Decimal("0")

    month_cost = await db.scalar(
        select(sa_func.coalesce(sa_func.sum(ServiceAccountUsage.cost_usd), 0)).where(
            ServiceAccountUsage.service_account_id == sa.id,
            ServiceAccountUsage.created_at >= month_start,
        )
    ) or Decimal("0")

    return UsageResponse(
        requests_today=int(today_cnt),
        requests_per_day_limit=sa.rate_limit_per_day,
        cost_today_usd=float(today_cost),
        cost_this_month_usd=float(month_cost),
        monthly_budget_usd=float(sa.monthly_budget_usd),
        last_request_at=sa.last_used_at,
        is_active=sa.is_active,
    )
