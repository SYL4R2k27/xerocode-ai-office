from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String as SAString, func, select, cast
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.goal import Goal
from app.models.message import Message
from app.models.organization import Organization
from app.models.task import Task
from app.models.user import User
from app.schemas.organization import (
    InviteCreate,
    OrgActivity,
    OrgCreate,
    OrgMember,
    OrgResponse,
    OrgStats,
    OrgTaskResponse,
    RoleUpdate,
    WorkflowTransition,
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


def _org_member_goal_ids(org_id: uuid.UUID):
    """Subquery: all goal IDs belonging to org members."""
    member_ids = select(cast(User.id, SAString)).where(User.organization_id == org_id)
    return select(Goal.id).where(Goal.user_id.in_(member_ids))


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

    current_user.organization_id = org.id
    current_user.org_role = "owner"

    await _log_action(db, org.id, current_user.id, "created_organization", {"name": data.name})
    await db.commit()
    await db.refresh(org)

    return OrgResponse(
        id=org.id, name=org.name, slug=org.slug, plan=org.plan,
        max_members=org.max_members, member_count=1, created_at=org.created_at,
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
        id=org.id, name=org.name, slug=org.slug, plan=org.plan,
        max_members=org.max_members, member_count=member_count, created_at=org.created_at,
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
        {"email": data.email, "role": data.role, "target": user.name or user.email},
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
        {"target_user_id": str(user_id), "new_role": data.role, "target": target.name or target.email},
    )
    await db.commit()
    return {"detail": f"Role updated to {data.role}"}


# ── Set professional role ───────────────────────────────────────────

@router.patch("/members/{user_id}/professional-role")
async def set_professional_role(
    user_id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set professional role for a team member (owner only)."""
    _require_owner(current_user)
    from app.core.roles import ROLE_LABELS

    role = data.get("professional_role", "operator")
    if role not in ROLE_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}. Valid: {list(ROLE_LABELS.keys())}")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target or target.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Member not found")

    target.professional_role = role

    await _log_action(
        db, current_user.organization_id, current_user.id, "set_professional_role",
        {"target_user_id": str(user_id), "role": role, "target": target.name or target.email},
    )
    await db.commit()
    return {"detail": f"Professional role set to {ROLE_LABELS[role]}", "role": role}


# ── Get roles list ──────────────────────────────────────────────────

@router.get("/roles")
async def list_roles():
    """List all available professional roles."""
    from app.core.roles import ROLE_LABELS, ROLE_PERMISSIONS, ROLE_MODULES
    return [
        {
            "id": role_id,
            "label": label,
            "permissions_count": len(ROLE_PERMISSIONS.get(role_id, [])),
            "modules": ROLE_MODULES.get(role_id, []),
        }
        for role_id, label in ROLE_LABELS.items()
    ]


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
        {"target_user_id": str(user_id), "target": target.name or target.email},
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

    goal_ids_subq = _org_member_goal_ids(org_id)

    # Total goals
    total_goals = (
        await db.execute(
            select(func.count()).select_from(Goal).where(Goal.id.in_(goal_ids_subq))
        )
    ).scalar() or 0

    # Active projects (goals not completed)
    active_projects = (
        await db.execute(
            select(func.count()).select_from(Goal).where(
                Goal.id.in_(goal_ids_subq),
                Goal.status != "completed",
            )
        )
    ).scalar() or 0

    # Task statistics by status
    all_statuses = ["backlog", "in_progress", "review_operator", "review_manager", "done", "failed", "pending", "assigned"]
    task_counts = {}
    for st in all_statuses:
        count = (
            await db.execute(
                select(func.count()).select_from(Task).where(
                    Task.goal_id.in_(goal_ids_subq),
                    Task.status == st,
                )
            )
        ).scalar() or 0
        task_counts[st] = count

    total_tasks = sum(task_counts.values())

    # Completed this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    completed_this_week = (
        await db.execute(
            select(func.count()).select_from(Task).where(
                Task.goal_id.in_(goal_ids_subq),
                Task.status == "done",
                Task.updated_at >= week_ago,
            )
        )
    ).scalar() or 0

    # Total cost
    total_cost = (
        await db.execute(
            select(func.coalesce(func.sum(Message.cost_usd), 0.0)).where(
                Message.goal_id.in_(goal_ids_subq)
            )
        )
    ).scalar() or 0.0

    return OrgStats(
        total_members=member_count,
        total_goals=total_goals,
        active_projects=active_projects,
        total_tasks=total_tasks,
        tasks_done=task_counts.get("done", 0),
        tasks_in_progress=task_counts.get("in_progress", 0),
        tasks_pending=task_counts.get("pending", 0) + task_counts.get("assigned", 0),
        tasks_backlog=task_counts.get("backlog", 0),
        tasks_review_operator=task_counts.get("review_operator", 0),
        tasks_review_manager=task_counts.get("review_manager", 0),
        completed_this_week=completed_this_week,
        total_cost_usd=round(float(total_cost), 4),
    )


# ── Recent activity log ──────────────────────────────────────────────

@router.get("/activity", response_model=list[OrgActivity])
async def org_activity(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    org_id = current_user.organization_id

    result = await db.execute(
        select(AuditLog, User.name)
        .join(User, AuditLog.user_id == User.id)
        .where(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    activities = []
    for log, user_name in rows:
        details = json.loads(log.details) if log.details else {}
        activities.append(OrgActivity(
            id=log.id,
            user_name=user_name or "Unknown",
            action=log.action,
            target=details.get("target", details.get("email", "")),
            details=details,
            created_at=log.created_at,
        ))
    return activities


# ── Organization tasks (all members) ─────────────────────────────────

@router.get("/tasks", response_model=list[OrgTaskResponse])
async def org_tasks(
    status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks across all organization members. Manager+ only."""
    _require_manager(current_user)
    org_id = current_user.organization_id
    goal_ids_subq = _org_member_goal_ids(org_id)

    query = (
        select(Task, Goal.title.label("goal_title"))
        .join(Goal, Task.goal_id == Goal.id)
        .where(Goal.id.in_(goal_ids_subq))
        .order_by(Task.priority.desc(), Task.created_at.desc())
    )
    if status:
        query = query.where(Task.status == status)

    result = await db.execute(query)
    rows = result.all()

    tasks = []
    for task, goal_title in rows:
        tasks.append(OrgTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            task_type=task.task_type,
            status=task.status,
            priority=task.priority,
            goal_id=task.goal_id,
            goal_title=goal_title,
            assigned_agent_id=task.assigned_agent_id,
            created_by_ai=task.created_by_ai if hasattr(task, "created_by_ai") else False,
            operator_id=task.operator_id if hasattr(task, "operator_id") else None,
            reviewer_id=task.reviewer_id if hasattr(task, "reviewer_id") else None,
            ai_result=task.ai_result if hasattr(task, "ai_result") else None,
            review_comment=task.review_comment if hasattr(task, "review_comment") else None,
            operator_approved_at=task.operator_approved_at if hasattr(task, "operator_approved_at") else None,
            manager_approved_at=task.manager_approved_at if hasattr(task, "manager_approved_at") else None,
            created_at=task.created_at,
            updated_at=task.updated_at,
        ))
    return tasks


# ── Workflow: change task status ─────────────────────────────────────

WORKFLOW_TRANSITIONS = {
    # from_status: {to_status: required_role}
    "backlog": {"in_progress": "member"},
    "in_progress": {"review_operator": "member", "failed": "member"},
    "review_operator": {"review_manager": "member", "in_progress": "member"},
    "review_manager": {"done": "manager", "review_operator": "manager"},
    # Legacy statuses
    "pending": {"in_progress": "member", "backlog": "member"},
    "assigned": {"in_progress": "member", "backlog": "member"},
}


@router.patch("/tasks/{task_id}/status")
async def transition_task(
    task_id: uuid.UUID,
    data: WorkflowTransition,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move task through the corporate workflow."""
    _require_org(current_user)
    org_id = current_user.organization_id

    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify task belongs to org
    goal_ids_subq = _org_member_goal_ids(org_id)
    goal_check = await db.execute(
        select(Goal.id).where(Goal.id == task.goal_id, Goal.id.in_(goal_ids_subq))
    )
    if not goal_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Task does not belong to your organization")

    # Validate transition
    current_status = task.status
    new_status = data.status
    allowed = WORKFLOW_TRANSITIONS.get(current_status, {})
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current_status}' to '{new_status}'. Allowed: {list(allowed.keys())}",
        )

    # Check role requirement
    required_role = allowed[new_status]
    if required_role == "manager" and current_user.org_role not in ("owner", "manager"):
        raise HTTPException(status_code=403, detail="Manager or owner access required for this transition")

    # Apply transition
    task.status = new_status

    if new_status == "in_progress" and current_status == "backlog":
        task.operator_id = current_user.id
    elif new_status == "review_manager":
        task.operator_approved_at = datetime.utcnow()
    elif new_status == "done":
        task.reviewer_id = current_user.id
        task.manager_approved_at = datetime.utcnow()

    if data.comment:
        task.review_comment = data.comment

    await _log_action(
        db, org_id, current_user.id, "task_status_changed",
        {"task_id": str(task_id), "from": current_status, "to": new_status, "target": task.title},
    )
    await db.commit()
    return {"detail": f"Task status changed to {new_status}", "status": new_status}
