"""External AI Router — thin layer для service-клиентов (BELSI и т.п.).

Принципы:
  - НЕ использует ai_router / supervisor / orchestration / messages.
  - Прямые HTTP-вызовы к провайдерам через config.api_proxy (VLESS).
  - Промпт-шаблоны хранятся в Python-словаре (BELSI_PROMPT_TEMPLATES).
  - Fallback chain: если первый провайдер падает — переход к следующему.
  - Идемпотентность: request_id + (sa_id) → cached envelope.
  - Cost-tracking → service_account_usage.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple, Union

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.service_account import ServiceAccount, ServiceAccountUsage
from app.schemas.external import (
    AnalyzeImageRequest,
    ExternalEnvelope,
    GenerateRequest,
)

logger = logging.getLogger(__name__)


# ╔══════════════════════════════════════════════════════════════╗
# ║   BELSI Prompt Templates                                     ║
# ╚══════════════════════════════════════════════════════════════╝
BELSI_PROMPT_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "photo_quality": {
        # v2 (2026-05-12, по спецификации BELSI XEROCODE_PROMPTS_v2.md):
        # Multi-context — режим выбирается по custom_context.photo_kind:
        #   "construction" (default) — фото со стройки/монтажа (каска/ТБ/процесс)
        #   "production" — фото с производства (целостность/упаковка/маркировка)
        #   "driver" — фото водителей на маршруте (загрузка/разгрузка/доставка)
        #
        # Breaking change по JSON-схеме (BELSI требует переход):
        #   убраны: has_worker_in_frame, has_helmet, is_workplace
        #   category теперь: good|warning|violation|neutral (было: workplace|selfie|...)
        "system": (
            "Ты — Russian-speaking AI-инспектор фото для строительной/"
            "производственной/логистической компании BELSI. Получаешь фото + "
            "custom_context с метаданными.\n\n"
            "ВЫБОР РЕЖИМА — по custom_context.photo_kind:\n\n"
            "═══ photo_kind = \"construction\" (стройка/монтаж) ═══\n\n"
            "Анализируй с точки зрения:\n"
            "- ТЕХНИКА БЕЗОПАСНОСТИ (каска, страховка, ограждения, спецодежда) — критично\n"
            "- Процесс монтажа: видна работа, инструменты на месте, материалы рядом\n"
            "- Чистота рабочего места\n"
            "- Селфи / не-рабочее фото / размытость — issues\n\n"
            "issues (критичные): \"без каски\", \"селфи вместо работы\", \"курение на объекте\", "
            "\"размыто/непригодно\", \"не рабочее место\".\n"
            "info (нейтральные): \"после работы (рабочий ушёл)\", \"результат работы (нет рабочего)\", "
            "\"комплектация материалов на старте\".\n\n"
            "═══ photo_kind = \"production\" (производство мебели) ═══\n\n"
            "Анализируй с точки зрения:\n"
            "- ЦЕЛОСТНОСТЬ ИЗДЕЛИЯ: видимые дефекты (сколы, царапины, кривые швы)\n"
            "- УПАКОВКА: плёнка целая, углы защищены, маркировка читаема\n"
            "- КОМПЛЕКТАЦИЯ: видно совпадает ли с item_count_expected (если задано)\n"
            "- МАРКИРОВКА: batch_code / артикул / стикер виден\n\n"
            "НЕ применяй критерии стройки. Каска тут не нужна, спецодежда — да, но как "
            "гигиена производства, не как ТБ.\n\n"
            "issues: \"видимый дефект изделия\", \"повреждена упаковка\", \"нет маркировки\", "
            "\"несоответствие batch_code\", \"размыто/непригодно\".\n"
            "info: \"готовая партия в упаковке\", \"промежуточная сборка\".\n\n"
            "═══ photo_kind = \"driver\" (фото водителя на маршруте) ═══\n\n"
            "Анализируй с точки зрения:\n"
            "- ПОДТВЕРЖДЕНИЕ ТОЧКИ: видно ТС, видно адрес/объект, виден груз\n"
            "- СОСТОЯНИЕ ГРУЗА: палет/коробки не повреждены при доставке\n"
            "- МОМЕНТ ПЕРЕДАЧИ: если route_point_type=delivery_arrival — должен быть "
            "получатель или подпись/документ\n"
            "- НЕ применяй ТБ-критерии стройки.\n\n"
            "issues: \"не видно ТС/груза\", \"повреждение груза при доставке\", "
            "\"размыто/непригодно\", \"снято не на точке\".\n"
            "info: \"загрузка в процессе\", \"разгрузка на складе\", \"доставка на объект\".\n\n"
            "═══ ОБЩИЕ ПРАВИЛА для всех режимов ═══\n\n"
            "1. score 0-10:\n"
            "   - 9-10: эталонное фото, всё видно, нарушений нет\n"
            "   - 7-8: хорошее фото, мелкие наблюдения\n"
            "   - 4-6: warning — что-то не так (плохой ракурс, частичная видимость)\n"
            "   - 1-3: violation — критичные нарушения (issues непустой)\n"
            "   - 0: непригодно (размыто, заслонено, не на тему)\n\n"
            "2. category:\n"
            "   - \"good\" (score >= 7, issues пусто)\n"
            "   - \"warning\" (score 4-6 OR info непустой при score >= 7)\n"
            "   - \"violation\" (issues непустой ИЛИ score <= 3)\n"
            "   - \"neutral\" (фото результата работы без явных признаков)\n\n"
            "3. comment: 1-2 предложения на РУССКОМ, что видно на фото и почему такой score. "
            "Учитывай user_comment если он есть — например, монтажник написал "
            "\"готовый шкаф\" — значит фото это результат, а не \"пустое рабочее место\".\n\n"
            "4. issues и info ДОЛЖНЫ быть короткими (≤ 50 символов каждый). "
            "Лучше 0-2 пункта чем 5 размытых.\n\n"
            "5. ЯЗЫК ответа — всегда русский.\n\n"
            "6. JSON-схема (обязательно валидный JSON, никакого markdown):\n"
            "{{\n"
            '  "score": 0..10,\n'
            '  "category": "good"|"warning"|"violation"|"neutral",\n'
            '  "comment": "string",\n'
            '  "issues": ["..."],\n'
            '  "info": ["..."]\n'
            "}}"
        ),
        "user_template": (
            "Проанализируй фото.\n"
            "{custom_context_str}\n\n"
            "{user_comment_section}"
            "Соблюдай инструкцию из system message и JSON-схему. "
            "Если custom_context.photo_kind не задан — действуй как при photo_kind=\"construction\"."
        ),
        "endpoint_kind": "vision",
        # v1.4: gemini убран (нет ключа); primary = groq llama-4-scout vision
        "default_model": ("groq", "meta-llama/llama-4-scout-17b-16e-instruct"),
        "fallback_chain": [
            ("groq", "meta-llama/llama-4-scout-17b-16e-instruct"),
            ("openrouter", "nvidia/nemotron-nano-12b-v2-vl:free"),
        ],
        "paid_fallback_chain": [
            ("anthropic", "claude-haiku-4-5-20251001"),
        ],
        "max_tokens": 500,
        "temperature": 0.2,
    },
    "idle_verify": {
        # v2 (2026-05-12): добавлены явные правила про противоречие фото/reason
        # и непригодное фото — по запросу BELSI XEROCODE_PROMPTS_v2.md.
        "system": (
            "Ты — Russian-speaking AI-проверяющий простоев на стройке BELSI. "
            "Сверяешь причину простоя, которую назвал работник, с фото с места. "
            "Отвечай ТОЛЬКО валидным JSON, без markdown."
        ),
        "user_template": (
            "Работник нажал «простой: {reason}» на объекте.\n"
            "Подтверждает ли это фото причину?\n"
            "Возможен ли фейк (работник на самом деле работает, но нажал «простой» "
            "чтобы не записывать рабочее время)?\n\n"
            "ПРАВИЛА:\n"
            "1. Если на фото явно виден ПРОЦЕСС РАБОТЫ (инструменты в руках, "
            "материалы в монтаже, активные действия) при заявленной причине "
            "«Ожидание материалов» / «Технические проблемы» / другой аналогичной — "
            "это противоречие: suspicion_score >= 70, confirmed=false, "
            "reason_visible=false. Поясни в comment, что именно видно.\n"
            "2. Если фото — селфи / непригодно (размыто, чёрный кадр, лицо во "
            "весь экран): confidence=0, comment=\"Фото непригодно для проверки\", "
            "confirmed=false, reason_visible=false.\n"
            "3. Если фото подтверждает причину (например, видны материалы которых "
            "не хватает / поломанное оборудование): confirmed=true, "
            "reason_visible=true, suspicion_score <= 30.\n"
            "4. Если фото нейтральное (просто рабочее место без активности): "
            "confirmed=false, reason_visible=false, suspicion_score 30-60.\n\n"
            "Верни JSON:\n"
            "{{\n"
            '  "confirmed": true|false,\n'
            '  "confidence": 0-100,\n'
            '  "reason_visible": true|false,\n'
            '  "comment": "пояснение на русском (≤ 200 символов)",\n'
            '  "suspicion_score": 0-100\n'
            "}}"
        ),
        "endpoint_kind": "vision",
        "default_model": ("groq", "meta-llama/llama-4-scout-17b-16e-instruct"),
        "fallback_chain": [
            ("groq", "meta-llama/llama-4-scout-17b-16e-instruct"),
            ("openrouter", "nvidia/nemotron-nano-12b-v2-vl:free"),
        ],
        "paid_fallback_chain": [
            ("anthropic", "claude-haiku-4-5-20251001"),
        ],
        "max_tokens": 400,
        "temperature": 0.2,
    },
    "daily_summary": {
        # v2 (2026-05-12, по спецификации BELSI XEROCODE_PROMPTS_v2.md):
        # Жёсткие правила против галлюцинаций. При active_shifts > 0 модель НЕ
        # должна писать "нет смен / отсутствие / простой". Числа используются
        # буквально. Headline по фиксированному формату. Anomalies НЕ создаются
        # с value=0/null или type="raw_stats".
        "system": (
            "Ты — Russian-speaking аналитик строительной компании BELSI. "
            "Твоя задача — сгенерировать сводку дня для куратора на основе "
            "СТРОГО переданных в data числовых показателей.\n\n"
            "ЖЁСТКИЕ ПРАВИЛА:\n\n"
            "1. ИСПОЛЬЗУЙ ЧИСЛА БУКВАЛЬНО. Никогда не выдумывай и не округляй.\n"
            "   - active_shifts = X  →  пиши \"X активных смен\", не "
            "\"несколько\" / \"много\" / \"нет\".\n"
            "   - finished_shifts = Y → \"Y закрыто\".\n"
            "   - work_hours = Z → \"Z часов работы\".\n\n"
            "2. ЛОГИКА состояния стройки определяется ТОЛЬКО полем active_shifts:\n"
            "   - active_shifts == 0      → \"На стройке нет активных смен.\"\n"
            "   - active_shifts == 1      → \"Работает 1 смена.\"\n"
            "   - active_shifts >= 2      → \"Работают N активных смен.\"\n\n"
            "   НИКОГДА не пиши «нет смен / отсутствие / простой / приостановка», "
            "если active_shifts > 0. Это будет ложь. Если в data есть instruction — "
            "следуй ему буквально.\n\n"
            "3. HEADLINE (≤ 80 символов):\n"
            "   Формат: \"{{active_shifts}} активных смен · {{finished_shifts}} "
            "закрыто за сегодня\"\n"
            "   Если в data есть factual_headline — используй его дословно как fallback.\n\n"
            "4. SUMMARY (1-3 предложения, ≤ 240 символов):\n"
            "   Опиши состояние стройки через числа из data. Если есть "
            "silent_objects — упомяни их по именам. Если есть idle_reasons с "
            "count > 0 — назови 2 топовые причины простоя.\n\n"
            "5. ANOMALIES — массив объектов {{type, user?, object?, value}}. "
            "Включай ТОЛЬКО:\n"
            "   - silent_object (объекты с >4ч без фото — из silent_objects)\n"
            "   - long_idle (если long_pauses > 0)\n"
            "   - high_idle_ratio (если idle_hours / max(work_hours, 0.01) > 0.5)\n\n"
            "   НЕ создавай аномалии с value=0, value=null, type=\"raw_stats\" "
            "или синонимами \"отсутствие/простой/нет смен\" — это будут пустые "
            "буллеты в UI.\n\n"
            "6. RECOMMENDATIONS — 1-3 коротких action items (≤ 80 символов каждый). "
            "Должны быть КОНКРЕТНЫМИ (\"запросить фото-отчёт с объекта X\") а не "
            "общими (\"улучшить процессы\"). Если active_shifts > 0 — НЕ предлагай "
            "\"проверить причины простоя\" / \"связаться с руководством для "
            "возобновления работы\" / \"проверить техническое состояние оборудования\".\n\n"
            "7. ЯЗЫК: всегда русский.\n\n"
            "8. JSON-схема ответа (обязательно валидный JSON, никакого markdown):\n"
            "{{\n"
            '  "headline": "string",\n'
            '  "summary": "string",\n'
            '  "anomalies": [{{"type": "...", "user": "...", "object": "...", "value": "..."}}],\n'
            '  "recommendations": ["..."]\n'
            "}}"
        ),
        "user_template": (
            "data = {data_json}\n\n"
            "Сгенерируй сводку дня. Соблюдай JSON-схему и правила."
        ),
        "endpoint_kind": "text",
        # v1.4: убраны мёртвые deepseek/gemini-flash-exp
        "default_model": ("groq", "llama-3.3-70b-versatile"),
        "fallback_chain": [
            ("groq", "llama-3.3-70b-versatile"),
            ("sambanova", "Meta-Llama-3.3-70B-Instruct"),
            ("openrouter", "openai/gpt-oss-120b:free"),
        ],
        "paid_fallback_chain": [
            ("anthropic", "claude-haiku-4-5-20251001"),
        ],
        # v2: для большего следования жёстким правилам — снижаем temperature
        "max_tokens": 800,
        "temperature": 0.2,
    },
    # ── 4. voice_transcribe ──────────────────────────────────────
    # Особый шаблон: маршрутизируется через call_transcribe(), не call_with_fallback().
    # Здесь лежит конфиг для /transcribe endpoint.
    "voice_transcribe": {
        "endpoint_kind": "audio",
        "default_model": ("groq", "whisper-large-v3-turbo"),
        "fallback_chain": [
            ("groq", "whisper-large-v3-turbo"),
            ("groq", "whisper-large-v3"),
        ],
        # v1.4: openai whisper-1 как paid safety net (использовать через allow_paid_fallback)
        "paid_fallback_chain": [
            ("openai", "whisper-1"),
        ],
        "language": "ru",
        "default_prompt_hint": (
            "Контекст: разговор монтажника на стройке или работника мебельной фабрики. "
            "Упоминаются материалы (ЛДСП, МДФ, кромка, фурнитура, конфирмат, минификс), "
            "инструменты (дрель, шуруповёрт, лобзик, фрезер), причины простоев, "
            "числа (сколько штук, метров, сантиметров)."
        ),
        # max_tokens / temperature не используются для audio
        "max_tokens": 0,
        "temperature": 0.0,
    },
    # ── 5. triage_ticket ─────────────────────────────────────────
    "triage_ticket": {
        "system": (
            "Ты — AI-классификатор обращений в техподдержку BELSI.Монтаж. "
            "BELSI — Android-приложение для монтажников мебели и работников фабрик. "
            "Классифицируй обращение пользователя по приоритету и категории. "
            "Отвечай ТОЛЬКО валидным JSON, без markdown."
        ),
        "user_template": (
            "Обращение пользователя:\n"
            "ФИО: {user_name}\n"
            "Роль: {user_role}\n"
            "Версия APK: {app_version}\n"
            "Текст: \"\"\"{ticket_text}\"\"\"\n\n"
            "Верни СТРОГО JSON:\n"
            "{{\n"
            '  "category": "bug" | "feature" | "question" | "spam" | "urgent",\n'
            '  "subcategory": "camera" | "sync" | "auth" | "shift" | "photo" | "chat" | "tools" | "other",\n'
            '  "priority": "low" | "normal" | "high" | "urgent",\n'
            '  "tags": [короткие теги на русском],\n'
            '  "language_detected": "ru" | "uz" | "tg" | "tt" | "kk" | "en",\n'
            '  "sentiment": "calm" | "neutral" | "frustrated" | "angry",\n'
            '  "summary_short": "краткое резюме обращения 1 строка",\n'
            '  "blocking": true|false,\n'
            '  "suggested_assignee_role": "developer" | "curator" | "supplier" | "support"\n'
            "}}"
        ),
        "endpoint_kind": "text",
        # v1.4: gemini убран
        "default_model": ("groq", "llama-3.1-8b-instant"),
        "fallback_chain": [
            ("groq", "llama-3.1-8b-instant"),
            ("groq", "openai/gpt-oss-20b"),
            ("groq", "llama-3.3-70b-versatile"),
        ],
        "paid_fallback_chain": [
            ("apiyi", "gpt-5-nano"),
        ],
        "max_tokens": 300,
        "temperature": 0.2,
    },
    # ── 6. chat_reply_suggest ────────────────────────────────────
    "chat_reply_suggest": {
        "system": (
            "Ты — AI-помощник для деловых чатов на стройке/фабрике. "
            "Предлагай 3 коротких варианта ответа в стиле бригадира: "
            "по делу, без лишних слов, на 'ты' если это коллега, на 'вы' если это начальство. "
            "Каждый вариант — максимум 5 слов. Отвечай ТОЛЬКО валидным JSON."
        ),
        "user_template": (
            "Контекст чата (последние 5 сообщений):\n"
            "{chat_history}\n\n"
            "Текущее сообщение от {sender_name} ({sender_role}):\n"
            "\"\"\"{incoming_message}\"\"\"\n\n"
            "Текущая роль отвечающего: {responder_role}\n\n"
            "Предложи 3 варианта короткого ответа. JSON:\n"
            "{{\n"
            '  "replies": [\n'
            '    {{"text": "вариант 1 (макс 5 слов)", "tone": "agree|info|delay|reject"}},\n'
            '    {{"text": "вариант 2", "tone": "..."}},\n'
            '    {{"text": "вариант 3", "tone": "..."}}\n'
            "  ],\n"
            '  "context_understood": true|false\n'
            "}}"
        ),
        "endpoint_kind": "text",
        # v1.4: gemini убран
        "default_model": ("groq", "llama-3.1-8b-instant"),
        "fallback_chain": [
            ("groq", "llama-3.1-8b-instant"),
            ("groq", "openai/gpt-oss-20b"),
        ],
        "paid_fallback_chain": [
            ("apiyi", "gpt-5-nano"),
        ],
        "max_tokens": 250,
        "temperature": 0.6,
    },
    # ── 7. query_to_filter ───────────────────────────────────────
    "query_to_filter": {
        "system": (
            "Ты — AI-парсер поисковых запросов для системы BELSI.Монтаж. "
            "Преобразуй естественный запрос куратора в JSON-фильтр для базы фото. "
            "Отвечай ТОЛЬКО валидным JSON."
        ),
        "user_template": (
            "Доступные поля для фильтрации:\n"
            "- date_from, date_to (ISO 8601)\n"
            "- user_name (имя монтажника или часть)\n"
            "- site_object_name (название объекта или часть)\n"
            "- ai_category: workplace|selfie|wall|documentation|unclear|null\n"
            "- ai_score_min, ai_score_max: 0-10\n"
            "- has_helmet: true|false|null\n"
            "- has_problem: true|false (если ai_score < 5 или issues непустой)\n"
            "- text_in_comment (поиск по comment + ai_comment)\n"
            "\n"
            "Запрос куратора: \"\"\"{query}\"\"\"\n"
            "Текущая дата (для относительных): {today_iso}\n\n"
            "Верни JSON-фильтр (только используемые поля, остальное опускай):\n"
            "{{\n"
            '  "filters": {{\n'
            '    "date_from": "ISO 8601 или null",\n'
            '    "user_name": "..." (опц),\n'
            '    "..." \n'
            "  }},\n"
            '  "limit": 20,\n'
            '  "order_by": "created_at_desc" | "ai_score_asc" | "ai_score_desc",\n'
            '  "intent_understood": true|false,\n'
            '  "explanation_ru": "что я понял из запроса"\n'
            "}}"
        ),
        "endpoint_kind": "text",
        # v1.4: gemini-primary заменён на groq llama-3.3-70b
        "default_model": ("groq", "llama-3.3-70b-versatile"),
        "fallback_chain": [
            ("groq", "llama-3.3-70b-versatile"),
            ("groq", "openai/gpt-oss-120b"),
        ],
        "paid_fallback_chain": [
            ("anthropic", "claude-haiku-4-5-20251001"),
        ],
        "max_tokens": 400,
        "temperature": 0.1,
    },
    # ── 8. stock_forecast ────────────────────────────────────────
    "stock_forecast": {
        "system": (
            "Ты — AI-аналитик складских остатков для мебельной фабрики BELSI. "
            "Анализируешь историю расхода материалов и даёшь прогноз когда они закончатся. "
            "Также объясняешь причины ускорения/замедления расхода. "
            "Отвечай ТОЛЬКО валидным JSON."
        ),
        "user_template": (
            "Фабрика: {facility_name}\n\n"
            "Текущие остатки (top-N материалов по риску):\n"
            "{stock_data_json}\n\n"
            "История расхода за 30 дней (по дням):\n"
            "{usage_history_json}\n\n"
            "Активные партии (ещё в производстве):\n"
            "{active_batches_json}\n\n"
            "Верни JSON:\n"
            "{{\n"
            '  "forecasts": [\n'
            '    {{\n'
            '      "material_code": "M-001",\n'
            '      "material_name": "ЛДСП 16мм",\n'
            '      "current_stock": 24,\n'
            '      "unit": "м²",\n'
            '      "daily_avg_usage": 8.0,\n'
            '      "days_left": 3,\n'
            '      "depletion_date": "ISO дата",\n'
            '      "risk": "critical" | "high" | "medium" | "low",\n'
            '      "reason_ru": "причина риска или роста расхода",\n'
            '      "recommended_order_quantity": 200,\n'
            '      "recommended_order_unit": "м²"\n'
            '    }}\n'
            "  ],\n"
            '  "summary_ru": "общая сводка ситуации со складом 1-2 предложения",\n'
            '  "actions": [список рекомендуемых действий снабженца]\n'
            "}}"
        ),
        "endpoint_kind": "text",
        # v1.4: gemini + deepseek убраны
        "default_model": ("groq", "llama-3.3-70b-versatile"),
        "fallback_chain": [
            ("groq", "llama-3.3-70b-versatile"),
            ("sambanova", "Meta-Llama-3.3-70B-Instruct"),
            ("openrouter", "openai/gpt-oss-120b:free"),
        ],
        "paid_fallback_chain": [
            ("anthropic", "claude-haiku-4-5-20251001"),
        ],
        "max_tokens": 1000,
        "temperature": 0.3,
    },
}


# ╔══════════════════════════════════════════════════════════════╗
# ║   Provider key resolution                                    ║
# ╚══════════════════════════════════════════════════════════════╝
def _provider_key(provider: str) -> Optional[str]:
    """Возвращает API-ключ провайдера из settings (None — провайдер недоступен)."""
    return {
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
        "anthropic": getattr(settings, "anthropic_api_key", None),
        "openai": getattr(settings, "openai_api_key", None),
        "gemini": getattr(settings, "gemini_api_key", None)
        or getattr(settings, "google_api_key", None),
        # v1.4 ↓
        "cerebras": getattr(settings, "cerebras_api_key", None),
        "sambanova": getattr(settings, "sambanova_api_key", None),
        "apiyi": getattr(settings, "apiyi_api_key", None),
    }.get(provider)


def _httpx_client(timeout: float = 120.0) -> httpx.AsyncClient:
    """httpx client с VLESS-прокси из config.api_proxy (если задан)."""
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        transport = httpx.AsyncHTTPTransport(proxy=proxy)
        return httpx.AsyncClient(transport=transport, timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


# ╔══════════════════════════════════════════════════════════════╗
# ║   JSON extraction (LLM может вернуть markdown ```json ...)   ║
# ╚══════════════════════════════════════════════════════════════╝
_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)\s*```", re.DOTALL)


def _extract_json(raw: str) -> Optional[Dict[str, Any]]:
    """Пытается извлечь и распарсить JSON из строки. None если не получилось."""
    if not raw:
        return None
    raw = raw.strip()

    # 1. Сразу JSON
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        pass

    # 2. JSON в markdown fence
    m = _JSON_FENCE_RE.search(raw)
    if m:
        try:
            return json.loads(m.group(1))
        except (json.JSONDecodeError, ValueError):
            pass

    # 3. Ищем первую { ... } группу
    start = raw.find("{")
    if start >= 0:
        depth = 0
        for i in range(start, len(raw)):
            ch = raw[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = raw[start : i + 1]
                    try:
                        return json.loads(candidate)
                    except (json.JSONDecodeError, ValueError):
                        break
    return None


# ╔══════════════════════════════════════════════════════════════╗
# ║   Provider call adapters                                     ║
# ╚══════════════════════════════════════════════════════════════╝
async def _call_gemini(
    model: str,
    system: str,
    user_text: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    max_tokens: int,
    temperature: float,
) -> Tuple[str, int, int]:
    """Returns (text, tokens_in, tokens_out)."""
    api_key = _provider_key("gemini")
    if not api_key:
        raise RuntimeError("Gemini API key not configured")

    parts: List[Dict[str, Any]] = [{"text": user_text}]
    if image_base64:
        parts.append(
            {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": image_base64,
                }
            }
        )
    elif image_url:
        # Gemini требует именно inline_data — для image_url нужно скачать
        async with _httpx_client(timeout=30) as c:
            r = await c.get(image_url)
            r.raise_for_status()
            import base64

            b64 = base64.b64encode(r.content).decode("ascii")
            mime = r.headers.get("content-type", "image/jpeg").split(";")[0]
            parts.append({"inline_data": {"mime_type": mime, "data": b64}})

    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json",
        },
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    async with _httpx_client() as c:
        resp = await c.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()

    text = ""
    candidates = data.get("candidates") or []
    if candidates:
        content = candidates[0].get("content", {})
        for p in content.get("parts", []):
            if "text" in p:
                text += p["text"]

    usage = data.get("usageMetadata", {}) or {}
    tokens_in = int(usage.get("promptTokenCount") or 0)
    tokens_out = int(usage.get("candidatesTokenCount") or 0)
    return text, tokens_in, tokens_out


async def _call_openai_compatible(
    base_url: str,
    api_key: str,
    model: str,
    system: str,
    user_text: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    max_tokens: int,
    temperature: float,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Tuple[str, int, int]:
    """OpenAI-compatible chat completions (Groq, OpenRouter)."""
    user_content: Union[str, List[Dict[str, Any]]]
    if image_url or image_base64:
        parts: List[Dict[str, Any]] = [{"type": "text", "text": user_text}]
        if image_url:
            parts.append({"type": "image_url", "image_url": {"url": image_url}})
        elif image_base64:
            parts.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                }
            )
        user_content = parts
    else:
        user_content = user_text

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user_content})

    body = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    async with _httpx_client() as c:
        resp = await c.post(f"{base_url}/chat/completions", json=body, headers=headers)
        # Some providers reject response_format — retry без него
        if resp.status_code == 400:
            body.pop("response_format", None)
            resp = await c.post(f"{base_url}/chat/completions", json=body, headers=headers)
        # gpt-5.x / o-series — требуют max_completion_tokens вместо max_tokens
        # и не поддерживают temperature != default (1.0). Делаем второй retry.
        if resp.status_code == 400 and (
            "max_completion_tokens" in resp.text
            or "max_tokens" in resp.text
            or ("temperature" in resp.text and "Unsupported" in resp.text)
        ):
            body.pop("max_tokens", None)
            body.pop("temperature", None)
            body["max_completion_tokens"] = max_tokens
            resp = await c.post(f"{base_url}/chat/completions", json=body, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    text = ""
    choices = data.get("choices") or []
    if choices:
        text = choices[0].get("message", {}).get("content", "") or ""
    usage = data.get("usage", {}) or {}
    tokens_in = int(usage.get("prompt_tokens") or 0)
    tokens_out = int(usage.get("completion_tokens") or 0)
    return text, tokens_in, tokens_out


async def _call_anthropic(
    model: str,
    system: str,
    user_text: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    max_tokens: int,
    temperature: float,
) -> Tuple[str, int, int]:
    """Claude messages API."""
    api_key = _provider_key("anthropic")
    if not api_key:
        raise RuntimeError("Anthropic API key not configured")

    user_content: List[Dict[str, Any]] = [{"type": "text", "text": user_text}]
    if image_base64:
        user_content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_base64,
                },
            }
        )
    elif image_url:
        async with _httpx_client(timeout=30) as c:
            r = await c.get(image_url)
            r.raise_for_status()
            import base64

            b64 = base64.b64encode(r.content).decode("ascii")
            user_content.append(
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
                }
            )

    body = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": user_content}],
    }
    if system:
        body["system"] = system

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    async with _httpx_client() as c:
        resp = await c.post(
            "https://api.anthropic.com/v1/messages", json=body, headers=headers
        )
        resp.raise_for_status()
        data = resp.json()

    text = ""
    for block in data.get("content", []) or []:
        if block.get("type") == "text":
            text += block.get("text", "")
    usage = data.get("usage", {}) or {}
    tokens_in = int(usage.get("input_tokens") or 0)
    tokens_out = int(usage.get("output_tokens") or 0)
    return text, tokens_in, tokens_out


# ╔══════════════════════════════════════════════════════════════╗
# ║   Groq Whisper (audio transcription)                         ║
# ╚══════════════════════════════════════════════════════════════╝
async def _call_whisper(
    provider: str,
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    model: str = "whisper-large-v3-turbo",
    language: str = "ru",
    prompt_hint: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Универсальный Whisper-вызов (Groq + OpenAI — оба OpenAI-compatible audio API).
    Returns dict {text, language, duration, segments?, ...}.
    """
    if provider == "groq":
        base_url = "https://api.groq.com/openai/v1"
        api_key = _provider_key("groq")
    elif provider == "openai":
        base_url = "https://api.openai.com/v1"
        api_key = _provider_key("openai")
    else:
        raise RuntimeError(f"Unknown whisper provider: {provider}")
    if not api_key:
        raise RuntimeError(f"{provider} API key not configured")

    files = {"file": (filename, audio_bytes, mime_type or "audio/mpeg")}
    data: Dict[str, str] = {
        "model": model,
        "language": language,
        "response_format": "verbose_json",  # segments + duration
    }
    if prompt_hint:
        data["prompt"] = prompt_hint

    async with _httpx_client(timeout=180.0) as c:
        resp = await c.post(
            f"{base_url}/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
            data=data,
        )
        resp.raise_for_status()
        return resp.json()


