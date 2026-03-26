from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.task import Task
from app.models.user import User
from app.schemas.organization import TaskReview
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Создать задачу вручную (или вызывается Supervisor'ом)."""
    task = Task(**data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    goal_id: uuid.UUID | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список задач. Фильтр по цели и статусу."""
    query = select(Task).join(Goal, Task.goal_id == Goal.id).order_by(Task.priority.desc(), Task.created_at)
    if not current_user.is_admin:
        query = query.where(Goal.user_id == str(current_user.id))
    if goal_id:
        query = query.where(Task.goal_id == goal_id)
    if status:
        query = query.where(Task.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Task).join(Goal, Task.goal_id == Goal.id).where(Task.id == task_id)
    if not current_user.is_admin:
        query = query.where(Goal.user_id == str(current_user.id))
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Обновить задачу — статус, результат, назначение агента."""
    query = select(Task).join(Goal, Task.goal_id == Goal.id).where(Task.id == task_id)
    if not current_user.is_admin:
        query = query.where(Goal.user_id == str(current_user.id))
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Task).join(Goal, Task.goal_id == Goal.id).where(Task.id == task_id)
    if not current_user.is_admin:
        query = query.where(Goal.user_id == str(current_user.id))
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()


@router.post("/{task_id}/review", response_model=TaskResponse)
async def review_task(
    task_id: uuid.UUID,
    data: TaskReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a review for a task: approve, reject, or comment."""
    query = select(Task).join(Goal, Task.goal_id == Goal.id).where(Task.id == task_id)
    if not current_user.is_admin:
        query = query.where(Goal.user_id == str(current_user.id))
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.action == "approve":
        task.status = "done"
    elif data.action == "reject":
        task.status = "in_progress"
        if data.comment:
            existing = task.result or ""
            task.result = f"{existing}\n[REVIEW REJECTED]: {data.comment}".strip()
    elif data.action == "comment":
        if not data.comment:
            raise HTTPException(status_code=400, detail="Comment is required for comment action")
        existing = task.result or ""
        task.result = f"{existing}\n[REVIEW COMMENT]: {data.comment}".strip()

    await db.commit()
    await db.refresh(task)
    return task
