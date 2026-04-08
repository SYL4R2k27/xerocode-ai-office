"""EDO (Electronic Document Interchange) — Diadoc integration."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.connector import ConnectorConfig
from app.models.document_registry import DocumentRecord

router = APIRouter(prefix="/edo", tags=["EDO"])


# ── Setup ────────────────────────────────────────────────────────────────────
@router.post("/setup")
async def edo_setup(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save Diadoc API key + Box ID + INN to connector_configs (type=diadoc)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    api_key = data.get("api_key", "").strip()
    box_id = data.get("box_id", "").strip()
    inn = data.get("inn", "").strip()
    if not api_key or not box_id:
        raise HTTPException(400, "api_key and box_id are required")

    # Upsert — find existing or create
    result = await db.execute(
        select(ConnectorConfig).where(
            ConnectorConfig.organization_id == org_id,
            ConnectorConfig.connector_type == "diadoc",
        )
    )
    cfg = result.scalar_one_or_none()
    if cfg:
        cfg.auth_config = {"api_key": api_key, "box_id": box_id, "inn": inn}
        cfg.status = "connected"
        cfg.name = f"Diadoc ({inn})" if inn else "Diadoc"
    else:
        cfg = ConnectorConfig(
            organization_id=org_id,
            connector_type="diadoc",
            name=f"Diadoc ({inn})" if inn else "Diadoc",
            status="connected",
            auth_config={"api_key": api_key, "box_id": box_id, "inn": inn},
            sync_config={"entities": ["sf", "upd", "act", "nakladnaya"], "direction": "both"},
            created_by=user.id,
        )
        db.add(cfg)
    await db.commit()
    return {"detail": "EDO connector saved", "status": "connected"}


# ── Test connection ──────────────────────────────────────────────────────────
@router.post("/test")
async def edo_test(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Test connection to Diadoc API (mock — just check key exists)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(ConnectorConfig).where(
            ConnectorConfig.organization_id == org_id,
            ConnectorConfig.connector_type == "diadoc",
        )
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(404, "EDO connector not configured")
    auth = cfg.auth_config or {}
    if not auth.get("api_key"):
        raise HTTPException(400, "API key missing")

    # Mock test — in production would call Diadoc /GetMyOrganizations
    cfg.status = "connected"
    await db.commit()
    return {"detail": "Connection OK", "status": "connected", "box_id": auth.get("box_id")}


# ── Sync documents ───────────────────────────────────────────────────────────
@router.post("/sync")
async def edo_sync(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger document sync (placeholder — creates sample records)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(ConnectorConfig).where(
            ConnectorConfig.organization_id == org_id,
            ConnectorConfig.connector_type == "diadoc",
        )
    )
    cfg = result.scalar_one_or_none()
    if not cfg or cfg.status != "connected":
        raise HTTPException(400, "EDO not connected")

    cfg.last_sync_at = datetime.utcnow()
    cfg.last_sync_status = "success"
    cfg.last_sync_stats = {"imported": 0, "updated": 0, "errors": 0}
    await db.commit()
    return {"detail": "Sync completed", "stats": cfg.last_sync_stats}


# ── List documents ───────────────────────────────────────────────────────────
@router.get("/documents")
async def list_edo_documents(
    doc_type: str = None,
    direction: str = None,
    limit: int = 100,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List EDO documents (filter by type: sf/upd/act/nakladnaya, direction: in/out)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    q = (
        select(DocumentRecord)
        .where(DocumentRecord.organization_id == org_id)
        .order_by(desc(DocumentRecord.created_at))
        .limit(limit)
    )
    if doc_type:
        q = q.where(DocumentRecord.category == doc_type)
    if direction:
        q = q.where(DocumentRecord.doc_type == direction)

    result = await db.execute(q)
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "doc_number": d.doc_number,
            "doc_type": d.doc_type,
            "category": d.category,
            "title": d.title,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else "",
            "metadata": d.metadata_,
        }
        for d in docs
    ]


# ── Connection status ────────────────────────────────────────────────────────
@router.get("/status")
async def edo_status(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get EDO connection status."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    result = await db.execute(
        select(ConnectorConfig).where(
            ConnectorConfig.organization_id == org_id,
            ConnectorConfig.connector_type == "diadoc",
        )
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        return {"connected": False, "status": "not_configured"}

    auth = cfg.auth_config or {}
    return {
        "connected": cfg.status == "connected",
        "status": cfg.status,
        "box_id": auth.get("box_id"),
        "inn": auth.get("inn"),
        "last_sync_at": cfg.last_sync_at.isoformat() if cfg.last_sync_at else None,
        "last_sync_stats": cfg.last_sync_stats,
    }
