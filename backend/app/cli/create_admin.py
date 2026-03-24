"""
Create or promote a user to admin.

Usage:
    python -m app.cli.create_admin --email admin@example.com --password secret
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.database import async_session, engine, Base
from app.models.user import User
from app.services.auth import hash_password


async def main(email: str, password: str) -> None:
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            user.is_admin = True
            user.plan = "admin"
            user.is_active = True
            await db.commit()
            print(f"User {email} promoted to admin.")
        else:
            user = User(
                email=email,
                password_hash=hash_password(password),
                name="Admin",
                plan="admin",
                is_admin=True,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            print(f"Admin user {email} created.")

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or promote admin user")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Password (for new users)")
    args = parser.parse_args()
    asyncio.run(main(args.email, args.password))
