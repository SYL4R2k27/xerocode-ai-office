from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/org", tags=["Audit"])


def _require_manager(user: User) -> None:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
    if user.org_role not in ("owner", "manager"):
        raise HTTPException(status_code=403, detail="Manager or owner access required")


@router.get("/audit")
async def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    action: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    org_id = current_user.organization_id

    query = (
        select(AuditLog)
        .where(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
    )
    if action:
        query = query.where(AuditLog.action == action)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
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
