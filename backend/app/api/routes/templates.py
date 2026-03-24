from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.task_template import TaskTemplate
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["Templates"])


# ── Schemas ──────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    distribution_mode: str = Field(default="manager", pattern="^(manager|discussion|auto)$")
    category: str | None = Field(default=None, max_length=100)


class TemplateResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    distribution_mode: str
    category: str | None
    created_by: uuid.UUID
    created_at: str

    model_config = {"from_attributes": True}


class GoalFromTemplate(BaseModel):
    title: str | None = None
    description: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────

def _require_org(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
    return user.organization_id


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/", response_model=TemplateResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    template = TaskTemplate(
        organization_id=org_id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
        distribution_mode=data.distribution_mode,
        category=data.category,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return TemplateResponse(
        id=template.id,
        title=template.title,
        description=template.description,
        distribution_mode=template.distribution_mode,
        category=template.category,
        created_by=template.created_by,
        created_at=template.created_at.isoformat() if template.created_at else "",
    )


@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    result = await db.execute(
        select(TaskTemplate)
        .where(TaskTemplate.organization_id == org_id)
        .order_by(TaskTemplate.created_at.desc())
    )
    templates = result.scalars().all()
    return [
        TemplateResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            distribution_mode=t.distribution_mode,
            category=t.category,
            created_by=t.created_by,
            created_at=t.created_at.isoformat() if t.created_at else "",
        )
        for t in templates
    ]


@router.post("/{template_id}/use", status_code=201)
async def use_template(
    template_id: uuid.UUID,
    data: GoalFromTemplate | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    result = await db.execute(
        select(TaskTemplate).where(
            TaskTemplate.id == template_id,
            TaskTemplate.organization_id == org_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    goal = Goal(
        title=data.title if data and data.title else template.title,
        description=data.description if data and data.description else template.description,
        distribution_mode=template.distribution_mode,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return {
        "id": str(goal.id),
        "title": goal.title,
        "description": goal.description,
        "distribution_mode": goal.distribution_mode,
        "status": goal.status,
    }


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    result = await db.execute(
        select(TaskTemplate).where(
            TaskTemplate.id == template_id,
            TaskTemplate.organization_id == org_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()
