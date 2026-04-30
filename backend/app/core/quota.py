"""Quota enforcement middleware for AI calls.

Pre-flight check before each AI call:
- BYOK or Free tier? → ∞ (allow always)
- Paid tier? → check monthly quota + daily soft cap
- Block if exceeded; suggest alternatives.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models_catalog import ModelEntry
from app.core.plans import CostTier, Plan, daily_cap_for_tier, get_plan, quota_for_tier
from app.models.ai_usage import AIUsageLog

logger = logging.getLogger(__name__)


class QuotaExceeded(HTTPException):
    """Raised when user exceeds tier quota."""

    def __init__(self, *, tier: CostTier, used: int, limit: int, alternatives: list[str]):
        super().__init__(
            status_code=429,
            detail={
                "error": "quota_exceeded",
                "tier": tier.value,
                "tier_name": tier.name,
                "used": used,
                "limit": limit,
                "alternatives": alternatives,
                "message": (
                    f"Лимит T{tier.value} ({tier.name}) исчерпан: {used:,}/{limit:,} токенов. "
                    f"Используй Free модели, BYOK свой ключ или обнови тариф."
                ),
            },
        )


# ──────────────────────────────────────────────────────────────────────
# Usage aggregation
# ──────────────────────────────────────────────────────────────────────


async def get_monthly_usage(
    db: AsyncSession,
    user_id,
    cost_tier: CostTier,
    counter: str = "tokens_out",
) -> int:
    """Return total used tokens (or units) for current calendar month."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    column = {
        "tokens_in": AIUsageLog.tokens_in,
        "tokens_out": AIUsageLog.tokens_out,
        "units": AIUsageLog.units,
    }[counter]

    stmt = (
        select(func.coalesce(func.sum(column), 0))
        .where(AIUsageLog.user_id == user_id)
        .where(AIUsageLog.cost_tier == cost_tier.value)
        .where(AIUsageLog.via_byok.is_(False))         # BYOK не считается
        .where(AIUsageLog.created_at >= month_start)
        .where(AIUsageLog.success.is_(True))
    )
    result = await db.execute(stmt)
    return int(result.scalar() or 0)


async def get_daily_usage(
    db: AsyncSession,
    user_id,
    cost_tier: CostTier,
    counter: str = "tokens_out",
) -> int:
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    column = {
        "tokens_in": AIUsageLog.tokens_in,
        "tokens_out": AIUsageLog.tokens_out,
        "units": AIUsageLog.units,
    }[counter]

    stmt = (
        select(func.coalesce(func.sum(column), 0))
        .where(AIUsageLog.user_id == user_id)
        .where(AIUsageLog.cost_tier == cost_tier.value)
        .where(AIUsageLog.via_byok.is_(False))
        .where(AIUsageLog.created_at >= day_start)
        .where(AIUsageLog.success.is_(True))
    )
    result = await db.execute(stmt)
    return int(result.scalar() or 0)


# ──────────────────────────────────────────────────────────────────────
# Quota check
# ──────────────────────────────────────────────────────────────────────


