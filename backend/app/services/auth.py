from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Keep legacy constant for backward compatibility with existing tokens
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password[:72], hashed)


def create_access_token(user_id: str, email: str, plan: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "plan": plan,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token with 7-day expiry."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, "refresh_" + settings.secret_key, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    """Validate and decode a refresh token. Returns empty dict on failure."""
    try:
        payload = jwt.decode(
            token, "refresh_" + settings.secret_key, algorithms=[ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return {}
        return payload
    except JWTError:
        return {}


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return {}
