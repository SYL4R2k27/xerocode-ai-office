"""Tests for external API gateway (BELSI service-account flow).

Покрывают:
- /external/health (no auth)
- 401 на неверный токен / отсутствие токена
- 401 на деактивированный SA
- 403 если endpoint не разрешён
- 400 на неизвестный prompt_template
- 200 + envelope на /analyze-image (с замоканным провайдером)
- идемпотентность: второй вызов с тем же request_id возвращает кэшированный envelope
- /usage возвращает корректные счётчики
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import bcrypt
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_account import ServiceAccount


# ── Helpers ──────────────────────────────────────────────────────────
async def _create_sa(
    db: AsyncSession,
    *,
    is_active: bool = True,
    allowed_endpoints: list[str] | None = None,
    rate_limit_per_minute: int = 60,
    rate_limit_per_day: int = 5000,
    monthly_budget_usd: float = 0.0,
) -> tuple[ServiceAccount, str]:
    """Создаёт SA, возвращает (sa, plaintext_token)."""
    plaintext = "belsi_TestPrFx_" + "x" * 32
    token_hash = bcrypt.hashpw(plaintext.encode(), bcrypt.gensalt(rounds=4)).decode()

    sa = ServiceAccount(
        id=uuid.uuid4(),
        name=f"test-sa-{uuid.uuid4().hex[:8]}",
        description="pytest fixture",
        service_token_hash=token_hash,
        token_prefix="TestPrFx",
        allowed_endpoints=allowed_endpoints or ["analyze-image", "generate"],
        allowed_models=[],
        rate_limit_per_minute=rate_limit_per_minute,
        rate_limit_per_day=rate_limit_per_day,
        monthly_budget_usd=Decimal(str(monthly_budget_usd)),
        is_active=is_active,
    )
    db.add(sa)
    await db.commit()
    await db.refresh(sa)
    return sa, plaintext


@pytest_asyncio.fixture
async def db_session():
    """Открываем сессию через тестовый sessionmaker, не через app.get_db."""
    from tests.conftest import TestSession

    async with TestSession() as s:
        yield s


# ── Health ────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_health_no_auth(client):
    r = await client.get("/api/v1/external/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["service"] == "external-gateway"
    assert isinstance(body.get("templates"), int) and body["templates"] >= 1


# ── Auth: missing/invalid ────────────────────────────────────────────
@pytest.mark.asyncio
async def test_missing_authorization_header(client):
    r = await client.post(
        "/api/v1/external/analyze-image",
        json={"image_url": "https://x.invalid/a.jpg", "prompt_template": "photo_quality"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_malformed_token(client):
    r = await client.get(
        "/api/v1/external/templates",
        headers={"Authorization": "Bearer broken-token"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_unknown_token(client):
    r = await client.get(
        "/api/v1/external/templates",
        headers={"Authorization": "Bearer fake_NoSuchPx_" + "z" * 32},
    )
    assert r.status_code == 401


# ── Auth: deactivated ─────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_inactive_service_account(client, db_session):
    sa, token = await _create_sa(db_session, is_active=False)
    r = await client.get(
        "/api/v1/external/templates",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 401


# ── Endpoint allowlist ───────────────────────────────────────────────
@pytest.mark.asyncio
async def test_endpoint_not_allowed(client, db_session):
    sa, token = await _create_sa(
        db_session, allowed_endpoints=["generate"]  # без analyze-image
    )
    r = await client.post(
        "/api/v1/external/analyze-image",
        headers={"Authorization": f"Bearer {token}"},
        json={"image_url": "https://x.invalid/a.jpg", "prompt_template": "photo_quality"},
    )
    assert r.status_code == 403


# ── Templates list ───────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_templates_list(client, db_session):
    sa, token = await _create_sa(db_session)
    r = await client.get(
        "/api/v1/external/templates",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "templates" in body
    keys = {t["key"] for t in body["templates"]}
    # v1 → 3 шаблона; v1.3 → 8 шаблонов
    expected = {
        "photo_quality",
        "idle_verify",
        "daily_summary",
        "voice_transcribe",
        "triage_ticket",
        "chat_reply_suggest",
        "query_to_filter",
        "stock_forecast",
    }
    assert expected.issubset(keys), f"missing: {expected - keys}"


# ── Unknown template ─────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_unknown_template(client, db_session):
    sa, token = await _create_sa(db_session)
    r = await client.post(
        "/api/v1/external/analyze-image",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "image_url": "https://x.invalid/a.jpg",
            "prompt_template": "no_such_template",
        },
    )
    assert r.status_code == 400


# ── analyze-image happy-path with mocked dispatcher ──────────────────
@pytest.mark.asyncio
async def test_analyze_image_mocked(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    # v1.3.1: новый формат — + has_worker_in_frame, has_helmet может быть null, разделены issues/info
    fake_response = (
        '{"score": 9, "comment": "готовый шкаф, чистая работа", "category": "workplace", '
        '"has_worker_in_frame": true, "has_helmet": true, "is_workplace": true, '
        '"issues": [], "info": []}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 120, 60)),
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                "request_id": "test-1",
            },
        )

    assert r.status_code == 200, r.text
    env = r.json()
    assert env["ok"] is True
    assert env["result"]["score"] == 9
    assert env["result"]["has_worker_in_frame"] is True
    assert env["result"]["has_helmet"] is True
    assert env["result"]["info"] == []
    assert env["meta"]["template"] == "photo_quality"
    assert env["meta"]["tokens_in"] == 120
    assert env["meta"]["tokens_out"] == 60


# ── Idempotency: same request_id replays cached envelope ─────────────
@pytest.mark.asyncio
async def test_idempotency_replay(client, monkeypatch):
    """SA создаётся через ту же sessionmaker; сессия закрывается до HTTP-запросов."""
    from tests.conftest import TestSession

    async with TestSession() as db:
        sa, token = await _create_sa(db)

    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = '{"score": 7, "comment": "first", "category": "workplace", "has_worker_in_frame": true, "has_helmet": false, "is_workplace": true, "issues": [], "info": []}'

    # 1-й вызов
    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 100, 50)),
    ):
        r1 = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                "request_id": "idem-001",
            },
        )

    assert r1.status_code == 200
    assert r1.json()["ok"] is True

    # 2-й вызов с тем же request_id — провайдер уже не должен дёргаться
    second_call_response = '{"score": 1, "comment": "should-not-see"}'
    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(second_call_response, 999, 999)),
    ) as mock_dispatch:
        r2 = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                "request_id": "idem-001",
            },
        )

    assert r2.status_code == 200
    body = r2.json()
    # Первый ответ кэширован → score=7, флаг replayed
    assert body["result"]["score"] == 7
    assert body["meta"].get("replayed") is True
    # Провайдер для второго запроса не вызвался
    mock_dispatch.assert_not_awaited()


# ── /usage endpoint ──────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_usage_counters(client, db_session):
    sa, token = await _create_sa(
        db_session, rate_limit_per_day=100, monthly_budget_usd=10.0
    )

    r = await client.get(
        "/api/v1/external/usage",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["requests_today"] == 0
    assert body["requests_per_day_limit"] == 100
    assert body["monthly_budget_usd"] == 10.0
    assert body["is_active"] is True


# ── Generate endpoint ────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_generate_text_template(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"headline": "Test day", "summary": "Three sentences.", '
        '"anomalies": [], "recommendations": []}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 200, 100)),
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "daily_summary",
                "data": {
                    "date": "2026-05-10",
                    "active_shifts": 3,
                    "finished_shifts": 12,
                    "work_hours": 84,
                    "idle_hours": 4,
                    "long_pauses": 2,
                    "silent_objects": 1,
                    "idle_reasons": "погода, перебои с поставкой",
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["result"]["headline"] == "Test day"


# ── Invalid JSON from provider → 200 with ok=false ────────────────────
@pytest.mark.asyncio
async def test_invalid_json_response(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=("this is not json at all", 50, 30)),
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
            },
        )

    # HTTP всё равно 200 (envelope-формат), но ok=false
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "invalid_json_response"


# ╔════════════════════════════════════════════════════════════════════╗
# ║   v1.3 · 5 новых шаблонов + /transcribe                            ║
# ╚════════════════════════════════════════════════════════════════════╝


# ── triage_ticket: support-классификация ─────────────────────────────
@pytest.mark.asyncio
async def test_triage_ticket_template(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"category": "bug", "subcategory": "camera", "priority": "high", '
        '"tags": ["камера", "вылетает"], "language_detected": "ru", '
        '"sentiment": "frustrated", "summary_short": "Камера падает при съёмке селфи", '
        '"blocking": true, "suggested_assignee_role": "developer"}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 90, 50)),
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "triage_ticket",
                "data": {
                    "user_name": "Иванов И.И.",
                    "user_role": "монтажник",
                    "app_version": "1.4.2",
                    "ticket_text": "при попытке сделать селфи приложение вылетает",
                },
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["result"]["category"] == "bug"
    assert body["result"]["priority"] == "high"
    assert body["result"]["language_detected"] == "ru"
    assert body["meta"]["template"] == "triage_ticket"


# ── chat_reply_suggest: 3 коротких варианта ──────────────────────────
@pytest.mark.asyncio
async def test_chat_reply_suggest_template(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"replies": ['
        '{"text": "Да, готово, фото скинул", "tone": "agree"}, '
        '{"text": "Ещё час, фасады остались", "tone": "delay"}, '
        '{"text": "Завис на петлях", "tone": "info"}], '
        '"context_understood": true}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 110, 70)),
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "chat_reply_suggest",
                "data": {
                    "chat_history": "Пётр: «начнёшь?»\nИван: «уже на объекте»",
                    "sender_name": "Пётр",
                    "sender_role": "бригадир",
                    "incoming_message": "Иван, как там шкаф? Закончил?",
                    "responder_role": "монтажник",
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert len(body["result"]["replies"]) == 3
    assert body["result"]["context_understood"] is True


# ── query_to_filter: NLP-запрос → JSON-фильтр ────────────────────────
@pytest.mark.asyncio
async def test_query_to_filter_template(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"filters": {"user_name": "Иванов", "ai_category": "selfie", '
        '"date_from": "2026-05-03"}, "limit": 20, "order_by": "created_at_desc", '
        '"intent_understood": true, "explanation_ru": "Селфи Иванова за прошлую неделю"}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 130, 80)),
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "query_to_filter",
                "data": {
                    "query": "Селфи Иванова за прошлую неделю",
                    "today_iso": "2026-05-10",
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["result"]["intent_understood"] is True
    assert body["result"]["filters"]["user_name"] == "Иванов"
    assert body["result"]["filters"]["ai_category"] == "selfie"


# ── stock_forecast: прогноз исчерпания материалов ────────────────────
@pytest.mark.asyncio
async def test_stock_forecast_template(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"forecasts": [{"material_code": "M-001", "material_name": "ЛДСП 16мм", '
        '"current_stock": 24, "unit": "м²", "daily_avg_usage": 8.0, "days_left": 3, '
        '"depletion_date": "2026-05-13", "risk": "critical", '
        '"reason_ru": "увеличенный расход за последние 3 дня", '
        '"recommended_order_quantity": 200, "recommended_order_unit": "м²"}], '
        '"summary_ru": "Один материал критически близок к исчерпанию.", '
        '"actions": ["Срочно заказать ЛДСП 16мм 200 м²"]}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 320, 180)),
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "stock_forecast",
                "data": {
                    "facility_name": "Фабрика-1",
                    "stock_data_json": '[{"code":"M-001","stock":24}]',
                    "usage_history_json": '[{"date":"2026-05-09","used":10}]',
                    "active_batches_json": "[]",
                },
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert len(body["result"]["forecasts"]) == 1
    assert body["result"]["forecasts"][0]["risk"] == "critical"


# ── transcribe: audio → text через Groq Whisper ──────────────────────
@pytest.mark.asyncio
async def test_transcribe_mocked(client, db_session, monkeypatch):
    sa, token = await _create_sa(
        db_session,
        allowed_endpoints=["transcribe", "analyze-image", "generate"],
    )
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_whisper_response = {
        "text": "нет розетки в стене на втором этаже",
        "language": "ru",
        "duration": 3.2,
        "segments": [
            {"start": 0.0, "end": 3.2, "text": "нет розетки в стене на втором этаже"}
        ],
    }

    with patch(
        "app.services.external_router._call_groq_whisper",
        new=AsyncMock(return_value=fake_whisper_response),
    ) as mock_whisper:
        r = await client.post(
            "/api/v1/external/transcribe",
            headers={"Authorization": f"Bearer {token}"},
            files={"audio": ("voice.mp3", b"fake-mp3-bytes", "audio/mpeg")},
            data={"language": "ru", "request_id": "trans-1"},
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["result"]["text"] == "нет розетки в стене на втором этаже"
    assert body["result"]["language_detected"] == "ru"
    assert body["result"]["duration_sec"] == 3.2
    assert len(body["result"]["segments"]) == 1
    assert body["meta"]["template"] == "voice_transcribe"
    assert body["meta"]["provider"] == "groq"
    assert "whisper" in body["meta"]["model"]
    mock_whisper.assert_awaited_once()


# ── transcribe: 403 если endpoint не разрешён ────────────────────────
@pytest.mark.asyncio
async def test_transcribe_endpoint_forbidden(client, db_session):
    sa, token = await _create_sa(
        db_session, allowed_endpoints=["analyze-image"]  # без transcribe
    )
    r = await client.post(
        "/api/v1/external/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"audio": ("voice.mp3", b"x", "audio/mpeg")},
        data={"language": "ru"},
    )
    assert r.status_code == 403


# ── transcribe: empty body → 400 ─────────────────────────────────────
@pytest.mark.asyncio
async def test_transcribe_empty_body(client, db_session):
    sa, token = await _create_sa(
        db_session, allowed_endpoints=["transcribe"]
    )
    r = await client.post(
        "/api/v1/external/transcribe",
        headers={"Authorization": f"Bearer {token}"},
        files={"audio": ("voice.mp3", b"", "audio/mpeg")},
        data={"language": "ru"},
    )
    assert r.status_code == 400


# ╔════════════════════════════════════════════════════════════════════╗
# ║   photo_quality v1.3.1 · has_worker_in_frame + null helmet + info  ║
# ╚════════════════════════════════════════════════════════════════════╝


@pytest.mark.asyncio
async def test_photo_quality_v131_no_worker(client, db_session, monkeypatch):
    """Фото готового шкафа без человека: has_worker_in_frame=false,
    has_helmet=null (не false!), info содержит нейтральные наблюдения,
    issues пустой (это НЕ проблема)."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"score": 8, "comment": "Готовый шкаф после монтажа, чистая работа.", '
        '"category": "workplace", '
        '"has_worker_in_frame": false, '
        '"has_helmet": null, '
        '"is_workplace": true, '
        '"issues": [], '
        '"info": ["без работника", "после работы"]}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 110, 70)),
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/cabinet.jpg",
                "prompt_template": "photo_quality",
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    res = body["result"]
    # Главные новые поля
    assert res["has_worker_in_frame"] is False
    assert res["has_helmet"] is None  # null валиден, НЕ false
    # issues — только критичное; "нет работника" туда НЕ попадает
    assert res["issues"] == []
    # info содержит нейтральные наблюдения
    assert "без работника" in res["info"]
    # score высокий потому что фото результата работы — норма
    assert res["score"] >= 6


