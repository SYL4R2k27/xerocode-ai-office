"""
Tests for auth and goals endpoints.

Covers:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET  /api/auth/me
  - POST /api/goals/
  - GET  /api/goals/
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# --- Helpers ----------------------------------------------------------------

TEST_USER = {
    "email": "test@example.com",
    "password": "Secure1pass",
    "name": "Test User",
    "invite_code": "TEST_INVITE",
}


async def register_user(client: AsyncClient, **overrides) -> dict:
    """Register a user and return the response JSON."""
    payload = {**TEST_USER, **overrides}
    resp = await client.post("/api/auth/register", json=payload)
    return resp


async def get_token(client: AsyncClient, **overrides) -> str:
    """Register + login, return the access token."""
    payload = {**TEST_USER, **overrides}
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201
    return resp.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# --- Registration -----------------------------------------------------------

class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        resp = await register_user(client)
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client: AsyncClient):
        resp1 = await register_user(client)
        assert resp1.status_code == 201
        resp2 = await register_user(client)
        assert resp2.status_code == 409

    async def test_register_weak_password(self, client: AsyncClient):
        resp = await register_user(client, password="12345678")
        assert resp.status_code == 400

    async def test_register_short_password(self, client: AsyncClient):
        resp = await register_user(client, password="Ab1")
        assert resp.status_code in (400, 422)

    async def test_register_wrong_invite(self, client: AsyncClient):
        resp = await register_user(client, invite_code="WRONG")
        assert resp.status_code == 403


# --- Login ------------------------------------------------------------------

class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        await register_user(client)
        resp = await client.post(
            "/api/auth/login",
            json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient):
        await register_user(client)
        resp = await client.post(
            "/api/auth/login",
            json={"email": TEST_USER["email"], "password": "WrongPass1"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "Whatever1"},
        )
        assert resp.status_code == 401


# --- Me ---------------------------------------------------------------------

class TestMe:
    async def test_me_authenticated(self, client: AsyncClient):
        token = await get_token(client)
        resp = await client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == TEST_USER["email"]
        assert data["name"] == TEST_USER["name"]
        assert "plan" in data
        assert "limits" in data

    async def test_me_no_token(self, client: AsyncClient):
        resp = await client.get("/api/auth/me")
        assert resp.status_code in (401, 403)

    async def test_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            "/api/auth/me", headers=auth_header("invalid.token.value")
        )
        assert resp.status_code in (401, 500)


# --- Goals ------------------------------------------------------------------

class TestGoals:
    async def test_create_goal(self, client: AsyncClient):
        token = await get_token(client)
        resp = await client.post(
            "/api/goals/",
            json={"title": "Build a landing page"},
            headers=auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Build a landing page"
        assert data["status"] == "active"
        assert "id" in data

    async def test_list_goals_empty(self, client: AsyncClient):
        token = await get_token(client)
        resp = await client.get("/api/goals/", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_goals_after_create(self, client: AsyncClient):
        token = await get_token(client)
        await client.post(
            "/api/goals/",
            json={"title": "Goal A"},
            headers=auth_header(token),
        )
        await client.post(
            "/api/goals/",
            json={"title": "Goal B"},
            headers=auth_header(token),
        )
        resp = await client.get("/api/goals/", headers=auth_header(token))
        assert resp.status_code == 200
        goals = resp.json()
        assert len(goals) == 2
        titles = {g["title"] for g in goals}
        assert titles == {"Goal A", "Goal B"}

    async def test_create_goal_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            "/api/goals/",
            json={"title": "Should fail"},
        )
        assert resp.status_code in (401, 403)
