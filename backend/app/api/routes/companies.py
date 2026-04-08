"""CRM Companies — separate entity from Contacts."""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User

router = APIRouter(prefix="/crm/companies", tags=["CRM-Companies"])


@router.get("/")
async def list_companies(
    search: str = None,
    limit: int = 100,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    q = (
        select(Company)
        .where(Company.organization_id == org_id)
        .order_by(desc(Company.created_at))
        .limit(limit)
    )
    if search:
        q = q.where(Company.name.ilike(f"%{search}%") | Company.inn.ilike(f"%{search}%"))
    result = await db.execute(q)
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "industry": c.industry,
            "inn": c.inn,
            "kpp": c.kpp,
            "phone": c.phone,
            "email": c.email,
            "website": c.website,
            "employee_count": c.employee_count,
            "source": c.source,
            "created_at": c.created_at.isoformat() if c.created_at else "",
        }
        for c in result.scalars().all()
    ]


@router.post("/", status_code=201)
async def create_company(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    company = Company(
        organization_id=org_id,
        name=name,
        industry=data.get("industry"),
        inn=data.get("inn"),
        kpp=data.get("kpp"),
        address=data.get("address"),
        phone=data.get("phone"),
        email=data.get("email"),
        website=data.get("website"),
        employee_count=data.get("employee_count"),
        notes=data.get("notes"),
        source=data.get("source"),
        tags=data.get("tags", []),
        created_by=user.id,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return {"id": str(company.id), "name": company.name}


@router.get("/{company_id}")
async def get_company(
    company_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.organization_id == org_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Company not found")
    # Get linked contacts
    from app.models.crm import Contact

    contacts = (
        await db.execute(
            select(Contact).where(
                Contact.organization_id == org_id, Contact.company == c.name
            )
        )
    ).scalars().all()
    # Get linked deals
    from app.models.crm import Deal

    deals = (
        await db.execute(
            select(Deal).where(
                Deal.organization_id == org_id,
                Deal.description.ilike(f"%{c.name}%"),
            )
        )
    ).scalars().all()
    return {
        "id": str(c.id),
        "name": c.name,
        "industry": c.industry,
        "inn": c.inn,
        "kpp": c.kpp,
        "address": c.address,
        "phone": c.phone,
        "email": c.email,
        "website": c.website,
        "employee_count": c.employee_count,
        "revenue_annual": c.revenue_annual,
        "notes": c.notes,
        "tags": c.tags,
        "source": c.source,
        "contacts": [
            {"id": str(ct.id), "name": ct.name, "email": ct.email} for ct in contacts
        ],
        "deals": [
            {"id": str(d.id), "title": d.title, "amount": d.amount, "stage": d.stage}
            for d in deals
        ],
        "created_at": c.created_at.isoformat() if c.created_at else "",
    }


@router.patch("/{company_id}")
async def update_company(
    company_id: str,
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.organization_id == org_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Company not found")
    for field in [
        "name", "industry", "inn", "kpp", "address", "phone",
        "email", "website", "employee_count", "revenue_annual",
        "notes", "tags", "source",
    ]:
        if field in data:
            setattr(c, field, data[field])
    await db.commit()
    return {"detail": "Company updated"}


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.organization_id == org_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Company not found")
    await db.delete(c)
    await db.commit()
    return {"detail": "Company deleted"}
