"""Central AI key resolver with strict BYOK + subscription policy.

Rules (enforced here, NOT duplicated in callers):

1. **BYOK first, always.** If the user has their own API key for the requested provider,
   that key is used — platform keys are never touched. This prevents burning our quota
   when the user intentionally or accidentally hits a model whose provider they've
   already brought a key for.

2. **Platform keys are gated by subscription.** Without a matching BYOK key:
   - Free / Start: NO platform access. Must bring their own keys.
   - Pro: platform Groq (free-tier provider) only.
   - Pro+: platform Groq + OpenRouter.
   - Ultima / Admin / Corporate+: all platform providers.
   - Corporate (base): non-premium providers only (Groq, OpenRouter standard tier).

3. **Premium model gate.** Premium-tier models (GPT-4o, Claude, Grok, DALL-E, etc.) require
   either BYOK for that provider OR plan with `can_use_premium=True`.

4. **No fallback leakage.** If resolver raises 403, the caller must NOT silently fall back
   to a different provider's platform key.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.subscription import _get_effective_plan, is_premium_model
from app.models.user import User


@dataclass
class ResolvedKey:
    key: str
    provider: str
    source: str  # "byok" | "platform"
    model: Optional[str] = None


# Which providers each plan can access via platform keys.
PLATFORM_PROVIDER_ACCESS: dict[str, set[str]] = {
    "free": set(),
    "start": set(),
    "pro": {"groq"},
    "pro_plus": {"groq", "openrouter"},
    "ultima": {"groq", "openrouter", "openai", "anthropic", "google"},
    "corporate": {"groq", "openrouter"},
    "corporate_plus": {"groq", "openrouter", "openai", "anthropic", "google"},
    "admin": {"groq", "openrouter", "openai", "anthropic", "google"},
}


def _platform_key_for(provider: str) -> Optional[str]:
    """Map provider → configured platform key from settings (or None)."""
    mapping = {
        "openai": getattr(settings, "openai_api_key", None),
        "anthropic": getattr(settings, "anthropic_api_key", None),
        "google": getattr(settings, "google_api_key", None),
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
    }
    return mapping.get(provider)


async def resolve_key(
    db: AsyncSession,
    user: User,
    provider: str,
    model_name: Optional[str] = None,
) -> ResolvedKey:
    """Resolve which API key to use for a given user/provider/model.

    Returns ResolvedKey or raises HTTPException(403).

    Order:
      1. User BYOK for provider → use it (bypasses all subscription gates).
      2. Check plan premium gate if model is premium.
      3. Check plan platform-provider access.
      4. Return platform key (if configured on server).
    """
    from app.api.routes.byok import get_user_key as _get_byok

    # --- 1. BYOK wins unconditionally ---
    byok = await _get_byok(db, user.id, provider)
    if byok:
        return ResolvedKey(key=byok, provider=provider, source="byok", model=model_name)

    # --- 2. Premium gate ---
    plan = _get_effective_plan(user)
    if model_name and is_premium_model(model_name):
        from app.core.subscription import PLAN_LIMITS
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        if not limits.get("can_use_premium"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Премиум-модель {model_name} недоступна на тарифе {plan}. "
                    "Добавьте свой ключ (BYOK) или повысьте подписку до PRO+."
                ),
            )

    # --- 3. Platform provider access ---
    allowed = PLATFORM_PROVIDER_ACCESS.get(plan, set())
    if provider not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Доступ к провайдеру '{provider}' закрыт для тарифа '{plan}'. "
                "Добавьте свой API ключ в разделе «API ключи» или повысьте подписку."
            ),
        )

    # --- 4. Use platform key ---
    platform_key = _platform_key_for(provider)
    if not platform_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ключ платформы для '{provider}' не настроен на сервере.",
        )

    return ResolvedKey(key=platform_key, provider=provider, source="platform", model=model_name)


async def has_any_key(db: AsyncSession, user: User, provider: str) -> bool:
    """Lightweight check without raising — useful for UI hints."""
    try:
        await resolve_key(db, user, provider)
        return True
    except HTTPException:
        return False