@pytest.mark.asyncio
async def test_photo_quality_v131_safety_violation(client, db_session, monkeypatch):
    """Работник в кадре без каски — has_helmet=false, issues непустой."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    fake_response = (
        '{"score": 5, "comment": "Монтажник работает без СИЗ.", '
        '"category": "workplace", '
        '"has_worker_in_frame": true, '
        '"has_helmet": false, '
        '"is_workplace": true, '
        '"issues": ["работник без каски"], '
        '"info": []}'
    )

    with patch(
        "app.services.external_router._dispatch_provider",
        new=AsyncMock(return_value=(fake_response, 100, 60)),
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/worker.jpg",
                "prompt_template": "photo_quality",
            },
        )

    assert r.status_code == 200, r.text
    res = r.json()["result"]
    assert res["has_worker_in_frame"] is True
    assert res["has_helmet"] is False  # реальное нарушение, НЕ null
    assert "каск" in res["issues"][0].lower()


# ╔════════════════════════════════════════════════════════════════════╗
# ║   photo_quality v1.3.2 · user_comment in prompt                    ║
# ╚════════════════════════════════════════════════════════════════════╝


@pytest.mark.asyncio
async def test_photo_quality_v132_with_user_comment_match(client, db_session, monkeypatch):
    """Когда custom_context.user_comment задан — он попадает в prompt
    отдельной секцией с правилами интерпретации, а LLM может вернуть
    score=9 + category='documentation'."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    captured = {}

    async def capture_dispatch(provider, model, system, user_text, *a, **kw):
        captured["provider"] = provider
        captured["user_text"] = user_text
        captured["system"] = system
        return (
            '{"score": 9, "comment": "Готовый шкаф после монтажа.", '
            '"category": "documentation", '
            '"has_worker_in_frame": false, "has_helmet": null, '
            '"is_workplace": true, "issues": [], '
            '"info": ["после работы"]}',
            120, 70,
        )

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=capture_dispatch,
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/cabinet.jpg",
                "prompt_template": "photo_quality",
                "custom_context": {
                    "user_comment": "финальная сборка готового шкафа",
                    "site_object": "Углич-2",
                },
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    res = body["result"]
    assert res["score"] == 9
    assert res["category"] == "documentation"

    # Главное: в LLM-prompt действительно попал user_comment
    user_text = captured["user_text"]
    assert "финальная сборка готового шкафа" in user_text
    # И секция-обёртка с правилами
    assert "КОММЕНТАРИЙ ОТ АВТОРА ФОТО" in user_text
    assert "результат / готово / собрано / закончил" in user_text
    # custom_context остальные ключи тоже в prompt
    assert "Углич-2" in user_text


