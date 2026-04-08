"""HR API — employees, time off, onboarding."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.hr import Employee, TimeOffRequest, OnboardingChecklist

router = APIRouter(prefix="/hr", tags=["hr"])


@router.get("/employees")
async def list_employees(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        return []
    result = await db.execute(select(Employee).where(Employee.organization_id == org_id))
    return [
        {
            "id": str(e.id), "user_id": str(e.user_id), "department": e.department,
            "position": e.position, "hire_date": str(e.hire_date) if e.hire_date else None,
            "contract_type": e.contract_type,
        }
        for e in result.scalars().all()
    ]


@router.get("/time-off")
async def list_time_off(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        return []
    result = await db.execute(
        select(TimeOffRequest).join(Employee).where(Employee.organization_id == org_id)
    )
    return [
        {
            "id": str(t.id), "employee_id": str(t.employee_id), "type": t.type,
            "start_date": str(t.start_date), "end_date": str(t.end_date),
            "status": t.status, "comment": t.comment,
        }
        for t in result.scalars().all()
    ]


@router.post("/time-off", status_code=201)
async def create_time_off(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    employee = (await db.execute(select(Employee).where(Employee.user_id == user.id))).scalar_one_or_none()
    if not employee:
        raise HTTPException(400, "Employee profile not found")
    req = TimeOffRequest(
        employee_id=employee.id,
        type=data.get("type", "vacation"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        comment=data.get("comment"),
    )
    db.add(req)
    await db.commit()
    return {"id": str(req.id), "status": "pending"}


@router.patch("/time-off/{request_id}/decide")
async def decide_time_off(request_id: str, data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    # Manager+ only
    if user.org_role not in ("owner", "manager"):
        raise HTTPException(403, "Only managers can approve time-off requests")
    # Verify request belongs to same org
    result = await db.execute(
        select(TimeOffRequest).join(Employee, TimeOffRequest.employee_id == Employee.id)
        .where(TimeOffRequest.id == request_id, Employee.organization_id == org_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = data.get("action", "approved")
    req.approved_by = user.id
    await db.commit()
    return {"detail": f"Request {req.status}"}