# Бэк-компат алиас для существующих тестов / импортёров (mock в test_external использует это имя).
async def _call_groq_whisper(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    model: str = "whisper-large-v3-turbo",
    language: str = "ru",
    prompt_hint: Optional[str] = None,
) -> Dict[str, Any]:
    return await _call_whisper(
        "groq", audio_bytes, filename, mime_type, model, language, prompt_hint
    )


# ╔══════════════════════════════════════════════════════════════╗
# ║   Cost estimation (rough · USD per 1M tokens)                ║
# ╚══════════════════════════════════════════════════════════════╝
_COST_TABLE: Dict[Tuple[str, str], Tuple[float, float]] = {
    # (provider, model_substring): (in_per_1M, out_per_1M)
    # ── Free / very cheap providers ──
    ("gemini", "gemini-2.0-flash"): (0.10, 0.40),
    ("gemini", "gemini-1.5-flash"): (0.075, 0.30),
    ("gemini", "gemini-1.5-pro"): (1.25, 5.00),
    ("groq", "llama-3.3-70b"): (0.59, 0.79),
    ("groq", "llama-3.2-90b-vision"): (0.90, 0.90),
    ("groq", "llama-3.1-8b"): (0.05, 0.08),
    ("groq", "llama-4-scout"): (0.11, 0.34),
    ("groq", "gpt-oss-20b"): (0.10, 0.50),
    ("groq", "gpt-oss-120b"): (0.15, 0.75),
    ("groq", "qwen3-32b"): (0.29, 0.59),
    ("groq", "whisper"): (0.0, 0.0),  # Groq Whisper — бесплатный tier
    ("openrouter", "free"): (0.0, 0.0),
    ("openrouter", "deepseek"): (0.0, 0.0),
    ("openrouter", "gpt-oss-120b"): (0.0, 0.0),
    ("openrouter", "gemma-4"): (0.0, 0.0),
    ("openrouter", "nemotron"): (0.0, 0.0),
    # ── Cerebras / SambaNova — free tier (1M tok/день) ──
    ("cerebras", "llama"): (0.0, 0.0),
    ("cerebras", "gpt-oss"): (0.0, 0.0),
    ("cerebras", "qwen"): (0.0, 0.0),
    ("cerebras", "zai"): (0.0, 0.0),
    ("sambanova", "Llama"): (0.0, 0.0),
    ("sambanova", "DeepSeek"): (0.0, 0.0),
    ("sambanova", "MiniMax"): (0.0, 0.0),
    ("sambanova", "gemma"): (0.0, 0.0),
    ("sambanova", "gpt-oss"): (0.0, 0.0),
    # ── Anthropic 4-x family (актуальные на 2026-05) ──
    ("anthropic", "haiku-4-5"): (1.00, 5.00),
    ("anthropic", "haiku"): (0.80, 4.00),
    ("anthropic", "sonnet-4-6"): (3.00, 15.00),
    ("anthropic", "sonnet"): (3.00, 15.00),
    ("anthropic", "opus-4-7"): (15.00, 75.00),
    ("anthropic", "opus"): (15.00, 75.00),
    # ── OpenAI (gpt-5 family + legacy) ──
    ("openai", "gpt-5-nano"): (0.05, 0.40),
    ("openai", "gpt-5-mini"): (0.25, 2.00),
    ("openai", "gpt-5"): (1.25, 10.00),
    ("openai", "gpt-4o-mini"): (0.15, 0.60),
    ("openai", "gpt-4o"): (2.50, 10.00),
    ("openai", "gpt-4.1-nano"): (0.10, 0.40),
    ("openai", "gpt-4.1-mini"): (0.40, 1.60),
    ("openai", "whisper"): (0.0, 0.0),  # cost через duration_sec, не через токены — отдельная логика
    # ── Apiyi proxy (~+10% markup vs прямой провайдер) ──
    ("apiyi", "haiku"): (1.10, 5.50),
    ("apiyi", "sonnet"): (3.30, 16.50),
    ("apiyi", "opus"): (16.50, 82.50),
    ("apiyi", "gpt-5-nano"): (0.05, 0.45),
    ("apiyi", "gpt-5-mini"): (0.30, 2.20),
    ("apiyi", "gpt-4o-mini"): (0.20, 0.80),
    ("apiyi", "gpt-4o"): (3.00, 12.00),
}


