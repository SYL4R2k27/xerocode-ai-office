from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.user import User
from app.models.memory import Memory
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(data: GoalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Создать новую цель. Начало всего — пользователь ставит задачу команде."""
    goal = Goal(**data.model_dump())
    db.add(goal)
    await db.flush()  # get goal.id before creating memory

    # Создаем память для этой цели
    memory = Memory(goal_id=goal.id, global_context=data.description or data.title)
    db.add(memory)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("/", response_model=list[GoalResponse])
async def list_goals(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Список всех целей."""
    query = select(Goal).order_by(Goal.created_at.desc())
    if status:
        query = query.where(Goal.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    """Получить цель по ID."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Обновить цель (статус, режим, и т.д.)."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Удалить цель и все связанные данные."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
