from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.models.user import User


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: require admin privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