def _estimate_cost(provider: str, model: str, tokens_in: int, tokens_out: int) -> Decimal:
    """Грубая оценка cost в USD (Decimal)."""
    rate_in, rate_out = 0.0, 0.0
    for (p, m_sub), (rin, rout) in _COST_TABLE.items():
        if p == provider and m_sub in model:
            rate_in, rate_out = rin, rout
            break
    cost = (tokens_in / 1_000_000.0) * rate_in + (tokens_out / 1_000_000.0) * rate_out
    return Decimal(str(round(cost, 8)))


# ╔══════════════════════════════════════════════════════════════╗
# ║   Provider dispatcher                                        ║
# ╚══════════════════════════════════════════════════════════════╝
async def _dispatch_provider(
    provider: str,
    model: str,
    system: str,
    user_text: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    max_tokens: int,
    temperature: float,
) -> Tuple[str, int, int]:
    if provider == "gemini":
        return await _call_gemini(
            model, system, user_text, image_url, image_base64, max_tokens, temperature
        )
    if provider == "groq":
        api_key = _provider_key("groq")
        if not api_key:
            raise RuntimeError("Groq API key not configured")
        return await _call_openai_compatible(
            "https://api.groq.com/openai/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
        )
    if provider == "openrouter":
        api_key = _provider_key("openrouter")
        if not api_key:
            raise RuntimeError("OpenRouter API key not configured")
        return await _call_openai_compatible(
            "https://openrouter.ai/api/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
            extra_headers={
                "HTTP-Referer": "https://xerocode.ru",
                "X-Title": "XeroCode External Gateway",
            },
        )
    if provider == "anthropic":
        return await _call_anthropic(
            model, system, user_text, image_url, image_base64, max_tokens, temperature
        )
    if provider == "openai":
        api_key = _provider_key("openai")
        if not api_key:
            raise RuntimeError("OpenAI API key not configured")
        return await _call_openai_compatible(
            "https://api.openai.com/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
        )
    if provider == "cerebras":
        # Cerebras держится в коде как dormant fallback (через model_override).
        # В дефолтных fallback chains не используется (через VLESS медленнее Groq).
        api_key = _provider_key("cerebras")
        if not api_key:
            raise RuntimeError("Cerebras API key not configured")
        return await _call_openai_compatible(
            "https://api.cerebras.ai/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
        )
    if provider == "sambanova":
        api_key = _provider_key("sambanova")
        if not api_key:
            raise RuntimeError("SambaNova API key not configured")
        return await _call_openai_compatible(
            "https://api.sambanova.ai/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
        )
    if provider == "apiyi":
        # Apiyi.com — китайский OpenAI-compatibility прокси.
        # Используется для платных моделей (Claude, GPT-5) в paid_fallback_chain.
        api_key = _provider_key("apiyi")
        if not api_key:
            raise RuntimeError("Apiyi API key not configured")
        return await _call_openai_compatible(
            "https://api.apiyi.com/v1",
            api_key,
            model,
            system,
            user_text,
            image_url,
            image_base64,
            max_tokens,
            temperature,
        )
    raise RuntimeError(f"Unknown provider: {provider}")


