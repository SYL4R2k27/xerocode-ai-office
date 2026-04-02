from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    PasswordChange,
    ProfileUpdate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.core.security_logger import log_auth_failure, log_auth_success
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


from app.core.config import settings as _settings
INVITE_CODE = _settings.invite_code or "DISABLED"


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user and return an access token."""
    # Invite code check (бета-тест)
    invite = getattr(data, "invite_code", None)
    if invite != INVITE_CODE:
        raise HTTPException(403, "Неверный инвайт-код. Платформа на закрытом бета-тесте.")

    # Password policy
    if len(data.password) < 8:
        raise HTTPException(400, "Пароль должен быть минимум 8 символов")
    if data.password.isdigit() or data.password.isalpha():
        raise HTTPException(400, "Пароль должен содержать буквы и цифры")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    from datetime import timedelta

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        trial_plan="start",
        trial_expires_at=datetime.utcnow() + timedelta(days=3),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.email, user.plan)
    refresh = create_refresh_token(str(user.id))
    log_auth_success(user.email, request.client.host)
    return TokenResponse(access_token=token, refresh_token=refresh)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return an access token."""
    from app.core.rate_limiter import auth_limiter

    ip = request.client.host if request.client else "unknown"
    can_try, reason = auth_limiter.check(ip)
    if not can_try:
        raise HTTPException(status_code=429, detail=reason)

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        auth_limiter.record(ip)
        log_auth_failure(data.email, ip, "invalid_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        log_auth_failure(data.email, ip, "account_deactivated")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )

    auth_limiter.reset(ip)
    token = create_access_token(str(user.id), user.email, user.plan)
    refresh = create_refresh_token(str(user.id))
    log_auth_success(user.email, ip)
    return TokenResponse(access_token=token, refresh_token=refresh)


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    payload = decode_refresh_token(data.refresh_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    new_access = create_access_token(str(user.id), user.email, user.plan)
    new_refresh = create_refresh_token(str(user.id))
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    """Get current user profile with subscription limits."""
    from app.core.subscription import get_user_limits

    user_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "plan": current_user.plan,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "tasks_used_this_month": current_user.tasks_used_this_month,
        "created_at": str(current_user.created_at),
        "avatar": getattr(current_user, "avatar", None),
        "organization_id": str(current_user.organization_id) if current_user.organization_id else None,
        "org_role": current_user.org_role,
        "limits": get_user_limits(current_user),
    }
    return user_data


@router.patch("/profile")
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile."""
    current_user.name = data.name
    if data.avatar is not None:
        current_user.avatar = data.avatar
    await db.commit()
    return {"status": "ok"}


@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password."""
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль",
        )
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен быть минимум 6 символов",
        )
    current_user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"status": "ok"}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate account (soft delete per 152-ФЗ)."""
    current_user.is_active = False
    await db.commit()
    return {"status": "deactivated"}


@router.get("/stats")
async def user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user statistics."""
    return {
        "goals_created": 0,  # TODO: count from DB
        "tasks_completed": 0,
        "tokens_used": 0,
        "tasks_this_month": current_user.tasks_used_this_month,
        "plan": current_user.plan,
    }


@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str):
    """OAuth redirect (placeholder)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"OAuth через {provider} — скоро!",
    )


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str):
    """OAuth callback (placeholder)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="OAuth callback — скоро!",
    )
