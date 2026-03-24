from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

PLAN_LIMITS: dict[str, dict] = {
    "free": {"max_agents": 3, "max_tasks_month": 50, "max_images_month": 0},
    "pro": {"max_agents": 10, "max_tasks_month": 500, "max_images_month": 100},
    "pro_plus": {"max_agents": 15, "max_tasks_month": 2000, "max_images_month": 500},
    "ultima": {"max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999},
    "corporate": {"max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999},
    "admin": {"max_agents": 999, "max_tasks_month": 999999, "max_images_month": 999999},
}


def _get_limits(user: User) -> dict:
    plan = "admin" if user.is_admin else user.plan
    # Corporate plan variants (corporate_5, corporate_10, etc.) map to "corporate" limits
    if plan and plan.startswith("corporate"):
        plan = "corporate"
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])


def check_subscription_limits(user: User, action: str) -> None:
    """Raise 403 if the user's plan does not allow *action*."""
    limits = _get_limits(user)
    if action == "create_agent":
        # caller must use check_can_create_agent instead
        pass
    elif action == "create_task":
        if user.tasks_used_this_month >= limits["max_tasks_month"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Monthly task limit reached ({limits['max_tasks_month']}). Upgrade your plan.",
            )


def check_can_create_agent(user: User, current_agent_count: int) -> bool:
    limits = _get_limits(user)
    return current_agent_count < limits["max_agents"]


def check_can_create_task(user: User) -> bool:
    limits = _get_limits(user)
    return user.tasks_used_this_month < limits["max_tasks_month"]


async def increment_task_usage(user: User, db: AsyncSession) -> None:
    user.tasks_used_this_month += 1
    await db.commit()
