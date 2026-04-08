from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

# "start" = бывший "free", переименован
PLAN_LIMITS: dict[str, dict] = {
    "free": {
        "max_agents": 3, "max_tasks_month": 50, "max_images_month": 0,
        "can_use_pools": False, "can_use_premium": False, "can_use_custom_pools": False,
        "can_use_images": False, "can_upload_files": True,
    },
    "start": {
        "max_agents": 3, "max_tasks_month": 50, "max_images_month": 0,
        "can_use_pools": False, "can_use_premium": False, "can_use_custom_pools": False,
        "can_use_images": False, "can_upload_files": True,
    },
    "pro": {
        "max_agents": 10, "max_tasks_month": 500, "max_images_month": 100,
        "can_use_pools": True, "can_use_premium": False, "can_use_custom_pools": False,
        "can_use_images": True, "can_upload_files": True,
    },
    "pro_plus": {
        "max_agents": 15, "max_tasks_month": 2000, "max_images_month": 500,
        "can_use_pools": True, "can_use_premium": True, "premium_daily_tokens": 100_000,
        "can_use_custom_pools": True, "can_use_images": True, "can_upload_files": True,
    },
    "ultima": {
        "max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999,
        "can_use_pools": True, "can_use_premium": True, "premium_daily_tokens": 999999999,
        "can_use_custom_pools": True, "can_use_images": True, "can_upload_files": True,
    },
    "corporate": {
        "max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999,
        "can_use_pools": True, "can_use_premium": False, "premium_daily_tokens": 0,
        "can_use_custom_pools": True, "can_use_images": True, "can_upload_files": True,
    },
    "corporate_plus": {
        "max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999,
        "can_use_pools": True, "can_use_premium": True, "premium_daily_tokens": 999999999,
        "can_use_custom_pools": True, "can_use_images": True, "can_upload_files": True,
    },
    "admin": {
        "max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999,
        "can_use_pools": True, "can_use_premium": True, "premium_daily_tokens": 999999999,
        "can_use_custom_pools": True, "can_use_images": True, "can_upload_files": True,
    },
}

# Какие модели считаются "премиум" (остальные — бесплатные)
PREMIUM_MODEL_PREFIXES = [
    "gpt-5", "gpt-4o", "gpt-4.1", "gpt-4-turbo", "o3", "o4", "o1",
    "claude-", "grok-4", "grok-3",
    "gemini-2.5-pro", "gemini-3-pro",
    "dall-e", "sora-", "gpt-image",
    "sd3.5", "stable-image", "flux",
]

# Пулы доступные по планам
# "all" означает доступ ко всем пулам из model_pools.POOLS
POOL_ACCESS = {
    "free": [],
    "start": [],
    "pro": ["coding_start", "design_start", "research", "copywriting", "solo_deepseek", "solo_fast"],
    "pro_plus": [
        "coding_start", "design_start", "research", "copywriting", "solo_deepseek", "solo_fast",
        "coding_pro", "coding_fullstack", "data_analysis", "automation", "solo_grok",
    ],
    "ultima": "all",
    "corporate": [
        "coding_start", "design_start", "research", "copywriting", "solo_deepseek", "solo_fast",
        "coding_pro", "coding_fullstack", "data_analysis", "automation",
    ],
    "corporate_plus": "all",
    "admin": "all",
}


def _get_effective_plan(user: User) -> str:
    """Определить активный план с учётом триала."""
    from datetime import datetime, timezone

    if user.is_admin:
        return "admin"

    # Триал активен?
    if (
        getattr(user, "trial_expires_at", None)
        and user.trial_expires_at
        and user.trial_expires_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc)
        and getattr(user, "trial_plan", None)
    ):
        return user.trial_plan

    plan = user.plan or "free"
    if plan == "corporate_plus" or plan.startswith("corporate_plus"):
        return "corporate_plus"
    if plan.startswith("corporate"):
        return "corporate"
    return plan


def _get_limits(user: User) -> dict:
    plan = _get_effective_plan(user)
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])


def get_user_limits(user: User) -> dict:
    """Публичный метод — для API /auth/me и фронтенда."""
    from datetime import datetime, timezone

    limits = _get_limits(user)
    plan = _get_effective_plan(user)
    pool_access = POOL_ACCESS.get(plan, [])

    # Триал инфо
    trial_active = False
    trial_days_left = 0
    if getattr(user, "trial_expires_at", None) and user.trial_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.trial_expires_at.replace(tzinfo=timezone.utc) if user.trial_expires_at.tzinfo is None else user.trial_expires_at
        if expires > now:
            trial_active = True
            trial_days_left = max(0, (expires - now).days)

    return {
        **limits,
        "plan": plan,
        "pool_access": pool_access,
        "tasks_used": user.tasks_used_this_month,
        "trial_active": trial_active,
        "trial_days_left": trial_days_left,
    }


def is_premium_model(model_name: str) -> bool:
    """Проверить, является ли модель премиум."""
    clean = model_name.split("/")[-1].lower() if "/" in model_name else model_name.lower()
    return any(clean.startswith(p) for p in PREMIUM_MODEL_PREFIXES)


def check_subscription_limits(user: User, action: str) -> None:
    """Raise 403 if the user's plan does not allow action."""
    limits = _get_limits(user)
    if action == "create_task":
        if user.tasks_used_this_month >= limits["max_tasks_month"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Лимит задач исчерпан ({limits['max_tasks_month']}/мес). Повысьте подписку.",
            )
    elif action == "generate_image":
        if not limits.get("can_use_images"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Генерация изображений недоступна на вашем тарифе. Повысьте до PRO.",
            )
    elif action == "use_pool":
        if not limits.get("can_use_pools"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Готовые пулы моделей недоступны на вашем тарифе. Повысьте до PRO.",
            )
    elif action == "use_premium_model":
        if not limits.get("can_use_premium"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Премиум модели недоступны на вашем тарифе. Повысьте до PRO PLUS.",
            )
    elif action == "create_custom_pool":
        if not limits.get("can_use_custom_pools"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Кастомные пулы недоступны на вашем тарифе. Повысьте до PRO PLUS.",
            )


def check_can_create_agent(user: User, current_agent_count: int) -> bool:
    limits = _get_limits(user)
    return current_agent_count < limits["max_agents"]


def check_can_create_task(user: User) -> bool:
    limits = _get_limits(user)
    return user.tasks_used_this_month < limits["max_tasks_month"]


def check_pool_access(user: User, pool_id: str) -> bool:
    """Проверить доступ юзера к пулу."""
    if user.is_admin:
        return True
    plan = user.plan or "free"
    if plan.startswith("corporate"):
        plan = "corporate"
    access = POOL_ACCESS.get(plan, [])
    if access == "all":
        return True
    return pool_id in access


async def increment_task_usage(user: User, db: AsyncSession) -> None:
    user.tasks_used_this_month += 1
    await db.commit()
