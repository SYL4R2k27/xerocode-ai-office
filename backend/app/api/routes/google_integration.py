"""Google integration — Drive, Gmail placeholders."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.integration import Integration

router = APIRouter(prefix="/integrations/google", tags=["google"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class GoogleSetupRequest(BaseModel):
    client_id: str = Field(..., min_length=5)
    client_secret: str = Field(..., min_length=5)
    refresh_token: str = Field(default="")
    scopes: list[str] = Field(default=["drive.readonly", "gmail.send"])


class DriveImportRequest(BaseModel):
    file_id: str = Field(..., min_length=5)
    file_name: str = Field(default="")
    target_kb_id: str = Field(default="")


class GmailSendRequest(BaseModel):
    to: str = Field(..., min_length=5)
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    html: bool = Field(default=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_google_integration(db: AsyncSession, org_id) -> Integration | None:
    result = await db.execute(
        select(Integration).where(
            Integration.organization_id == org_id,
            Integration.type == "google",
        )
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/setup")
async def setup_google(
    body: GoogleSetupRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Configure Google integration (OAuth credentials)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Not in an organization")

    config = {
        "client_id": body.client_id,
        "client_secret": body.client_secret,
        "refresh_token": body.refresh_token,
        "scopes": body.scopes,
    }

    integration = await _get_google_integration(db, org_id)
    if integration:
        integration.config = config
        integration.status = "active"
    else:
        integration = Integration(
            organization_id=org_id,
            type="google",
            config=config,
            status="active",
            created_by=user.id,
        )
        db.add(integration)

    await db.commit()
    return {"detail": "Google integration configured", "status": "active"}


@router.get("/status")
async def google_status(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Google integration status."""
    org_id = user.organization_id
    if not org_id:
        return {"status": "not_configured"}

    integration = await _get_google_integration(db, org_id)
    if not integration:
        return {"status": "not_configured"}

    scopes = (integration.config or {}).get("scopes", [])
    return {"status": integration.status, "scopes": scopes}


@router.post("/drive/import")
async def import_from_drive(
    body: DriveImportRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import a file from Google Drive to Knowledge Base (placeholder)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Not in an organization")

    integration = await _get_google_integration(db, org_id)
    if not integration or integration.status != "active":
        raise HTTPException(status_code=400, detail="Google integration not configured")

    # Placeholder — actual implementation would use Google Drive API
    # with the stored OAuth credentials to download and index the file
    return {
        "detail": "Drive import queued (placeholder)",
        "file_id": body.file_id,
        "file_name": body.file_name,
        "target_kb_id": body.target_kb_id,
    }


@router.post("/gmail/send")
async def send_gmail(
    body: GmailSendRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send email via Gmail API (placeholder)."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Not in an organization")

    integration = await _get_google_integration(db, org_id)
    if not integration or integration.status != "active":
        raise HTTPException(status_code=400, detail="Google integration not configured")

    # Placeholder — actual implementation would use Gmail API
    # to send email with the stored OAuth credentials
    return {
        "detail": "Email queued (placeholder)",
        "to": body.to,
        "subject": body.subject,
    }


@router.delete("/remove")
async def remove_google(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove Google integration."""
    org_id = user.organization_id
    integration = await _get_google_integration(db, org_id)
    if integration:
        await db.delete(integration)
        await db.commit()
    return {"detail": "Google integration removed"}
