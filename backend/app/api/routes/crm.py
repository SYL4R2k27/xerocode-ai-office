"""CRM: Deals (сделки) + Contacts (контакты) + Pipeline."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.crm import Contact, Deal
from app.models.user import User

router = APIRouter(prefix="/crm", tags=["CRM"])

STAGES = ["new", "contact", "proposal", "negotiation", "won", "lost"]
STAGE_LABELS = {
    "new": "Новая", "contact": "Контакт", "proposal": "КП отправлено",
    "negotiation": "Переговоры", "won": "Выиграна", "lost": "Проиграна",
}


# ── Schemas ─────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    notes: str | None = None

class ContactResponse(BaseModel):
    id: uuid.UUID; name: str; email: str | None; phone: str | None
    company: str | None; position: str | None; notes: str | None
    created_at: str
    model_config = {"from_attributes": True}

class DealCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    amount: float = 0.0
    currency: str = "RUB"
    stage: str = Field(default="new", pattern="^(new|contact|proposal|negotiation|won|lost)$")
    contact_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    description: str | None = None

class DealResponse(BaseModel):
    id: uuid.UUID; title: str; amount: float; currency: str; stage: str
    contact_id: uuid.UUID | None; assignee_id: uuid.UUID | None
    description: str | None; created_at: str; updated_at: str
    contact_name: str | None = None; assignee_name: str | None = None
    model_config = {"from_attributes": True}


def _require_org(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise HTTPException(400, "User does not belong to an organization")
    return user.organization_id


# ── Contacts ────────────────────────────────────────────────────────

@router.get("/contacts", response_model=list[ContactResponse])
async def list_contacts(
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    q = select(Contact).where(Contact.organization_id == org_id).order_by(Contact.created_at.desc())
    if search:
        q = q.where(Contact.name.ilike(f"%{search}%") | Contact.company.ilike(f"%{search}%"))
    result = await db.execute(q)
    return [ContactResponse(
        id=c.id, name=c.name, email=c.email, phone=c.phone,
        company=c.company, position=c.position, notes=c.notes,
        created_at=c.created_at.isoformat() if c.created_at else "",
    ) for c in result.scalars().all()]


@router.post("/contacts", response_model=ContactResponse, status_code=201)
async def create_contact(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    contact = Contact(
        organization_id=org_id, name=data.name, email=data.email,
        phone=data.phone, company=data.company, position=data.position,
        notes=data.notes, created_by=user.id,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return ContactResponse(
        id=contact.id, name=contact.name, email=contact.email, phone=contact.phone,
        company=contact.company, position=contact.position, notes=contact.notes,
        created_at=contact.created_at.isoformat() if contact.created_at else "",
    )


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.organization_id == org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(404, "Contact not found")
    await db.delete(contact)
    await db.commit()
    return {"detail": "Contact deleted"}


# ── Deals ───────────────────────────────────────────────────────────

@router.get("/deals", response_model=list[DealResponse])
async def list_deals(
    stage: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    q = select(Deal).where(Deal.organization_id == org_id).order_by(Deal.updated_at.desc())
    if stage:
        q = q.where(Deal.stage == stage)
    result = await db.execute(q)
    deals = result.scalars().all()

    # Enrich with contact/assignee names
    responses = []
    for d in deals:
        contact_name = None
        if d.contact_id:
            cr = await db.execute(select(Contact.name).where(Contact.id == d.contact_id))
            contact_name = cr.scalar_one_or_none()
        assignee_name = None
        if d.assignee_id:
            ur = await db.execute(select(User.name).where(User.id == d.assignee_id))
            assignee_name = ur.scalar_one_or_none()
        responses.append(DealResponse(
            id=d.id, title=d.title, amount=d.amount, currency=d.currency, stage=d.stage,
            contact_id=d.contact_id, assignee_id=d.assignee_id,
            description=d.description,
            created_at=d.created_at.isoformat() if d.created_at else "",
            updated_at=d.updated_at.isoformat() if d.updated_at else "",
            contact_name=contact_name, assignee_name=assignee_name,
        ))
    return responses


@router.post("/deals", response_model=DealResponse, status_code=201)
async def create_deal(
    data: DealCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    deal = Deal(
        organization_id=org_id, title=data.title, amount=data.amount,
        currency=data.currency, stage=data.stage, contact_id=data.contact_id,
        assignee_id=data.assignee_id, description=data.description,
        created_by=user.id,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return DealResponse(
        id=deal.id, title=deal.title, amount=deal.amount, currency=deal.currency, stage=deal.stage,
        contact_id=deal.contact_id, assignee_id=deal.assignee_id, description=deal.description,
        created_at=deal.created_at.isoformat() if deal.created_at else "",
        updated_at=deal.updated_at.isoformat() if deal.updated_at else "",
    )


@router.patch("/deals/{deal_id}")
async def update_deal(
    deal_id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    result = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")

    for field in ["title", "amount", "currency", "stage", "contact_id", "assignee_id", "description"]:
        if field in data:
            setattr(deal, field, data[field])

    await db.commit()
    return {"detail": "Deal updated", "stage": deal.stage}


@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    result = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")
    await db.delete(deal)
    await db.commit()
    return {"detail": "Deal deleted"}


# ── Pipeline stats ──────────────────────────────────────────────────

@router.get("/pipeline")
async def pipeline_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    stages = {}
    for stage in STAGES:
        count = (await db.execute(
            select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        total = (await db.execute(
            select(func.coalesce(func.sum(Deal.amount), 0)).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        stages[stage] = {"count": count, "total_amount": round(float(total), 2), "label": STAGE_LABELS[stage]}
    return {"stages": stages}
