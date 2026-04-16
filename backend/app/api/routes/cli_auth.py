"""Device-code authentication flow for the xerocode CLI.

Flow:
  1. CLI   POST /api/auth/cli/request       → { device_code, user_code, verification_url }
  2. User  opens verification_url (browser) → enters user_code, signs in, approves
  3. Front POST /api/auth/cli/approve       → authenticated endpoint; marks user_code as approved
  4. CLI   POST /api/auth/cli/poll          → { status: "pending"|"approved", token? }

Why device-code instead of loopback:
  - Safari / mobile browsers block HTTPS→http://127.0.0.1 as mixed content
  - Works identically on every browser
  - No loopback server in CLI (simpler code)
  - Pattern used by GitHub CLI, gcloud, AWS CLI

In-memory store with TTL; multi-worker deployment should migrate to Redis.
"""
from __future__ import annotations

import secrets
import string
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.services.auth import create_access_token
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth/cli", tags=["cli-auth"])

# -------- in-memory store --------
# Keys: device_code (UUID) → {user_code, expires_at, approved_user_id}
# Mirror: user_code (short, human-readable) → device_code for fast lookup
_pending: dict[str, dict] = {}
_by_user_code: dict[str, str] = {}

TTL_SEC = 600           # 10 minutes
POLL_INTERVAL = 2
USER_CODE_ALPHABET = string.ascii_uppercase  # no digits to avoid 0/O confusion


def _gc():
    """Evict expired entries. Called on each hit."""
    now = time.time()
    expired_codes = [
        code for code, v in _pending.items() if v["expires_at"] < now
    ]
    for code in expired_codes:
        uc = _pending[code].get("user_code")
        _pending.pop(code, None)
        if uc:
            _by_user_code.pop(uc, None)


def _random_user_code() -> str:
    """Human-friendly code like `ABCD-EFGH`."""
    chars = "".join(secrets.choice(USER_CODE_ALPHABET) for _ in range(8))
    return f"{chars[:4]}-{chars[4:]}"


# -------- request --------
class RequestResponse(BaseModel):
    device_code: str
    user_code: str
    verification_url: str
    verification_url_complete: str
    expires_in: int
    interval: int


@router.post("/request", response_model=RequestResponse)
async def request_device_code():
    """CLI calls this first to initiate device-code flow. No auth required."""
    _gc()
    device_code = secrets.token_urlsafe(24)
    user_code = _random_user_code()
    # Ensure uniqueness of user_code (collisions extremely unlikely but check)
    while user_code in _by_user_code:
        user_code = _random_user_code()

    _pending[device_code] = {
        "user_code": user_code,
        "expires_at": time.time() + TTL_SEC,
        "approved_user_id": None,
    }
    _by_user_code[user_code] = device_code

    # Build the verification URL — use public site domain
    base = (
        getattr(settings, "public_site_url", None)
        or "https://xerocode.ru"
    ).rstrip("/")
    verification_url = f"{base}/cli-auth"
    verification_url_complete = f"{verification_url}?code={user_code}"

    return RequestResponse(
        device_code=device_code,
        user_code=user_code,
        verification_url=verification_url,
        verification_url_complete=verification_url_complete,
        expires_in=TTL_SEC,
        interval=POLL_INTERVAL,
    )


# -------- approve (browser, authenticated) --------
class ApproveBody(BaseModel):
    user_code: str


@router.post("/approve")
async def approve_code(body: ApproveBody, user: User = Depends(get_current_user)):
    """Called from the web UI after user enters their user_code and is signed in."""
    _gc()
    code = (body.user_code or "").strip().upper()
    if not code:
        raise HTTPException(400, "Missing user_code")

    device_code = _by_user_code.get(code)
    if not device_code:
        raise HTTPException(404, "Invalid or expired code")

    entry = _pending.get(device_code)
    if not entry:
        raise HTTPException(404, "Invalid or expired code")

    if entry["expires_at"] < time.time():
        raise HTTPException(400, "Code expired — ask the CLI user to re-run xerocode login")

    entry["approved_user_id"] = str(user.id)
    return {"ok": True, "email": user.email}


# -------- poll (cli, no auth) --------
class PollBody(BaseModel):
    device_code: str


@router.post("/poll")
async def poll_device_code(body: PollBody):
    """CLI polls this every `interval` seconds until approved or expired."""
    _gc()
    entry = _pending.get(body.device_code)
    if not entry:
        # Already consumed or never existed
        return {"status": "expired"}

    if entry["expires_at"] < time.time():
        return {"status": "expired"}

    if not entry["approved_user_id"]:
        return {"status": "pending"}

    # Approved — issue a JWT and consume the entry (one-shot)
    # Load user email/plan for the token payload (match existing /api/auth/login shape)
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import async_session

    user_id = entry["approved_user_id"]
    async with async_session() as db:
        res = await db.execute(select(User).where(User.id == user_id))
        u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(404, "User not found")
    token = create_access_token(
        user_id=str(u.id),
        email=u.email,
        plan=getattr(u, "plan", "free"),
    )

    # Consume (one-shot to prevent replay)
    uc = entry.get("user_code")
    _pending.pop(body.device_code, None)
    if uc:
        _by_user_code.pop(uc, None)

    return {"status": "approved", "token": token}
