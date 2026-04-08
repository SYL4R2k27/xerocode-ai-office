"""Integrations module — Bitrix24, 1C connectors. User-facing setup + import + sync."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.connector import ConnectorConfig, SyncLog
from app.models.user import User

router = APIRouter(prefix="/connectors", tags=["connectors"])


def _require_org(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise HTTPException(400, "Not in organization")
    return user.organization_id


# ── List connectors ──

@router.get("/")
async def list_connectors(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List all configured connectors for the organization."""
    org_id = _require_org(user)
    result = await db.execute(
        select(ConnectorConfig).where(ConnectorConfig.organization_id == org_id)
    )
    return [
        {
            "id": str(c.id), "connector_type": c.connector_type, "name": c.name,
            "status": c.status, "sync_enabled": c.sync_enabled,
            "last_sync_at": c.last_sync_at.isoformat() if c.last_sync_at else None,
            "last_sync_status": c.last_sync_status,
            "last_sync_stats": c.last_sync_stats,
            "sync_config": c.sync_config,
        }
        for c in result.scalars().all()
    ]


# ── Setup connector ──

@router.post("/setup", status_code=201)
async def setup_connector(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Create or update a connector config."""
    org_id = _require_org(user)
    connector_type = data.get("connector_type", "").strip()
    if connector_type not in ("bitrix24", "1c", "google", "slack"):
        raise HTTPException(400, "Invalid connector type")

    # Check if already exists
    existing = (await db.execute(
        select(ConnectorConfig).where(
            ConnectorConfig.organization_id == org_id,
            ConnectorConfig.connector_type == connector_type,
        )
    )).scalar_one_or_none()

    from app.core.encryption import encrypt_api_key
    import json as _json

    def _encrypt_config(cfg: dict) -> dict:
        """Encrypt sensitive fields in auth_config."""
        encrypted = {}
        for k, v in cfg.items():
            if k in ("webhook_url", "base_url"):
                encrypted[k] = v  # URLs not encrypted (needed for SSRF validation)
            elif v and isinstance(v, str):
                encrypted[k] = encrypt_api_key(v)
            else:
                encrypted[k] = v
        return encrypted

    if existing:
        raw_auth = data.get("auth_config", {})
        existing.auth_config = _encrypt_config(raw_auth) if raw_auth else existing.auth_config
        existing.sync_config = data.get("sync_config", existing.sync_config)
        existing.field_mapping = data.get("field_mapping", existing.field_mapping)
        existing.name = data.get("name", existing.name)
        existing.status = "connected"
        await db.commit()
        return {"id": str(existing.id), "status": "updated"}

    config = ConnectorConfig(
        organization_id=org_id,
        connector_type=connector_type,
        name=data.get("name", connector_type),
        status="connected",
        auth_config=_encrypt_config(data.get("auth_config", {})),
        sync_config=data.get("sync_config", {"entities": ["deals", "contacts", "tasks"], "direction": "import"}),
        field_mapping=data.get("field_mapping", {}),
        created_by=user.id,
    )
    db.add(config)
    await db.commit()
    return {"id": str(config.id), "status": "created"}


# ── Test connection ──

@router.post("/{connector_id}/test")
async def test_connector(connector_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Test connectivity to external system."""
    org_id = _require_org(user)
    config = (await db.execute(
        select(ConnectorConfig).where(ConnectorConfig.id == connector_id, ConnectorConfig.organization_id == org_id)
    )).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Connector not found")

    from app.core.encryption import decrypt_api_key

    def _decrypt_config(cfg: dict) -> dict:
        decrypted = {}
        for k, v in (cfg or {}).items():
            if k in ("webhook_url", "base_url"):
                decrypted[k] = v
            elif v and isinstance(v, str):
                try:
                    decrypted[k] = decrypt_api_key(v)
                except Exception:
                    decrypted[k] = v
            else:
                decrypted[k] = v
        return decrypted

    auth = _decrypt_config(config.auth_config)

    if config.connector_type == "bitrix24":
        from app.services.connector_bitrix import BitrixConnector
        webhook_url = auth.get("webhook_url", "")
        if not webhook_url:
            raise HTTPException(400, "Webhook URL not configured")
        connector = BitrixConnector(webhook_url)
        result = await connector.test_connection()
    elif config.connector_type == "1c":
        from app.services.connector_bitrix import OneCConnector
        base_url = auth.get("base_url", "")
        username = auth.get("username", "")
        password = auth.get("password", "")
        connector = OneCConnector(base_url, username, password)
        result = await connector.test_connection()
    else:
        result = {"ok": False, "error": "Connector type not supported yet"}

    config.status = "connected" if result.get("ok") else "error"
    await db.commit()
    return result


# ── Start import ──

@router.post("/{connector_id}/import")
async def start_import(connector_id: str, data: dict = None, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Start data import from external system. Runs async."""
    org_id = _require_org(user)
    config = (await db.execute(
        select(ConnectorConfig).where(ConnectorConfig.id == connector_id, ConnectorConfig.organization_id == org_id)
    )).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Connector not found")

    entities = (data or {}).get("entities") or config.sync_config.get("entities", ["deals", "contacts"])

    # Create sync log
    sync_log = SyncLog(
        connector_id=config.id,
        sync_type="full",
        direction="import",
        status="running",
    )
    db.add(sync_log)
    config.status = "syncing"
    await db.commit()
    await db.refresh(sync_log)

    # Run import in background
    async def _run_import():
        from app.core.database import async_session
        async with async_session() as bg_db:
            await _execute_import(bg_db, config, sync_log.id, entities, org_id, user.id)

    asyncio.create_task(_run_import())

    return {"sync_log_id": str(sync_log.id), "status": "started", "entities": entities}


# ── Import status ──

@router.get("/{connector_id}/status")
async def import_status(connector_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get latest import status."""
    org_id = _require_org(user)
    # Verify connector belongs to org
    config = (await db.execute(select(ConnectorConfig).where(ConnectorConfig.id == connector_id, ConnectorConfig.organization_id == org_id))).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Connector not found")
    result = await db.execute(
        select(SyncLog).where(SyncLog.connector_id == connector_id).order_by(desc(SyncLog.started_at)).limit(1)
    )
    log = result.scalar_one_or_none()
    if not log:
        return {"status": "no_imports"}
    return {
        "id": str(log.id), "status": log.status, "entity": log.entity,
        "items_total": log.items_total, "items_imported": log.items_imported,
        "items_updated": log.items_updated, "items_failed": log.items_failed,
        "errors": log.errors, "started_at": str(log.started_at),
        "completed_at": str(log.completed_at) if log.completed_at else None,
    }


# ── Sync logs ──

@router.get("/{connector_id}/logs")
async def sync_logs(connector_id: str, limit: int = 20, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List sync history."""
    org_id = _require_org(user)
    config = (await db.execute(select(ConnectorConfig).where(ConnectorConfig.id == connector_id, ConnectorConfig.organization_id == org_id))).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Connector not found")
    result = await db.execute(
        select(SyncLog).where(SyncLog.connector_id == connector_id).order_by(desc(SyncLog.started_at)).limit(min(limit, 100))
    )
    return [
        {
            "id": str(l.id), "sync_type": l.sync_type, "entity": l.entity,
            "status": l.status, "items_imported": l.items_imported,
            "items_failed": l.items_failed, "started_at": str(l.started_at),
            "completed_at": str(l.completed_at) if l.completed_at else None,
        }
        for l in result.scalars().all()
    ]


# ── Delete connector ──

@router.delete("/{connector_id}")
async def delete_connector(connector_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = _require_org(user)
    config = (await db.execute(
        select(ConnectorConfig).where(ConnectorConfig.id == connector_id, ConnectorConfig.organization_id == org_id)
    )).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Connector not found")
    await db.delete(config)
    await db.commit()
    return {"detail": "Connector deleted"}


# ── Import executor ──

async def _execute_import(db: AsyncSession, config: ConnectorConfig, sync_log_id, entities: list, org_id, user_id):
    """Execute the actual import from external system."""
    from sqlalchemy import update
    from app.models.connector import SyncLog
    from app.models.crm import Contact, Deal
    from app.models.task import Task

    total_imported = 0
    total_failed = 0
    errors = []

    try:
        if config.connector_type == "bitrix24":
            from app.services.connector_bitrix import BitrixConnector
            bx = BitrixConnector(config.auth_config.get("webhook_url", ""))

            # Import contacts
            if "contacts" in entities:
                try:
                    contacts = await bx.fetch_contacts()
                    for c in contacts:
                        existing = (await db.execute(
                            select(Contact).where(Contact.organization_id == org_id, Contact.name == c["name"], Contact.email == c.get("email"))
                        )).scalar_one_or_none()
                        if not existing:
                            db.add(Contact(
                                organization_id=org_id, name=c["name"], email=c.get("email"),
                                phone=c.get("phone"), position=c.get("position"),
                                notes=c.get("notes"), source=c.get("source"), created_by=user_id,
                            ))
                            total_imported += 1
                    await db.commit()
                except Exception as e:
                    errors.append({"entity": "contacts", "error": str(e)})
                    total_failed += 1

            # Import companies as contacts
            if "companies" in entities:
                try:
                    companies = await bx.fetch_companies()
                    for c in companies:
                        existing = (await db.execute(
                            select(Contact).where(Contact.organization_id == org_id, Contact.name == c["name"])
                        )).scalar_one_or_none()
                        if not existing:
                            db.add(Contact(
                                organization_id=org_id, name=c["name"], email=c.get("email"),
                                phone=c.get("phone"), company=c.get("company"),
                                notes=c.get("notes"), created_by=user_id,
                            ))
                            total_imported += 1
                    await db.commit()
                except Exception as e:
                    errors.append({"entity": "companies", "error": str(e)})
                    total_failed += 1

            # Import deals
            if "deals" in entities:
                try:
                    deals = await bx.fetch_deals()
                    for d in deals:
                        existing = (await db.execute(
                            select(Deal).where(Deal.organization_id == org_id, Deal.title == d["title"])
                        )).scalar_one_or_none()
                        if not existing:
                            db.add(Deal(
                                organization_id=org_id, title=d["title"], amount=d["amount"],
                                currency=d.get("currency", "RUB"), stage=d.get("stage", "lead"),
                                description=d.get("description"), source=d.get("source"),
                                created_by=user_id,
                            ))
                            total_imported += 1
                    await db.commit()
                except Exception as e:
                    errors.append({"entity": "deals", "error": str(e)})
                    total_failed += 1

            # Import tasks
            if "tasks" in entities:
                try:
                    tasks = await bx.fetch_tasks()
                    for t in tasks:
                        db.add(Task(
                            title=t["title"], description=t.get("description"),
                            status=t.get("status", "backlog"), priority=t.get("priority", 5),
                            due_date=t.get("deadline"), created_by_user_id=user_id,
                            created_by_ai=False, checklist=t.get("checklist", []),
                            tags=t.get("tags", []),
                        ))
                        total_imported += 1
                    await db.commit()
                except Exception as e:
                    errors.append({"entity": "tasks", "error": str(e)})
                    total_failed += 1

        elif config.connector_type == "1c":
            from app.services.connector_bitrix import OneCConnector
            onec = OneCConnector(
                config.auth_config.get("base_url", ""),
                config.auth_config.get("username", ""),
                config.auth_config.get("password", ""),
            )

            if "counterparties" in entities or "contacts" in entities:
                try:
                    counterparties = await onec.fetch_counterparties()
                    for c in counterparties:
                        existing = (await db.execute(
                            select(Contact).where(Contact.organization_id == org_id, Contact.name == c["name"])
                        )).scalar_one_or_none()
                        if not existing:
                            db.add(Contact(
                                organization_id=org_id, name=c["name"],
                                company=c.get("full_name") or c["name"],
                                notes=f"ИНН: {c.get('inn', '')} КПП: {c.get('kpp', '')}",
                                created_by=user_id,
                            ))
                            total_imported += 1
                    await db.commit()
                except Exception as e:
                    errors.append({"entity": "counterparties", "error": str(e)})
                    total_failed += 1

        # Update sync log
        await db.execute(
            update(SyncLog).where(SyncLog.id == sync_log_id).values(
                status="success" if not errors else "partial",
                items_imported=total_imported,
                items_failed=total_failed,
                errors=errors,
                completed_at=datetime.utcnow(),
            )
        )
        await db.execute(
            update(ConnectorConfig).where(ConnectorConfig.id == config.id).values(
                status="connected",
                last_sync_at=datetime.utcnow(),
                last_sync_status="success" if not errors else "partial",
                last_sync_stats={"imported": total_imported, "failed": total_failed},
            )
        )
        await db.commit()

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Import error: {e}", exc_info=True)
        await db.execute(
            update(SyncLog).where(SyncLog.id == sync_log_id).values(
                status="failed", errors=[{"error": str(e)}], completed_at=datetime.utcnow(),
            )
        )
        await db.execute(
            update(ConnectorConfig).where(ConnectorConfig.id == config.id).values(status="error")
        )
        await db.commit()
