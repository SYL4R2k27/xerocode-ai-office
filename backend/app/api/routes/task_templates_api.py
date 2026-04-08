"""Task Templates API — create, list, delete templates; create tasks from templates."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.task_template import TaskTemplate
from app.models.task import Task

router = APIRouter(prefix="/task-templates", tags=["Task-Templates"])


@router.get("/")
async def list_templates(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List task templates for organization."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(TaskTemplate)
        .where(TaskTemplate.organization_id == org_id)
        .order_by(desc(TaskTemplate.created_at))
    )
    templates = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "distribution_mode": t.distribution_mode,
            "category": t.category,
            "created_at": t.created_at.isoformat() if t.created_at else "",
        }
        for t in templates
    ]


@router.post("/", status_code=201)
async def create_template(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task template."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    title = data.get("title", "").strip()
    if not title:
        raise HTTPException(400, "Title required")

    tpl = TaskTemplate(
        organization_id=org_id,
        created_by=user.id,
        title=title,
        description=data.get("description"),
        distribution_mode=data.get("distribution_mode", "manager"),
        category=data.get("category"),
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return {"id": str(tpl.id), "title": tpl.title}


@router.post("/{template_id}/create-task", status_code=201)
async def create_task_from_template(
    template_id: str,
    data: dict = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a task from template — fills checklist, subtasks, tags from template."""
    if data is None:
        data = {}
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(TaskTemplate).where(
            TaskTemplate.id == template_id,
            TaskTemplate.organization_id == org_id,
        )
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")

    # Create main task from template
    checklist = data.get("checklist", [])
    subtask_titles = data.get("subtask_titles", [])
    tags = data.get("tags", [])
    priority = data.get("priority", 0)

    task = Task(
        title=data.get("title", tpl.title),
        description=tpl.description or "",
        status="backlog",
        priority=priority,
        tags=tags if tags else None,
        checklist=checklist if checklist else [],
        template_id=tpl.id,
        created_by_user_id=user.id,
    )
    db.add(task)
    await db.flush()

    # Create subtasks
    subtasks_created = []
    for st_title in subtask_titles:
        sub = Task(
            title=st_title,
            status="backlog",
            parent_task_id=task.id,
            priority=priority,
            created_by_user_id=user.id,
        )
        db.add(sub)
        subtasks_created.append(st_title)

    await db.commit()
    await db.refresh(task)
    return {
        "id": str(task.id),
        "title": task.title,
        "template_id": str(tpl.id),
        "subtasks_created": len(subtasks_created),
    }


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task template."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(TaskTemplate).where(
            TaskTemplate.id == template_id,
            TaskTemplate.organization_id == org_id,
        )
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")

    await db.delete(tpl)
    await db.commit()
    return {"detail": "Template deleted"}
