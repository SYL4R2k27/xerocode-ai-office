"""BYOK routes — save/list/delete user API keys per provider."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.encryption import decrypt_api_key, encrypt_api_key
from app.models.byok import UserApiKey

router = APIRouter(prefix="/byok", tags=["byok"])

ALLOWED_PROVIDERS = {"openai", "anthropic", "google", "groq", "openrouter"}


def _mask(key: str) -> str:
    if not key or len(key) < 8:
        return "••••"
    return f"{key[:4]}...{key[-4:]}"


@router.get("/keys")
async def list_keys(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(UserApiKey).where(UserApiKey.user_id == user.id))).scalars().all()
    result: dict = {p: None for p in ALLOWED_PROVIDERS}
    for row in rows:
        try:
            plain = decrypt_api_key(row.key_encrypted)
            result[row.provider] = {"masked": _mask(plain), "updated_at": row.updated_at.isoformat()}
        except Exception:
            result[row.provider] = {"masked": "••••", "updated_at": row.updated_at.isoformat()}
    return result


@router.post("/keys")
async def save_keys(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Upsert keys. Body: {openai?, anthropic?, google?, groq?, openrouter?}. Empty string deletes."""
    saved = []
    for provider, key in (data or {}).items():
        if provider not in ALLOWED_PROVIDERS:
            continue
        key = (key or "").strip()
        existing = (
            await db.execute(
                select(UserApiKey).where(UserApiKey.user_id == user.id, UserApiKey.provider == provider)
            )
        ).scalar_one_or_none()
        if not key:
            if existing:
                await db.delete(existing)
            continue
        encrypted = encrypt_api_key(key)
        if existing:
            existing.key_encrypted = encrypted
        else:
            db.add(UserApiKey(user_id=user.id, provider=provider, key_encrypted=encrypted))
        saved.append(provider)
    await db.commit()
    return {"saved": saved, "ok": True}


@router.delete("/keys/{provider}")
async def delete_key(provider: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if provider not in ALLOWED_PROVIDERS:
        raise HTTPException(400, "Invalid provider")
    await db.execute(delete(UserApiKey).where(UserApiKey.user_id == user.id, UserApiKey.provider == provider))
    await db.commit()
    return {"ok": True}


async def get_user_key(db: AsyncSession, user_id, provider: str) -> str | None:
    """Helper: fetch decrypted BYOK key for user/provider, or None."""
    row = (
        await db.execute(
            select(UserApiKey).where(UserApiKey.user_id == user_id, UserApiKey.provider == provider)
        )
    ).scalar_one_or_none()
    if not row:
        return None
    try:
        return decrypt_api_key(row.key_encrypted)
    except Exception:
        return None
