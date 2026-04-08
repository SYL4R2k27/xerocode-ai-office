"""Document Registry — CRUD, versions, approval flow."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.document_registry import ApprovalRoute, ApprovalStep, DocumentRecord, DocumentTemplate

router = APIRouter(prefix="/docs", tags=["document-registry"])


async def _gen_doc_number(db: AsyncSession, org_id, doc_type: str) -> str:
    year = datetime.now().year
    prefix = {"incoming": "IN", "outgoing": "OUT", "internal": "INT"}.get(doc_type, "DOC")
    count = (await db.execute(
        select(func.count()).select_from(DocumentRecord).where(
            DocumentRecord.organization_id == org_id,
            DocumentRecord.doc_type == doc_type,
        )
    )).scalar() or 0
    return f"{prefix}-{year}-{count + 1:04d}"


@router.get("/registry")
async def list_documents(
    doc_type: str = None,
    status: str = None,
    category: str = None,
    limit: int = 50,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    q = select(DocumentRecord).where(DocumentRecord.organization_id == org_id).order_by(desc(DocumentRecord.created_at)).limit(limit)
    if doc_type:
        q = q.where(DocumentRecord.doc_type == doc_type)
    if status:
        q = q.where(DocumentRecord.status == status)
    if category:
        q = q.where(DocumentRecord.category == category)

    result = await db.execute(q)
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id), "doc_number": d.doc_number, "doc_type": d.doc_type,
            "category": d.category, "title": d.title, "status": d.status,
            "version": d.version, "created_at": str(d.created_at),
        }
        for d in docs
    ]


@router.post("/registry", status_code=201)
async def create_document(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    doc_type = data.get("doc_type", "internal")
    doc_number = await _gen_doc_number(db, org_id, doc_type)

    doc = DocumentRecord(
        organization_id=org_id,
        doc_number=doc_number,
        doc_type=doc_type,
        category=data.get("category", "other"),
        title=data.get("title", "Untitled"),
        description=data.get("description"),
        created_by=user.id,
        assignee_id=data.get("assignee_id"),
        deal_id=data.get("deal_id"),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": str(doc.id), "doc_number": doc.doc_number}


@router.get("/registry/{doc_id}")
async def get_document(doc_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentRecord).where(DocumentRecord.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    return {
        "id": str(doc.id), "doc_number": doc.doc_number, "doc_type": doc.doc_type,
        "category": doc.category, "title": doc.title, "description": doc.description,
        "status": doc.status, "version": doc.version, "file_path": doc.file_path,
        "signed_by": doc.signed_by, "signed_at": str(doc.signed_at) if doc.signed_at else None,
        "created_at": str(doc.created_at), "updated_at": str(doc.updated_at),
    }


@router.post("/registry/{doc_id}/submit-approval")
async def submit_for_approval(doc_id: str, data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentRecord).where(DocumentRecord.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status != "draft":
        raise HTTPException(400, "Only draft documents can be submitted")

    route_id = data.get("route_id")
    doc.status = "approval"
    doc.approval_route_id = route_id
    doc.current_approval_step = 0
    await db.commit()
    return {"detail": "Document submitted for approval", "status": "approval"}


@router.post("/approval/{step_id}/decide")
async def decide_approval(step_id: str, data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApprovalStep).where(ApprovalStep.id == step_id))
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(404, "Approval step not found")

    action = data.get("action", "approved")  # approved, rejected
    step.status = action
    step.comment = data.get("comment", "")
    step.decided_at = datetime.utcnow()
    step.approver_id = user.id

    # Update document status if rejected or all approved
    doc_result = await db.execute(select(DocumentRecord).where(DocumentRecord.id == step.document_id))
    doc = doc_result.scalar_one_or_none()
    if doc:
        if action == "rejected":
            doc.status = "rejected"
        elif action == "approved":
            doc.current_approval_step += 1

    await db.commit()
    return {"detail": f"Step {action}", "status": action}


# Templates
@router.get("/templates")
async def list_templates(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        return []
    result = await db.execute(
        select(DocumentTemplate).where(DocumentTemplate.organization_id == org_id)
    )
    return [
        {"id": str(t.id), "name": t.name, "category": t.category, "fields_count": len(t.fields or [])}
        for t in result.scalars().all()
    ]


@router.post("/templates", status_code=201)
async def create_template(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    tpl = DocumentTemplate(
        organization_id=org_id,
        name=data.get("name", "Untitled"),
        category=data.get("category", "other"),
        description=data.get("description"),
        content_template=data.get("content_template", ""),
        fields=data.get("fields", []),
        created_by=user.id,
    )
    db.add(tpl)
    await db.commit()
    return {"id": str(tpl.id), "name": tpl.name}


# Approval routes
@router.get("/approval-routes")
async def list_approval_routes(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        return []
    result = await db.execute(
        select(ApprovalRoute).where(ApprovalRoute.organization_id == org_id)
    )
    return [
        {"id": str(r.id), "name": r.name, "steps_count": len(r.steps or [])}
        for r in result.scalars().all()
    ]


@router.post("/approval-routes", status_code=201)
async def create_approval_route(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    route = ApprovalRoute(
        organization_id=org_id,
        name=data.get("name", "Default Route"),
        description=data.get("description"),
        steps=data.get("steps", []),
        created_by=user.id,
    )
    db.add(route)
    await db.commit()
    return {"id": str(route.id), "name": route.name}