# ╔══════════════════════════════════════════════════════════════╗
# ║   Idempotency / budget checks                                ║
# ╚══════════════════════════════════════════════════════════════╝
async def _idempotency_lookup(
    db: AsyncSession, sa_id: uuid.UUID, request_id: Optional[str]
) -> Optional[ExternalEnvelope]:
    """Возвращает кэшированный envelope если этот request_id уже обрабатывался."""
    if not request_id:
        return None
    stmt = select(ServiceAccountUsage).where(
        ServiceAccountUsage.service_account_id == sa_id,
        ServiceAccountUsage.request_id == request_id,
    ).limit(1)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row and row.response_cache:
        try:
            data = json.loads(row.response_cache)
            data["meta"] = data.get("meta", {})
            data["meta"]["replayed"] = True
            return ExternalEnvelope(**data)
        except (json.JSONDecodeError, TypeError):
            return None
    return None


async def _budget_check(db: AsyncSession, sa: ServiceAccount) -> Optional[str]:
    """Returns reason-string if budget/rate exceeded, None if OK."""
    # Daily request count
    from sqlalchemy import func as sa_func

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    cnt_stmt = select(sa_func.count(ServiceAccountUsage.id)).where(
        ServiceAccountUsage.service_account_id == sa.id,
        ServiceAccountUsage.created_at >= today_start,
    )
    today_cnt = await db.scalar(cnt_stmt) or 0
    if today_cnt >= sa.rate_limit_per_day:
        return f"Daily limit exceeded ({sa.rate_limit_per_day})"

    # Monthly cost
    if sa.monthly_budget_usd and sa.monthly_budget_usd > 0:
        month_start = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        cost_stmt = select(sa_func.coalesce(sa_func.sum(ServiceAccountUsage.cost_usd), 0)).where(
            ServiceAccountUsage.service_account_id == sa.id,
            ServiceAccountUsage.created_at >= month_start,
        )
        month_cost = await db.scalar(cost_stmt) or Decimal("0")
        if Decimal(str(month_cost)) >= sa.monthly_budget_usd:
            return f"Monthly budget exceeded (${sa.monthly_budget_usd})"

    return None


