from __future__ import annotations

import platform
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin import get_admin_user
from app.core.database import get_db
from app.core.model_pools import get_all_pools
from app.core.model_registry import get_all_models
from app.models.agent import Agent
from app.models.goal import Goal
from app.models.message import Message
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Schemas ──────────────────────────────────────────────────────────


class AdminUserUpdate(BaseModel):
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    tasks_used_this_month: Optional[int] = None


class SetPlanRequest(BaseModel):
    plan: str  # free / pro / ultima


# ── Users management ─────────────────────────────────────────────────


@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List all users with pagination."""
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar() or 0

    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return {"total": total, "skip": skip, "limit": limit, "users": [_user_dict(u) for u in users]}


@router.get("/users/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Get user details."""
    user = await _fetch_user(db, user_id)
    return _user_dict(user)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Update user fields (plan, is_active, is_admin, tasks_used_this_month)."""
    user = await _fetch_user(db, user_id)
    update_data = data.model_dump(exclude_unset=True)
    if "plan" in update_data and update_data["plan"] not in ("free", "pro", "ultima", "admin"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return _user_dict(user)


@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Deactivate user (soft delete)."""
    user = await _fetch_user(db, user_id)
    user.is_active = False
    await db.commit()
    return {"detail": "User deactivated"}


# ── Subscription management ──────────────────────────────────────────


@router.post("/users/{user_id}/set-plan")
async def set_plan(
    user_id: uuid.UUID,
    data: SetPlanRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Change user subscription plan."""
    if data.plan not in ("free", "pro", "ultima"):
        raise HTTPException(status_code=400, detail="Invalid plan. Must be free, pro, or ultima.")
    user = await _fetch_user(db, user_id)
    user.plan = data.plan
    await db.commit()
    await db.refresh(user)
    return _user_dict(user)


@router.post("/users/{user_id}/reset-tasks")
async def reset_tasks(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Reset monthly task counter for user."""
    user = await _fetch_user(db, user_id)
    user.tasks_used_this_month = 0
    await db.commit()
    return {"detail": "Task counter reset", "user_id": str(user_id)}


# ── Platform stats ───────────────────────────────────────────────────


@router.get("/stats")
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Aggregate platform statistics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))
    ).scalar() or 0

    # Users by plan
    plan_rows = (
        await db.execute(select(User.plan, func.count(User.id)).group_by(User.plan))
    ).all()
    users_by_plan = {row[0]: row[1] for row in plan_rows}

    total_goals = (await db.execute(select(func.count(Goal.id)))).scalar() or 0
    total_tasks = (await db.execute(select(func.count(Task.id)))).scalar() or 0
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar() or 0

    total_cost_result = await db.execute(select(func.coalesce(func.sum(Message.cost_usd), 0.0)))
    total_cost = float(total_cost_result.scalar())

    return {
        "total_users": total_users,
        "active_users": active_users,
        "users_by_plan": users_by_plan,
        "total_goals": total_goals,
        "total_tasks": total_tasks,
        "total_messages": total_messages,
        "total_cost_usd": round(total_cost, 4),
        "server": {
            "python": platform.python_version(),
            "system": platform.system(),
            "machine": platform.machine(),
        },
    }


# ── Model / pool management ─────────────────────────────────────────


@router.get("/models")
async def list_models(_admin: User = Depends(get_admin_user)):
    """List all models from registry."""
    return get_all_models()


@router.get("/pools")
async def list_pools(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List all pools with usage stats."""
    pools = get_all_pools()
    # Attach agent counts per provider/model from DB
    agent_counts_result = await db.execute(
        select(Agent.provider, Agent.model_name, func.count(Agent.id)).group_by(
            Agent.provider, Agent.model_name
        )
    )
    agent_counts = {
        f"{row[0]}/{row[1]}": row[2] for row in agent_counts_result.all()
    }
    for pool in pools:
        pool["active_agents"] = sum(
            agent_counts.get(f"{a['provider']}/{a['model_name']}", 0)
            for a in pool.get("agents", [])
        )
    return pools


# ── Helpers ──────────────────────────────────────────────────────────


async def _fetch_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _user_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "tasks_used_this_month": user.tasks_used_this_month,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