async def check_quota(
    db: AsyncSession,
    user,
    model: ModelEntry,
    *,
    estimated_tokens_out: int = 1_000,
    via_byok: bool = False,
) -> dict:
    """Pre-flight quota check. Raises QuotaExceeded if blocked.

    Returns dict with usage stats for response headers.
    """
    plan = get_plan(getattr(user, "plan", None))

    # BYOK and FREE tier are always unlimited
    if via_byok or model.cost_tier == CostTier.FREE:
        return {"tier": model.cost_tier.value, "limit": -1, "used": 0, "byok": via_byok}

    # Determine counter — tokens for text, units for media
    counter = "units" if model.kind in ("image", "video", "audio") else "tokens_out"

    monthly_limit = quota_for_tier(plan, model.cost_tier)
    daily_limit = daily_cap_for_tier(plan, model.cost_tier)

    # Tier completely blocked
    if monthly_limit == 0:
        raise QuotaExceeded(
            tier=model.cost_tier,
            used=0,
            limit=0,
            alternatives=["use_byok", f"upgrade_from_{plan.name}"],
        )

    # Unlimited
    if monthly_limit == -1:
        return {"tier": model.cost_tier.value, "limit": -1, "used": 0, "byok": False}

    used_monthly = await get_monthly_usage(db, user.id, model.cost_tier, counter)

    # Hard block — monthly limit exceeded
    if used_monthly + estimated_tokens_out > monthly_limit:
        raise QuotaExceeded(
            tier=model.cost_tier,
            used=used_monthly,
            limit=monthly_limit,
            alternatives=["use_free_tier", "use_byok", f"upgrade_from_{plan.name}"],
        )

    # Soft daily cap (anti-burn)
    used_daily = await get_daily_usage(db, user.id, model.cost_tier, counter)
    if daily_limit > 0 and used_daily + estimated_tokens_out > daily_limit:
        # Don't block — log warning. Caller can fallback to T1 if desired.
        logger.warning(
            f"User {user.id} hit daily cap on T{model.cost_tier.value}: "
            f"{used_daily}/{daily_limit}. Suggest T1 fallback."
        )

    return {
        "tier": model.cost_tier.value,
        "limit": monthly_limit,
        "used": used_monthly,
        "daily_used": used_daily,
        "daily_limit": daily_limit,
        "remaining": monthly_limit - used_monthly,
        "byok": False,
    }


# ──────────────────────────────────────────────────────────────────────
# Usage logging
# ──────────────────────────────────────────────────────────────────────


async def log_usage(
    db: AsyncSession,
    *,
    user_id,
    org_id=None,
    model: ModelEntry,
    provider: str,
    tokens_in: int = 0,
    tokens_out: int = 0,
    units: int = 0,
    via_byok: bool = False,
    latency_ms: int = 0,
    success: bool = True,
    error_msg: str | None = None,
) -> AIUsageLog:
    """Persist one usage event. Computes cost from model pricing."""
    # Compute cost in micro-USD (USD × 1,000,000) to avoid float
    cost_usd = 0.0
    if tokens_in:
        cost_usd += tokens_in * model.input_price_usd_per_m / 1_000_000
    if tokens_out:
        cost_usd += tokens_out * model.output_price_usd_per_m / 1_000_000
    if units:
        cost_usd += units * model.media_price_usd_per_unit
    cost_micro = int(cost_usd * 1_000_000)

    entry = AIUsageLog(
        user_id=user_id,
        org_id=org_id,
        model_id=model.id,
        cost_tier=model.cost_tier.value,
        provider=provider,
        kind=model.kind,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        units=units,
        cost_micro_usd=cost_micro,
        via_byok=via_byok,
        latency_ms=latency_ms,
        success=success,
        error_msg=error_msg[:500] if error_msg else None,
    )
    db.add(entry)
    await db.flush()
    return entry


# ──────────────────────────────────────────────────────────────────────
# Burst credit calculation (next month bonus)
# ──────────────────────────────────────────────────────────────────────


async def calculate_burst_credit(db: AsyncSession, user_id, plan: Plan) -> dict[CostTier, int]:
    """If user used <50% of last month's quota, give +25% next month."""
    now = datetime.now(timezone.utc)
    last_month_end = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (last_month_end - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    bonus = {}
    for tier in (CostTier.CHEAP, CostTier.STANDARD, CostTier.PREMIUM, CostTier.MEDIA):
        limit = quota_for_tier(plan, tier)
        if limit <= 0:
            continue
        counter = "units" if tier == CostTier.MEDIA else "tokens_out"
        column = {
            "tokens_out": AIUsageLog.tokens_out,
            "units": AIUsageLog.units,
        }[counter]
        stmt = (
            select(func.coalesce(func.sum(column), 0))
            .where(AIUsageLog.user_id == user_id)
            .where(AIUsageLog.cost_tier == tier.value)
            .where(AIUsageLog.via_byok.is_(False))
            .where(AIUsageLog.created_at >= last_month_start)
            .where(AIUsageLog.created_at < last_month_end)
            .where(AIUsageLog.success.is_(True))
        )
        used = int((await db.execute(stmt)).scalar() or 0)
        if used < limit * 0.5:
            bonus[tier] = int(limit * 0.25)
    return bonus
