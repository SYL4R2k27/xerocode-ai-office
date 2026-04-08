"""CRM: Deals + Contacts + Pipeline + Activities + Analytics — full Bitrix24-level."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.crm import Contact, Deal, DealActivity
from app.models.user import User

router = APIRouter(prefix="/crm", tags=["CRM"])

STAGES = ["lead", "qualification", "proposal", "negotiation", "decision", "won", "lost", "post_sale"]
STAGE_LABELS = {
    "lead": "Лид", "qualification": "Квалификация", "proposal": "КП отправлено",
    "negotiation": "Переговоры", "decision": "Решение", "won": "Выиграна",
    "lost": "Проиграна", "post_sale": "Пост-продажа",
    # Legacy compat
    "new": "Новая", "contact": "Контакт",
}

PRIORITIES = {"low": "Низкий", "medium": "Средний", "high": "Высокий", "critical": "Критичный"}
SOURCES = {"website": "Сайт", "phone": "Телефон", "email": "Email", "referral": "Реферал", "social": "Соцсети", "ad": "Реклама"}


# ── Schemas ─────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    notes: str | None = None
    source: str | None = None

class DealCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    amount: float = 0.0
    currency: str = "RUB"
    stage: str = "lead"
    contact_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    description: str | None = None
    source: str | None = None
    priority: str = "medium"
    expected_close: str | None = None

class ActivityCreate(BaseModel):
    activity_type: str  # call, email, meeting, note, comment
    description: str | None = None
    metadata: dict | None = None


def _require_org(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise HTTPException(400, "User does not belong to an organization")
    return user.organization_id


# ── Contacts ────────────────────────────────────────────────────────

@router.get("/contacts")
async def list_contacts(
    search: str | None = None, source: str | None = None, limit: int = 100,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    q = select(Contact).where(Contact.organization_id == org_id).order_by(desc(Contact.created_at)).limit(limit)
    if search:
        q = q.where(Contact.name.ilike(f"%{search}%") | Contact.company.ilike(f"%{search}%") | Contact.email.ilike(f"%{search}%"))
    if source:
        q = q.where(Contact.source == source)
    result = await db.execute(q)
    return [
        {
            "id": str(c.id), "name": c.name, "email": c.email, "phone": c.phone,
            "company": c.company, "position": c.position, "notes": c.notes,
            "source": c.source, "tags": c.tags,
            "created_at": c.created_at.isoformat() if c.created_at else "",
        }
        for c in result.scalars().all()
    ]


@router.post("/contacts", status_code=201)
async def create_contact(data: ContactCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    contact = Contact(
        organization_id=org_id, name=data.name, email=data.email,
        phone=data.phone, company=data.company, position=data.position,
        notes=data.notes, source=data.source, created_by=user.id,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return {
        "id": str(contact.id), "name": contact.name, "email": contact.email,
        "phone": contact.phone, "company": contact.company, "position": contact.position,
        "notes": contact.notes, "source": contact.source,
        "created_at": contact.created_at.isoformat() if contact.created_at else "",
    }


@router.get("/contacts/{contact_id}")
async def get_contact(contact_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.organization_id == org_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contact not found")

    # Get deals linked to this contact
    deals_result = await db.execute(
        select(Deal).where(Deal.contact_id == contact_id, Deal.organization_id == org_id).order_by(desc(Deal.updated_at))
    )
    deals = deals_result.scalars().all()

    return {
        "id": str(c.id), "name": c.name, "email": c.email, "phone": c.phone,
        "company": c.company, "position": c.position, "notes": c.notes,
        "source": c.source, "tags": c.tags,
        "created_at": c.created_at.isoformat() if c.created_at else "",
        "deals": [
            {"id": str(d.id), "title": d.title, "amount": d.amount, "stage": d.stage}
            for d in deals
        ],
    }


@router.patch("/contacts/{contact_id}")
async def update_contact(contact_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.organization_id == org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(404, "Contact not found")
    for field in ["name", "email", "phone", "company", "position", "notes", "source", "tags"]:
        if field in data:
            setattr(contact, field, data[field])
    await db.commit()
    return {"detail": "Contact updated"}


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    result = await db.execute(select(Contact).where(Contact.id == contact_id, Contact.organization_id == org_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(404, "Contact not found")
    await db.delete(contact)
    await db.commit()
    return {"detail": "Contact deleted"}


# ── Deals ───────────────────────────────────────────────────────────

@router.get("/deals")
async def list_deals(
    stage: str | None = None, assignee_id: str | None = None,
    priority: str | None = None, search: str | None = None, limit: int = 200,
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user),
):
    org_id = _require_org(user)
    q = select(Deal).where(Deal.organization_id == org_id).order_by(desc(Deal.updated_at)).limit(limit)
    if stage:
        q = q.where(Deal.stage == stage)
    if assignee_id:
        q = q.where(Deal.assignee_id == assignee_id)
    if priority:
        q = q.where(Deal.priority == priority)
    if search:
        q = q.where(Deal.title.ilike(f"%{search}%"))
    result = await db.execute(q)
    deals = result.scalars().all()

    # Batch fetch contact and assignee names
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
        responses.append({
            "id": str(d.id), "title": d.title, "amount": d.amount, "currency": d.currency,
            "stage": d.stage, "contact_id": str(d.contact_id) if d.contact_id else None,
            "assignee_id": str(d.assignee_id) if d.assignee_id else None,
            "description": d.description, "source": d.source, "priority": d.priority or "medium",
            "qualification_score": d.qualification_score, "next_action": d.next_action,
            "next_action_date": d.next_action_date.isoformat() if d.next_action_date else None,
            "expected_close": d.expected_close.isoformat() if d.expected_close else None,
            "lost_reason": d.lost_reason, "won_date": d.won_date.isoformat() if d.won_date else None,
            "contact_name": contact_name, "assignee_name": assignee_name,
            "created_at": d.created_at.isoformat() if d.created_at else "",
            "updated_at": d.updated_at.isoformat() if d.updated_at else "",
        })
    return responses


@router.get("/deals/{deal_id}")
async def get_deal(deal_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get deal detail with full activity timeline."""
    org_id = _require_org(user)
    result = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Deal not found")

    # Get activities
    act_result = await db.execute(
        select(DealActivity, User.name.label("user_name"))
        .join(User, DealActivity.user_id == User.id, isouter=True)
        .where(DealActivity.deal_id == deal_id)
        .order_by(desc(DealActivity.created_at))
    )
    activities = [
        {
            "id": str(a.id), "activity_type": a.activity_type,
            "description": a.description, "metadata": a.metadata_,
            "user_name": user_name or "Unknown",
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a, user_name in act_result.all()
    ]

    contact_name = None
    if d.contact_id:
        cr = await db.execute(select(Contact.name).where(Contact.id == d.contact_id))
        contact_name = cr.scalar_one_or_none()

    assignee_name = None
    if d.assignee_id:
        ur = await db.execute(select(User.name).where(User.id == d.assignee_id))
        assignee_name = ur.scalar_one_or_none()

    return {
        "id": str(d.id), "title": d.title, "amount": d.amount, "currency": d.currency,
        "stage": d.stage, "description": d.description,
        "source": d.source, "priority": d.priority or "medium",
        "qualification_score": d.qualification_score,
        "next_action": d.next_action,
        "next_action_date": d.next_action_date.isoformat() if d.next_action_date else None,
        "expected_close": d.expected_close.isoformat() if d.expected_close else None,
        "lost_reason": d.lost_reason,
        "won_date": d.won_date.isoformat() if d.won_date else None,
        "linked_task_ids": d.linked_task_ids or [],
        "linked_doc_ids": d.linked_doc_ids or [],
        "contact_id": str(d.contact_id) if d.contact_id else None,
        "contact_name": contact_name,
        "assignee_id": str(d.assignee_id) if d.assignee_id else None,
        "assignee_name": assignee_name,
        "activities": activities,
        "created_at": d.created_at.isoformat() if d.created_at else "",
        "updated_at": d.updated_at.isoformat() if d.updated_at else "",
    }


@router.post("/deals", status_code=201)
async def create_deal(data: DealCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    expected_close = None
    if data.expected_close:
        try:
            expected_close = datetime.fromisoformat(data.expected_close)
        except ValueError:
            pass

    deal = Deal(
        organization_id=org_id, title=data.title, amount=data.amount,
        currency=data.currency, stage=data.stage, contact_id=data.contact_id,
        assignee_id=data.assignee_id, description=data.description,
        source=data.source, priority=data.priority, expected_close=expected_close,
        created_by=user.id,
    )
    db.add(deal)
    await db.flush()

    # Auto-create "deal created" activity
    activity = DealActivity(
        deal_id=deal.id, user_id=user.id,
        activity_type="note", description="Сделка создана",
        metadata_={"stage": data.stage, "amount": data.amount},
    )
    db.add(activity)
    await db.commit()
    await db.refresh(deal)
    return {
        "id": str(deal.id), "title": deal.title, "amount": deal.amount,
        "currency": deal.currency, "stage": deal.stage, "priority": deal.priority,
        "source": deal.source,
        "created_at": deal.created_at.isoformat() if deal.created_at else "",
        "updated_at": deal.updated_at.isoformat() if deal.updated_at else "",
    }


@router.patch("/deals/{deal_id}")
async def update_deal(deal_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    result = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")

    old_stage = deal.stage

    for field in ["title", "amount", "currency", "stage", "contact_id", "assignee_id",
                   "description", "source", "priority", "qualification_score",
                   "next_action", "next_action_date", "lost_reason", "expected_close",
                   "linked_task_ids", "linked_doc_ids"]:
        if field in data:
            val = data[field]
            if field in ("next_action_date", "expected_close") and isinstance(val, str):
                try:
                    val = datetime.fromisoformat(val)
                except ValueError:
                    val = None
            setattr(deal, field, val)

    # Auto-track stage changes
    if "stage" in data and data["stage"] != old_stage:
        if data["stage"] == "won":
            deal.won_date = datetime.utcnow()
        activity = DealActivity(
            deal_id=deal.id, user_id=user.id,
            activity_type="stage_change",
            description=f"{STAGE_LABELS.get(old_stage, old_stage)} → {STAGE_LABELS.get(data['stage'], data['stage'])}",
            metadata_={"from_stage": old_stage, "to_stage": data["stage"]},
        )
        db.add(activity)

    await db.commit()
    return {"detail": "Deal updated", "stage": deal.stage}


@router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    result = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")
    await db.delete(deal)
    await db.commit()
    return {"detail": "Deal deleted"}


# ── Deal Activities ─────────────────────────────────────────────────

@router.get("/deals/{deal_id}/activities")
async def list_activities(deal_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    _require_org(user)
    result = await db.execute(
        select(DealActivity, User.name.label("user_name"))
        .join(User, DealActivity.user_id == User.id, isouter=True)
        .where(DealActivity.deal_id == deal_id)
        .order_by(desc(DealActivity.created_at))
    )
    return [
        {
            "id": str(a.id), "activity_type": a.activity_type,
            "description": a.description, "metadata": a.metadata_,
            "user_name": user_name or "Unknown",
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a, user_name in result.all()
    ]


@router.post("/deals/{deal_id}/activities", status_code=201)
async def add_activity(deal_id: uuid.UUID, data: ActivityCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    # Verify deal exists
    deal_check = await db.execute(select(Deal).where(Deal.id == deal_id, Deal.organization_id == org_id))
    if not deal_check.scalar_one_or_none():
        raise HTTPException(404, "Deal not found")

    activity = DealActivity(
        deal_id=deal_id, user_id=user.id,
        activity_type=data.activity_type,
        description=data.description,
        metadata_=data.metadata,
    )
    db.add(activity)
    await db.commit()
    return {"id": str(activity.id), "activity_type": activity.activity_type}


# ── Pipeline stats ──────────────────────────────────────────────────

@router.get("/pipeline")
async def pipeline_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    org_id = _require_org(user)
    stages = {}
    for stage in STAGES:
        count = (await db.execute(
            select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        total = (await db.execute(
            select(func.coalesce(func.sum(Deal.amount), 0)).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        stages[stage] = {"count": count, "total_amount": round(float(total), 2), "label": STAGE_LABELS.get(stage, stage)}
    return {"stages": stages}


# ── Sales Analytics ─────────────────────────────────────────────────

@router.get("/analytics")
async def crm_analytics(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Full sales analytics — conversion, avg deal, cycle, top performers."""
    org_id = _require_org(user)

    # Total deals
    total_deals = (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id)
    )).scalar() or 0

    # Won deals
    won_deals = (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == "won")
    )).scalar() or 0

    # Lost deals
    lost_deals = (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == "lost")
    )).scalar() or 0

    # Total won revenue
    won_revenue = (await db.execute(
        select(func.coalesce(func.sum(Deal.amount), 0)).where(Deal.organization_id == org_id, Deal.stage == "won")
    )).scalar() or 0

    # Average deal size (won)
    avg_deal = round(float(won_revenue) / max(won_deals, 1), 2)

    # Conversion rate
    active_and_closed = total_deals - (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == "lead")
    )).scalar() or 0
    conversion_rate = round(won_deals / max(active_and_closed, 1) * 100, 1)

    # Pipeline value (active deals)
    pipeline_value = (await db.execute(
        select(func.coalesce(func.sum(Deal.amount), 0)).where(
            Deal.organization_id == org_id,
            Deal.stage.notin_(["won", "lost", "post_sale"]),
        )
    )).scalar() or 0

    # Deals by stage (funnel)
    funnel = []
    for stage in STAGES:
        count = (await db.execute(
            select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        amount = (await db.execute(
            select(func.coalesce(func.sum(Deal.amount), 0)).where(Deal.organization_id == org_id, Deal.stage == stage)
        )).scalar() or 0
        funnel.append({"stage": stage, "label": STAGE_LABELS.get(stage, stage), "count": count, "amount": round(float(amount), 2)})

    # Deals by source
    by_source = {}
    for src_key, src_label in SOURCES.items():
        count = (await db.execute(
            select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.source == src_key)
        )).scalar() or 0
        if count > 0:
            by_source[src_key] = {"label": src_label, "count": count}

    # This month stats
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_this_month = (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.created_at >= month_start)
    )).scalar() or 0
    won_this_month = (await db.execute(
        select(func.count()).select_from(Deal).where(Deal.organization_id == org_id, Deal.stage == "won", Deal.won_date >= month_start)
    )).scalar() or 0

    return {
        "total_deals": total_deals,
        "won_deals": won_deals,
        "lost_deals": lost_deals,
        "won_revenue": round(float(won_revenue), 2),
        "avg_deal_size": avg_deal,
        "conversion_rate": conversion_rate,
        "pipeline_value": round(float(pipeline_value), 2),
        "funnel": funnel,
        "by_source": by_source,
        "new_this_month": new_this_month,
        "won_this_month": won_this_month,
    }