@pytest.mark.asyncio
async def test_photo_quality_v132_no_user_comment(client, db_session, monkeypatch):
    """Когда user_comment нет (или custom_context пуст) — секция не рендерится,
    шаблон не падает, AI-ответ парсится как обычно."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    captured = {}

    async def capture_dispatch(provider, model, system, user_text, *a, **kw):
        captured["user_text"] = user_text
        return (
            '{"score": 7, "comment": "обычное фото", "category": "workplace", '
            '"has_worker_in_frame": true, "has_helmet": true, '
            '"is_workplace": true, "issues": [], "info": []}',
            100, 50,
        )

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=capture_dispatch,
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                # без custom_context
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    # Секция КОММЕНТАРИЙ-ОТ-АВТОРА не должна появиться
    user_text = captured["user_text"]
    assert "КОММЕНТАРИЙ ОТ АВТОРА ФОТО" not in user_text
    # Остальной шаблон рендерится корректно
    assert "ОЦЕНКА score" in user_text


@pytest.mark.asyncio
async def test_photo_quality_v132_empty_string_user_comment(client, db_session, monkeypatch):
    """user_comment='' (пустая строка) — секция тоже НЕ рендерится."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key", lambda p: "fake-key"
    )

    captured = {}

    async def capture_dispatch(provider, model, system, user_text, *a, **kw):
        captured["user_text"] = user_text
        return (
            '{"score": 6, "comment": "ok", "category": "workplace", '
            '"has_worker_in_frame": false, "has_helmet": null, '
            '"is_workplace": true, "issues": [], "info": []}',
            80, 40,
        )

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=capture_dispatch,
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                "custom_context": {"user_comment": "   "},  # whitespace only
            },
        )

    assert r.status_code == 200
    assert "КОММЕНТАРИЙ ОТ АВТОРА ФОТО" not in captured["user_text"]