# ╔══════════════════════════════════════════════════════════════╗
# ║   Main entry point                                           ║
# ╚══════════════════════════════════════════════════════════════╝
async def call_with_fallback(
    template_key: str,
    payload: Union[AnalyzeImageRequest, GenerateRequest],
    sa: ServiceAccount,
    db: AsyncSession,
    endpoint: str,
) -> ExternalEnvelope:
    """
    Главная точка входа. Подбирает провайдера → делает запрос с fallback chain →
    парсит JSON → пишет usage → возвращает envelope.
    """
    request_id = getattr(payload, "request_id", None)
    now = datetime.now(timezone.utc)

    # ── 1. Idempotency ──
    if request_id:
        cached = await _idempotency_lookup(db, sa.id, request_id)
        if cached is not None:
            logger.info("[external] idempotent replay sa=%s req=%s", sa.id, request_id)
            return cached

    # ── 2. Template ──
    template = BELSI_PROMPT_TEMPLATES.get(template_key)
    if template is None:
        return ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=now,
            error={
                "code": "unknown_template",
                "message": f"Template '{template_key}' not found",
                "available": list(BELSI_PROMPT_TEMPLATES.keys()),
            },
            meta={"endpoint": endpoint},
        )

    # ── 3. Budget / quota ──
    budget_reason = await _budget_check(db, sa)
    if budget_reason:
        return ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=now,
            error={"code": "quota_exceeded", "message": budget_reason},
            meta={"endpoint": endpoint},
        )

    # ── 4. Build prompt ──
    system = template["system"]
    user_template_str = template["user_template"]

    if isinstance(payload, AnalyzeImageRequest):
        ctx = payload.custom_context or {}
        ctx_str = (
            "\n".join(f"{k}: {v}" for k, v in ctx.items()) if ctx else "(контекст не задан)"
        )

        # v1.3.2: пользовательский комментарий монтажника (shift_photos.comment)
        # рендерится отдельной секцией с явными правилами интерпретации.
        # Шаблоны без `{user_comment_section}` placeholder'а — игнорируют эту секцию.
        user_comment_raw = ctx.get("user_comment") if isinstance(ctx, dict) else None
        user_comment = (user_comment_raw or "").strip() if isinstance(user_comment_raw, str) else ""
        if user_comment:
            user_comment_section = (
                "КОММЕНТАРИЙ ОТ АВТОРА ФОТО (используй для контекста):\n"
                f'"{user_comment}"\n\n'
                "ВАЖНО: учитывай этот комментарий при оценке. Если автор пишет:\n"
                "- 'результат / готово / собрано / закончил' — это фото-итог, score обычно 8-9\n"
                "- 'проблема / повреждение / брак' — документация проблемы, category=documentation\n"
                "- 'ждём / простой' — фото-обоснование простоя\n"
                "Если фото противоречит комментарию — понижай score и добавь issue "
                "\"фото не соответствует описанию\".\n\n"
            )
        else:
            user_comment_section = ""

        # Защита от collision: ctx может содержать ключи `custom_context_str` /
        # `user_comment_section` — отбрасываем их перед **ctx_for_format.
        ctx_for_format = {
            k: v for k, v in ctx.items()
            if k not in ("custom_context_str", "user_comment_section")
        }
        try:
            user_text = user_template_str.format(
                custom_context_str=ctx_str,
                user_comment_section=user_comment_section,
                **ctx_for_format,
            )
        except (KeyError, IndexError):
            # Fallback: безопасная замена двух главных placeholder'ов.
            user_text = (
                user_template_str
                .replace("{custom_context_str}", ctx_str)
                .replace("{user_comment_section}", user_comment_section)
            )
        image_url = payload.image_url
        image_base64 = payload.image_base64
    else:
        # GenerateRequest
        # v2: текстовые шаблоны могут использовать либо именованные placeholder'ы
        # (старый стиль: {date}, {active_shifts}), либо целиком всю payload.data
        # как JSON-строку через {data_json} (для шаблонов с произвольной структурой,
        # например daily_summary v2).
        data_dict = payload.data or {}
        try:
            data_json_str = json.dumps(data_dict, ensure_ascii=False, sort_keys=False)
        except (TypeError, ValueError):
            data_json_str = "{}"

        # Защита от collision: если payload.data случайно содержит ключ data_json —
        # его собственное значение перебивается нашим renderom (чтобы шаблон работал).
        kwargs_for_format = {k: v for k, v in data_dict.items() if k != "data_json"}
        try:
            user_text = user_template_str.format(
                data_json=data_json_str, **kwargs_for_format
            )
        except (KeyError, IndexError) as e:
            return ExternalEnvelope(
                ok=False,
                request_id=request_id,
                timestamp=now,
                error={
                    "code": "template_data_missing",
                    "message": f"Missing field in template: {e}",
                },
                meta={"endpoint": endpoint},
            )
        image_url = None
        image_base64 = None

    max_tokens = (
        payload.max_tokens
        if payload.max_tokens
        else int(template.get("max_tokens", 800))
    )
    temperature = (
        payload.temperature
        if payload.temperature is not None
        else float(template.get("temperature", 0.5))
    )

    # ── 5. Provider chain ──
    # v1.4: если клиент дал явный model_override — используем ТОЛЬКО его (одна попытка).
    # Иначе строим chain = fallback_chain + (paid_fallback_chain если allow_paid_fallback=True).
    if payload.model_override:
        # 'provider/model' format. Слэш в model сохраняем (split с maxsplit=1).
        if "/" in payload.model_override:
            prov, mdl = payload.model_override.split("/", 1)
            chain: List[Tuple[str, str]] = [(prov, mdl)]
        else:
            chain = [template["default_model"]]
    else:
        chain = list(template.get("fallback_chain") or [template["default_model"]])
        # v1.4: paid позиции — только при явном opt-in
        if getattr(payload, "allow_paid_fallback", False):
            paid = template.get("paid_fallback_chain") or []
            chain = chain + list(paid)

    # ── 6. Allowed-models filter ──
    if sa.allowed_models:
        chain = [
            (p, m) for (p, m) in chain if any(allowed in m for allowed in sa.allowed_models)
        ] or chain  # если фильтр выкинул всё — всё равно пробуем

    last_error: Optional[Exception] = None
    last_provider, last_model = chain[0] if chain else (None, None)
    raw_text = ""
    tokens_in = tokens_out = 0
    duration_ms = 0
    success_provider: Optional[Tuple[str, str]] = None
    warnings: List[str] = []

    for (provider, model) in chain:
        if not _provider_key(provider):
            warnings.append(f"{provider}: skipped (no API key)")
            continue
        last_provider, last_model = provider, model
        t0 = time.monotonic()
        try:
            raw_text, tokens_in, tokens_out = await _dispatch_provider(
                provider=provider,
                model=model,
                system=system,
                user_text=user_text,
                image_url=image_url,
                image_base64=image_base64,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            duration_ms = int((time.monotonic() - t0) * 1000)
            success_provider = (provider, model)
            break
        except (httpx.HTTPError, RuntimeError, asyncio.TimeoutError) as e:
            duration_ms = int((time.monotonic() - t0) * 1000)
            last_error = e
            warnings.append(f"{provider}/{model}: {type(e).__name__}: {str(e)[:120]}")
            logger.warning(
                "[external] provider=%s model=%s failed: %s", provider, model, e
            )
            # log failed attempt
            await _log_usage(
                db,
                sa,
                endpoint,
                provider,
                model,
                tokens_in=0,
                tokens_out=0,
                cost=Decimal("0"),
                duration_ms=duration_ms,
                status_code=502,
                error_code=type(e).__name__,
                request_id=None,  # не блокируем idempotency на failed
            )
            continue

    # ── 7. All providers failed ──
    if success_provider is None:
        envelope = ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=datetime.now(timezone.utc),
            error={
                "code": "all_providers_failed",
                "message": str(last_error) if last_error else "no providers available",
            },
            meta={
                "endpoint": endpoint,
                "template": template_key,
                "attempts": len(chain),
                "provider": last_provider,
                "model": last_model,
            },
            warnings=warnings,
        )
        return envelope

    # ── 8. Parse JSON ──
    parsed = _extract_json(raw_text)
    if parsed is None:
        # Один retry — попросим модель переформатировать
        envelope = ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=datetime.now(timezone.utc),
            error={
                "code": "invalid_json_response",
                "message": "Provider returned non-JSON output",
                "raw_excerpt": raw_text[:500] if raw_text else "",
            },
            meta={
                "endpoint": endpoint,
                "template": template_key,
                "provider": success_provider[0],
                "model": success_provider[1],
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "duration_ms": duration_ms,
            },
            warnings=warnings,
        )
        # Log as a 200-but-invalid response
        await _log_usage(
            db,
            sa,
            endpoint,
            success_provider[0],
            success_provider[1],
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost=_estimate_cost(success_provider[0], success_provider[1], tokens_in, tokens_out),
            duration_ms=duration_ms,
            status_code=502,
            error_code="invalid_json",
            request_id=request_id,
            response_cache=envelope.model_dump_json(),
        )
        return envelope

    # ── 9. Optional jsonschema validation ──
    expected_schema = getattr(payload, "expected_schema", None)
    if expected_schema:
        try:
            import jsonschema  # type: ignore

            jsonschema.validate(instance=parsed, schema=expected_schema)
        except ImportError:
            warnings.append("jsonschema not installed — schema validation skipped")
        except Exception as e:  # ValidationError
            warnings.append(f"schema validation: {type(e).__name__}: {str(e)[:120]}")

    cost = _estimate_cost(
        success_provider[0], success_provider[1], tokens_in, tokens_out
    )

    envelope = ExternalEnvelope(
        ok=True,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc),
        result=parsed,
        meta={
            "endpoint": endpoint,
            "template": template_key,
            "provider": success_provider[0],
            "model": success_provider[1],
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "duration_ms": duration_ms,
            "cost_usd": float(cost),
        },
        warnings=warnings,
    )

    # ── 10. Persist usage ──
    await _log_usage(
        db,
        sa,
        endpoint,
        success_provider[0],
        success_provider[1],
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost=cost,
        duration_ms=duration_ms,
        status_code=200,
        error_code=None,
        request_id=request_id,
        response_cache=envelope.model_dump_json(),
    )

    return envelope


