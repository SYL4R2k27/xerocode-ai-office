from __future__ import annotations

import json
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.goal import Goal
from app.models.organization import Organization
from app.models.task import Task
from app.models.user import User
from app.schemas.organization import (
    InviteCreate,
    OrgCreate,
    OrgMember,
    OrgResponse,
    OrgStats,
    RoleUpdate,
)

router = APIRouter(prefix="/org", tags=["Organization"])


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


async def _log_action(
    db: AsyncSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    action: str,
    details: dict | None = None,
) -> None:
    log = AuditLog(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        details=json.dumps(details or {}),
    )
    db.add(log)


def _require_org(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
    return user.organization_id


def _require_owner(user: User) -> None:
    _require_org(user)
    if user.org_role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")


def _require_manager(user: User) -> None:
    _require_org(user)
    if user.org_role not in ("owner", "manager"):
        raise HTTPException(status_code=403, detail="Manager or owner access required")


# ── Create organization ──────────────────────────────────────────────

@router.post("/create", response_model=OrgResponse, status_code=201)
async def create_org(
    data: OrgCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.organization_id:
        raise HTTPException(status_code=400, detail="User already belongs to an organization")

    slug = _slugify(data.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid organization name")

    # Check uniqueness
    existing = await db.execute(
        select(Organization).where(
            (Organization.name == data.name) | (Organization.slug == slug)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Organization name already taken")

    org = Organization(name=data.name, slug=slug, owner_id=current_user.id)
    db.add(org)
    await db.flush()

    # Make user the owner
    current_user.organization_id = org.id
    current_user.org_role = "owner"

    await _log_action(db, org.id, current_user.id, "created_organization", {"name": data.name})
    await db.commit()
    await db.refresh(org)

    return OrgResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        max_members=org.max_members,
        member_count=1,
        created_at=org.created_at,
    )


# ── Get current user's organization ──────────────────────────────────

@router.get("/me", response_model=OrgResponse)
async def get_my_org(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = _require_org(current_user)
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    count_result = await db.execute(
        select(func.count()).select_from(User).where(User.organization_id == org_id)
    )
    member_count = count_result.scalar() or 0

    return OrgResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        max_members=org.max_members,
        member_count=member_count,
        created_at=org.created_at,
    )


# ── List members ─────────────────────────────────────────────────────

@router.get("/members", response_model=list[OrgMember])
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    return result.scalars().all()


# ── Invite member ────────────────────────────────────────────────────

@router.post("/invite", status_code=200)
async def invite_member(
    data: InviteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_owner(current_user)
    org_id = current_user.organization_id

    # Check member limit
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    count_result = await db.execute(
        select(func.count()).select_from(User).where(User.organization_id == org_id)
    )
    member_count = count_result.scalar() or 0
    if member_count >= org.max_members:
        raise HTTPException(
            status_code=400,
            detail=f"Organization has reached the member limit ({org.max_members})",
        )

    # Find user by email
    user_result = await db.execute(select(User).where(User.email == data.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    if user.organization_id:
        raise HTTPException(status_code=400, detail="User already belongs to an organization")

    user.organization_id = org_id
    user.org_role = data.role

    await _log_action(
        db, org_id, current_user.id, "invited_member",
        {"email": data.email, "role": data.role},
    )
    await db.commit()
    return {"detail": f"User {data.email} added to organization as {data.role}"}


# ── Change member role ───────────────────────────────────────────────

@router.patch("/members/{user_id}/role")
async def change_member_role(
    user_id: uuid.UUID,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_owner(current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target or target.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Member not found in organization")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    target.org_role = data.role

    await _log_action(
        db, current_user.organization_id, current_user.id, "changed_member_role",
        {"target_user_id": str(user_id), "new_role": data.role},
    )
    await db.commit()
    return {"detail": f"Role updated to {data.role}"}


# ── Remove member ────────────────────────────────────────────────────

@router.delete("/members/{user_id}", status_code=200)
async def remove_member(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_owner(current_user)

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target or target.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Member not found in organization")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the organization")

    target.organization_id = None
    target.org_role = None

    await _log_action(
        db, current_user.organization_id, current_user.id, "removed_member",
        {"target_user_id": str(user_id)},
    )
    await db.commit()
    return {"detail": "Member removed from organization"}


# ── Organization statistics ──────────────────────────────────────────

@router.get("/stats", response_model=OrgStats)
async def org_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    org_id = current_user.organization_id

    member_count = (
        await db.execute(
            select(func.count()).select_from(User).where(User.organization_id == org_id)
        )
    ).scalar() or 0

    # Get all goals created by org members
    member_ids_q = select(User.id).where(User.organization_id == org_id)

    total_goals = (
        await db.execute(
            select(func.count()).select_from(Goal)
        )
    ).scalar() or 0

    # Task statistics
    task_counts = {}
    for status_val in ("done", "in_progress", "pending"):
        count = (
            await db.execute(
                select(func.count()).select_from(Task).where(Task.status == status_val)
            )
        ).scalar() or 0
        task_counts[status_val] = count

    total_tasks = sum(task_counts.values())

    return OrgStats(
        total_members=member_count,
        total_goals=total_goals,
        total_tasks=total_tasks,
        tasks_done=task_counts.get("done", 0),
        tasks_in_progress=task_counts.get("in_progress", 0),
        tasks_pending=task_counts.get("pending", 0),
    )


# ── Recent activity log ─────────────────────────────────────────────

@router.get("/activity")
async def org_activity(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    org_id = current_user.organization_id

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "action": log.action,
            "details": json.loads(log.details) if log.details else {},
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