# ╔════════════════════════════════════════════════════════════════════╗
# ║   v1.4 · paid_fallback_chain + new providers                       ║
# ╚════════════════════════════════════════════════════════════════════╝


# ── /templates: v1.4 form: 8 ключей, fallback_chain[], paid_fallback_chain[] ──
@pytest.mark.asyncio
async def test_templates_v14_shape(client, db_session):
    sa, token = await _create_sa(db_session)
    r = await client.get(
        "/api/v1/external/templates",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    by_key = {t["key"]: t for t in body["templates"]}
    # 8 ключей
    assert set(by_key.keys()) == {
        "photo_quality", "idle_verify", "daily_summary", "voice_transcribe",
        "triage_ticket", "chat_reply_suggest", "query_to_filter", "stock_forecast",
    }
    # photo_quality: primary = groq llama-4-scout
    assert by_key["photo_quality"]["default_model"].startswith("groq/")
    assert "llama-4-scout" in by_key["photo_quality"]["default_model"]
    # paid_fallback_chain существует и содержит anthropic claude-haiku-4-5
    assert any("anthropic/claude-haiku-4-5" in p for p in by_key["photo_quality"]["paid_fallback_chain"])
    # voice_transcribe: paid = openai/whisper-1
    assert any("openai/whisper-1" in p for p in by_key["voice_transcribe"]["paid_fallback_chain"])
    # triage_ticket: paid = apiyi/gpt-5-nano
    assert any("apiyi/gpt-5-nano" in p for p in by_key["triage_ticket"]["paid_fallback_chain"])


# ── allow_paid_fallback=False (default): paid НЕ вызывается даже при провале free ──
@pytest.mark.asyncio
async def test_paid_fallback_blocked_by_default(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    # Только free providers имеют ключи
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key" if p in ("groq", "openrouter", "anthropic") else None,
    )

    # Все free-провайдеры падают, anthropic (paid) НЕ должен вызваться
    call_log = []

    async def all_free_fail(provider, model, *a, **kw):
        call_log.append((provider, model))
        raise RuntimeError(f"{provider} down")

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=all_free_fail,
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                # allow_paid_fallback не указан → default False
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "all_providers_failed"
    # Anthropic НЕ должен быть вызван
    providers_called = {p for (p, _) in call_log}
    assert "anthropic" not in providers_called, (
        f"anthropic was called without allow_paid_fallback! log={call_log}"
    )


# ── allow_paid_fallback=True: paid CHAIN активируется когда free упало ──
@pytest.mark.asyncio
async def test_paid_fallback_activated_with_flag(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key" if p in ("groq", "openrouter", "anthropic") else None,
    )

    call_log = []

    async def free_fail_paid_ok(provider, model, *a, **kw):
        call_log.append((provider, model))
        if provider == "anthropic":
            return (
                '{"score": 9, "comment": "ok", "category": "workplace", '
                '"has_worker_in_frame": true, "has_helmet": true, "is_workplace": true, '
                '"issues": [], "info": []}',
                100, 50,
            )
        raise RuntimeError(f"{provider} down")

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=free_fail_paid_ok,
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
                "allow_paid_fallback": True,
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["meta"]["provider"] == "anthropic"
    assert "haiku-4-5" in body["meta"]["model"]
    # Free пытались
    providers_called = [p for (p, _) in call_log]
    assert "groq" in providers_called or "openrouter" in providers_called
    assert "anthropic" in providers_called


# ── SambaNova dispatch: новая ветка должна работать ──────────────────
@pytest.mark.asyncio
async def test_sambanova_dispatch(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key",
    )

    fake_response = (
        '{"headline": "Sambanova worked", "summary": "Three sentences.", '
        '"anomalies": [], "recommendations": []}'
    )

    # Подменяем _dispatch_provider — daily_summary в v1.4 fallback_chain имеет
    # groq → sambanova → openrouter. Заставим groq упасть, sambanova успешно.
    async def first_fails_then_samba(provider, model, *a, **kw):
        if provider == "groq":
            raise RuntimeError("groq down")
        if provider == "sambanova":
            return (fake_response, 100, 60)
        raise RuntimeError(f"unexpected {provider}")

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=first_fails_then_samba,
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "daily_summary",
                "data": {
                    "date": "2026-05-10", "active_shifts": 3, "finished_shifts": 12,
                    "work_hours": 84, "idle_hours": 4, "long_pauses": 2,
                    "silent_objects": 1, "idle_reasons": "погода",
                },
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["meta"]["provider"] == "sambanova"


# ── Apiyi dispatch via model_override (paid model directly) ──────────
@pytest.mark.asyncio
async def test_apiyi_via_override(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key",
    )

    fake_response = (
        '{"category": "bug", "subcategory": "camera", "priority": "high", '
        '"tags": ["test"], "language_detected": "ru", "sentiment": "calm", '
        '"summary_short": "test", "blocking": false, "suggested_assignee_role": "developer"}'
    )

    async def only_apiyi(provider, model, *a, **kw):
        assert provider == "apiyi"
        assert "claude-haiku-4-5" in model
        return (fake_response, 80, 40)

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=only_apiyi,
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "triage_ticket",
                "data": {
                    "user_name": "Тест", "user_role": "монтажник",
                    "app_version": "1.0", "ticket_text": "test",
                },
                "model_override": "apiyi/claude-haiku-4-5-20251001",
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["meta"]["provider"] == "apiyi"


# ── Cerebras dormant: вызывается ТОЛЬКО через model_override ─────────
@pytest.mark.asyncio
async def test_cerebras_dormant_via_override(client, db_session, monkeypatch):
    """Cerebras не входит ни в один default-chain. Только через model_override."""
    sa, token = await _create_sa(db_session)
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key",
    )

    fake = (
        '{"replies": ['
        '{"text": "тест1", "tone": "agree"}, '
        '{"text": "тест2", "tone": "delay"}, '
        '{"text": "тест3", "tone": "info"}], '
        '"context_understood": true}'
    )

    async def only_cerebras(provider, model, *a, **kw):
        assert provider == "cerebras"
        assert model == "llama3.1-8b"
        return (fake, 50, 30)

    with patch(
        "app.services.external_router._dispatch_provider",
        side_effect=only_cerebras,
    ):
        r = await client.post(
            "/api/v1/external/generate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "prompt_template": "chat_reply_suggest",
                "data": {
                    "chat_history": "—", "sender_name": "Пётр",
                    "sender_role": "бригадир", "incoming_message": "ок?",
                    "responder_role": "монтажник",
                },
                "model_override": "cerebras/llama3.1-8b",
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["meta"]["provider"] == "cerebras"
    assert body["meta"]["model"] == "llama3.1-8b"


# ── Whisper paid fallback: openai/whisper-1 не дёргается без флага ──
@pytest.mark.asyncio
async def test_whisper_paid_fallback_blocked_by_default(client, db_session, monkeypatch):
    sa, token = await _create_sa(
        db_session,
        allowed_endpoints=["transcribe", "analyze-image", "generate"],
    )
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key" if p in ("groq", "openai") else None,
    )

    call_log = []

    async def all_groq_fail(audio_bytes, filename, mime_type, model="whisper-large-v3-turbo", **kw):
        call_log.append(("groq", model))
        raise RuntimeError("groq whisper down")

    with patch(
        "app.services.external_router._call_groq_whisper",
        side_effect=all_groq_fail,
    ):
        # без allow_paid_fallback — openai НЕ должен вызваться
        r = await client.post(
            "/api/v1/external/transcribe",
            headers={"Authorization": f"Bearer {token}"},
            files={"audio": ("v.mp3", b"fake-bytes", "audio/mpeg")},
            data={"language": "ru"},
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "all_providers_failed"
    # openai не пробовали
    assert all(p == "groq" for (p, _) in call_log)


# ── Whisper paid fallback: с флагом — openai whisper-1 дёргается ──
@pytest.mark.asyncio
async def test_whisper_paid_fallback_activated(client, db_session, monkeypatch):
    sa, token = await _create_sa(
        db_session,
        allowed_endpoints=["transcribe", "analyze-image", "generate"],
    )
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key" if p in ("groq", "openai") else None,
    )

    fake_openai_whisper = {
        "text": "тест опенаи виспер",
        "language": "ru",
        "duration": 1.5,
        "segments": [{"start": 0, "end": 1.5, "text": "тест опенаи виспер"}],
    }

    async def groq_fail(*a, **kw):
        raise RuntimeError("groq down")

    async def openai_ok(provider, audio_bytes, filename, mime_type, model="whisper-1", language="ru", prompt_hint=None):
        assert provider == "openai"
        assert model == "whisper-1"
        return fake_openai_whisper

    with patch(
        "app.services.external_router._call_groq_whisper",
        side_effect=groq_fail,
    ), patch(
        "app.services.external_router._call_whisper",
        side_effect=openai_ok,
    ):
        r = await client.post(
            "/api/v1/external/transcribe",
            headers={"Authorization": f"Bearer {token}"},
            files={"audio": ("v.mp3", b"fake-bytes", "audio/mpeg")},
            data={"language": "ru", "allow_paid_fallback": "true"},
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["meta"]["provider"] == "openai"
    assert body["meta"]["model"] == "whisper-1"
    assert body["result"]["text"] == "тест опенаи виспер"


# ── Fallback chain: первый провайдер падает, второй проходит ─────────
@pytest.mark.asyncio
async def test_fallback_chain(client, db_session, monkeypatch):
    sa, token = await _create_sa(db_session)

    # Подменяем _provider_key чтобы оба провайдера были "доступны"
    monkeypatch.setattr(
        "app.services.external_router._provider_key",
        lambda p: "fake-key" if p in ("gemini", "openrouter", "groq") else None,
    )

    call_count = {"n": 0}

    async def flaky_dispatch(provider, model, *args, **kwargs):
        call_count["n"] += 1
        if call_count["n"] == 1:
            raise RuntimeError("first provider down")
        return (
            '{"score": 8, "comment": "ok", "category": "workplace", '
            '"has_worker_in_frame": true, "has_helmet": true, "is_workplace": true, '
            '"issues": [], "info": []}',
            80,
            40,
        )

    with patch(
        "app.services.external_router._dispatch_provider", side_effect=flaky_dispatch
    ):
        r = await client.post(
            "/api/v1/external/analyze-image",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "image_url": "https://x.invalid/a.jpg",
                "prompt_template": "photo_quality",
            },
        )

    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["result"]["score"] == 8
    assert call_count["n"] == 2
    # warning про первого провайдера должен присутствовать
    assert any("first provider down" in w for w in body.get("warnings", []))
