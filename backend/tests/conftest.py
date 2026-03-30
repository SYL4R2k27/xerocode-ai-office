"""
Shared fixtures for pytest.

Sets up an in-memory SQLite database and an async httpx client
so every test runs against a clean, isolated database.
"""
from __future__ import annotations

import os

# --- Environment must be patched BEFORE any app imports ---
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///file:test.db?mode=memory&cache=shared&uri=true"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["INVITE_CODE"] = "TEST_INVITE"
os.environ["ALLOWED_ORIGINS"] = "http://localhost"

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

# Import all models so Base.metadata knows every table
import app.models  # noqa: F401

# ---------------------------------------------------------------------------
# Test engine / session
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = os.environ["DATABASE_URL"]

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestSession = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSession() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async httpx client wired to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