# ╔══════════════════════════════════════════════════════════════╗
# ║   Transcribe entry point (audio → text)                      ║
# ╚══════════════════════════════════════════════════════════════╝
async def call_transcribe(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    language: str,
    prompt_hint: Optional[str],
    request_id: Optional[str],
    sa: ServiceAccount,
    db: AsyncSession,
    model_override: Optional[str] = None,
    allow_paid_fallback: bool = False,
) -> ExternalEnvelope:
    """
    Голос → текст через Groq Whisper. Аналог call_with_fallback() для audio.

    Возвращает ExternalEnvelope.result со структурой:
        {"text": str, "language_detected": str, "duration_sec": float, "segments": [...]}
    """
    template_key = "voice_transcribe"
    now = datetime.now(timezone.utc)
    endpoint = "transcribe"

    # ── 1. Idempotency ──
    if request_id:
        cached = await _idempotency_lookup(db, sa.id, request_id)
        if cached is not None:
            logger.info(
                "[external/transcribe] idempotent replay sa=%s req=%s",
                sa.id,
                request_id,
            )
            return cached

    template = BELSI_PROMPT_TEMPLATES.get(template_key)
    if template is None:
        return ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=now,
            error={"code": "unknown_template", "message": "voice_transcribe missing"},
            meta={"endpoint": endpoint},
        )

    # ── 2. Budget ──
    budget_reason = await _budget_check(db, sa)
    if budget_reason:
        return ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=now,
            error={"code": "quota_exceeded", "message": budget_reason},
            meta={"endpoint": endpoint},
        )

    # ── 3. Prompt-hint ──
    final_prompt_hint = prompt_hint or template.get("default_prompt_hint")

    # ── 4. Provider chain ──
    # v1.4: paid_fallback (openai whisper-1) добавляется только при allow_paid_fallback=True.
    if model_override:
        if "/" in model_override:
            prov, mdl = model_override.split("/", 1)
            chain: List[Tuple[str, str]] = [(prov, mdl)]
        else:
            chain = [template["default_model"]]
    else:
        chain = list(template.get("fallback_chain") or [template["default_model"]])
        if allow_paid_fallback:
            paid = template.get("paid_fallback_chain") or []
            chain = chain + list(paid)

    # ── 5. allowed_models filter ──
    if sa.allowed_models:
        filtered = [
            (p, m) for (p, m) in chain if any(allow in m for allow in sa.allowed_models)
        ]
        if filtered:
            chain = filtered

    last_error: Optional[Exception] = None
    success: Optional[Tuple[str, str]] = None
    raw_data: Dict[str, Any] = {}
    duration_ms = 0
    warnings: List[str] = []

    # v1.4: разрешаем groq (whisper-large-v3*) и openai (whisper-1) для аудио.
    _AUDIO_PROVIDERS = {"groq", "openai"}
    for (provider, model) in chain:
        if provider not in _AUDIO_PROVIDERS:
            warnings.append(f"{provider}: skipped (no whisper endpoint here)")
            continue
        if not _provider_key(provider):
            warnings.append(f"{provider}: skipped (no API key)")
            continue
        t0 = time.monotonic()
        try:
            # v1.4: groq и openai оба OpenAI-compat audio API.
            # Для groq используем существующий _call_groq_whisper (на нём mock в тестах).
            if provider == "groq":
                raw_data = await _call_groq_whisper(
                    audio_bytes=audio_bytes,
                    filename=filename,
                    mime_type=mime_type,
                    model=model,
                    language=language,
                    prompt_hint=final_prompt_hint,
                )
            else:
                raw_data = await _call_whisper(
                    provider=provider,
                    audio_bytes=audio_bytes,
                    filename=filename,
                    mime_type=mime_type,
                    model=model,
                    language=language,
                    prompt_hint=final_prompt_hint,
                )
            duration_ms = int((time.monotonic() - t0) * 1000)
            success = (provider, model)
            break
        except (httpx.HTTPError, RuntimeError, asyncio.TimeoutError) as e:
            duration_ms = int((time.monotonic() - t0) * 1000)
            last_error = e
            warnings.append(f"{provider}/{model}: {type(e).__name__}: {str(e)[:120]}")
            logger.warning(
                "[external/transcribe] provider=%s model=%s failed: %s",
                provider,
                model,
                e,
            )
            await _log_usage(
                db,
                sa,
                endpoint,
                provider,
                model,
                tokens_in=0,
                tokens_out=0,
                cost=Decimal("0"),
                duration_ms=duration_ms,
                status_code=502,
                error_code=type(e).__name__,
                request_id=None,
            )
            continue

    if success is None:
        return ExternalEnvelope(
            ok=False,
            request_id=request_id,
            timestamp=datetime.now(timezone.utc),
            error={
                "code": "all_providers_failed",
                "message": str(last_error) if last_error else "no whisper providers",
            },
            meta={"endpoint": endpoint, "template": template_key, "attempts": len(chain)},
            warnings=warnings,
        )

    # ── 6. Build result ──
    text_out = (raw_data.get("text") or "").strip()
    language_detected = raw_data.get("language") or language
    duration_sec = float(raw_data.get("duration") or 0.0)
    segments_raw = raw_data.get("segments") or []
    segments = [
        {
            "start": float(s.get("start", 0.0)),
            "end": float(s.get("end", 0.0)),
            "text": str(s.get("text", "")).strip(),
        }
        for s in segments_raw
    ]

    # Whisper free tier — cost = 0
    cost = Decimal("0")
    # Tokens: у Whisper нет такого поля, считаем 0/0 (для usage-аналитики используется duration_ms)
    tokens_in = tokens_out = 0

    envelope = ExternalEnvelope(
        ok=True,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc),
        result={
            "text": text_out,
            "language_detected": language_detected,
            "duration_sec": duration_sec,
            "segments": segments,
        },
        meta={
            "endpoint": endpoint,
            "template": template_key,
            "provider": success[0],
            "model": success[1],
            "audio_bytes": len(audio_bytes),
            "duration_ms": duration_ms,
            "cost_usd": float(cost),
        },
        warnings=warnings,
    )

    await _log_usage(
        db,
        sa,
        endpoint,
        success[0],
        success[1],
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost=cost,
        duration_ms=duration_ms,
        status_code=200,
        error_code=None,
        request_id=request_id,
        response_cache=envelope.model_dump_json(),
    )

    return envelope


# ╔══════════════════════════════════════════════════════════════╗
# ║   Usage logger                                               ║
# ╚══════════════════════════════════════════════════════════════╝
async def _log_usage(
    db: AsyncSession,
    sa: ServiceAccount,
    endpoint: str,
    provider: str,
    model: str,
    tokens_in: int,
    tokens_out: int,
    cost: Decimal,
    duration_ms: int,
    status_code: int,
    error_code: Optional[str],
    request_id: Optional[str],
    response_cache: Optional[str] = None,
) -> None:
    try:
        row = ServiceAccountUsage(
            service_account_id=sa.id,
            endpoint=endpoint,
            provider=provider,
            model=model,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            cost_usd=cost,
            duration_ms=duration_ms,
            status_code=status_code,
            error_code=error_code,
            request_id=request_id,
            response_cache=response_cache,
        )
        db.add(row)
        await db.commit()
    except Exception as e:
        logger.error("[external] failed to log usage: %s", e)
        await db.rollback()


def get_template_keys() -> List[str]:
    """Список доступных шаблонов (для /templates endpoint)."""
    return list(BELSI_PROMPT_TEMPLATES.keys())
