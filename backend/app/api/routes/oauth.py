"""OAuth login: Google, GitHub, Telegram Login Widget.

Flow:
  GET  /api/auth/oauth/{provider}              → 302 redirect to provider authorize URL
  GET  /api/auth/oauth/{provider}/callback     → exchange code for token, find/create user,
                                                 redirect to FE with JWT in URL fragment.
  POST /api/auth/telegram/verify               → verify Telegram Login Widget hash, issue JWT.

Provider creds in settings.{google,github}_client_{id,secret}, telegram_bot_token.
Redirect-back URL: {oauth_redirect_base}/auth/callback#token=<jwt>
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import uuid
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth import create_access_token
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])
logger = logging.getLogger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────


def _redirect_uri(request: Request, provider: str) -> str:
    """Build callback URL — prefer settings.oauth_redirect_base (https),
    fallback to request scheme/host (dev). Production must set the env var
    so the redirect URI matches what was registered in the OAuth app."""
    base = (settings.oauth_redirect_base or "").rstrip("/")
    if base:
        return f"{base}/api/auth/oauth/{provider}/callback"
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("host", request.url.netloc)
    return f"{scheme}://{host}/api/auth/oauth/{provider}/callback"


def _frontend_redirect(token: str | None, error: str | None = None) -> RedirectResponse:
    base = settings.oauth_redirect_base.rstrip("/")
    if error:
        return RedirectResponse(f"{base}/?oauth_error={error}", status_code=302)
    return RedirectResponse(f"{base}/auth/callback#token={token}", status_code=302)


async def _find_or_create_user(db: AsyncSession, *, email: str, name: str) -> User:
    user = (
        await db.execute(select(User).where(User.email == email.lower()))
    ).scalar_one_or_none()
    if user:
        return user
    user = User(
        id=uuid.uuid4(),
        email=email.lower(),
        password_hash="!oauth!",  # blocks password login
        name=name or email.split("@")[0],
        plan="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _httpx_client():
    proxy = getattr(settings, "api_proxy", None)
    transport = httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None
    return httpx.AsyncClient(transport=transport, timeout=30)


# ── Google ───────────────────────────────────────────────────────────


@router.get("/google")
async def google_start(request: Request):
    if not settings.google_client_id:
        raise HTTPException(503, "Google OAuth not configured")
    state = secrets.token_urlsafe(24)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _redirect_uri(request, "google"),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
        "state": state,
    }
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}", status_code=302
    )


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = Query(None),
    error: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return _frontend_redirect(None, error or "no_code")
    try:
        async with await _httpx_client() as client:
            tok_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": _redirect_uri(request, "google"),
                    "grant_type": "authorization_code",
                },
            )
            tok_res.raise_for_status()
            access = tok_res.json().get("access_token")
            if not access:
                return _frontend_redirect(None, "no_access_token")

            uinfo = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access}"},
            )
            uinfo.raise_for_status()
            data = uinfo.json()
        email = data.get("email")
        name = data.get("name") or email.split("@")[0]
        if not email:
            return _frontend_redirect(None, "no_email")
        user = await _find_or_create_user(db, email=email, name=name)
        token = create_access_token(str(user.id), user.email, user.plan or "free")
        return _frontend_redirect(token)
    except Exception as e:
        logger.error(f"[OAuth Google] {e}", exc_info=True)
        return _frontend_redirect(None, "server_error")


# ── GitHub ───────────────────────────────────────────────────────────


@router.get("/github")
async def github_start(request: Request):
    if not settings.github_client_id:
        raise HTTPException(503, "GitHub OAuth not configured")
    state = secrets.token_urlsafe(24)
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": _redirect_uri(request, "github"),
        "scope": "read:user user:email",
        "state": state,
    }
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?{urlencode(params)}", status_code=302
    )


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str | None = Query(None),
    error: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return _frontend_redirect(None, error or "no_code")
    try:
        async with await _httpx_client() as client:
            tok_res = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "code": code,
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "redirect_uri": _redirect_uri(request, "github"),
                },
            )
            tok_res.raise_for_status()
            access = tok_res.json().get("access_token")
            if not access:
                return _frontend_redirect(None, "no_access_token")

            uinfo = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access}", "Accept": "application/vnd.github+json"},
            )
            uinfo.raise_for_status()
            udata = uinfo.json()
            email = udata.get("email")
            if not email:
                # GitHub may not include email — fetch /user/emails
                em_res = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access}"},
                )
                if em_res.status_code == 200:
                    for e in em_res.json():
                        if e.get("primary") and e.get("verified"):
                            email = e["email"]
                            break
        if not email:
            return _frontend_redirect(None, "no_email")
        name = udata.get("name") or udata.get("login") or email.split("@")[0]
        user = await _find_or_create_user(db, email=email, name=name)
        token = create_access_token(str(user.id), user.email, user.plan or "free")
        return _frontend_redirect(token)
    except Exception as e:
        logger.error(f"[OAuth GitHub] {e}", exc_info=True)
        return _frontend_redirect(None, "server_error")


# ── Yandex ───────────────────────────────────────────────────────────


@router.get("/yandex")
async def yandex_start(request: Request):
    if not settings.yandex_client_id:
        raise HTTPException(503, "Yandex OAuth not configured")
    state = secrets.token_urlsafe(24)
    params = {
        "response_type": "code",
        "client_id": settings.yandex_client_id,
        "redirect_uri": _redirect_uri(request, "yandex"),
        "state": state,
        "force_confirm": "no",
    }
    return RedirectResponse(
        f"https://oauth.yandex.ru/authorize?{urlencode(params)}", status_code=302
    )


@router.get("/yandex/callback")
async def yandex_callback(
    request: Request,
    code: str | None = Query(None),
    error: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if error or not code:
        return _frontend_redirect(None, error or "no_code")
    try:
        async with await _httpx_client() as client:
            tok_res = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                },
            )
            tok_res.raise_for_status()
            access = tok_res.json().get("access_token")
            if not access:
                return _frontend_redirect(None, "no_access_token")

            uinfo = await client.get(
                "https://login.yandex.ru/info?format=json",
                headers={"Authorization": f"OAuth {access}"},
            )
            uinfo.raise_for_status()
            data = uinfo.json()
        email = data.get("default_email") or data.get("emails", [None])[0]
        name = data.get("real_name") or data.get("display_name") or data.get("login") or "Yandex User"
        if not email:
            return _frontend_redirect(None, "no_email")
        user = await _find_or_create_user(db, email=email, name=name)
        token = create_access_token(str(user.id), user.email, user.plan or "free")
        return _frontend_redirect(token)
    except Exception as e:
        logger.error(f"[OAuth Yandex] {e}", exc_info=True)
        return _frontend_redirect(None, "server_error")


# ── Telegram Login Widget ────────────────────────────────────────────


@router.post("/telegram/verify")
async def telegram_verify(data: dict, db: AsyncSession = Depends(get_db)):
    """Verify Telegram Login Widget payload hash, issue JWT.

    Frontend embeds the widget; on success it posts the auth payload here.
    Hash verified per https://core.telegram.org/widgets/login#checking-authorization
    """
    if not settings.telegram_bot_token:
        raise HTTPException(503, "Telegram login not configured")
    received_hash = data.pop("hash", None)
    if not received_hash:
        raise HTTPException(400, "no hash")
    # Build data-check-string
    pairs = sorted(f"{k}={v}" for k, v in data.items() if v is not None)
    data_check_string = "\n".join(pairs)
    secret = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    expected = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(401, "invalid hash")

    tg_id = data.get("id")
    username = data.get("username") or f"tg{tg_id}"
    first_name = data.get("first_name") or "Telegram User"
    # Synthesize email — Telegram doesn't expose real email
    email = f"tg-{tg_id}@telegram.local"
    user = await _find_or_create_user(db, email=email, name=first_name)
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}
