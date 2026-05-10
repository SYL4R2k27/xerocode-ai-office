"""Найти актуальные replacement-модели для сломанных позиций.

Что делаем:
1. GET /openai/v1/models у Groq (фильтр vision + active)
2. GET /api/v1/models у OpenRouter (фильтр :free + актуальный supported_parameters.image)
3. Пинг кандидатов
"""
from __future__ import annotations

import asyncio
import io
import os
import struct
import sys
import time
import wave
from typing import Any, Dict, List, Optional, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402


def _httpx_client(timeout: float = 60.0) -> httpx.AsyncClient:
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        transport = httpx.AsyncHTTPTransport(proxy=proxy)
        return httpx.AsyncClient(transport=transport, timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


def _key(p: str) -> Optional[str]:
    return {
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
        "anthropic": getattr(settings, "anthropic_api_key", None),
        "gemini": getattr(settings, "gemini_api_key", None)
        or getattr(settings, "google_api_key", None),
    }.get(p)


async def list_groq_models() -> List[Dict[str, Any]]:
    api_key = _key("groq")
    if not api_key:
        return []
    async with _httpx_client() as c:
        r = await c.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        r.raise_for_status()
        return r.json().get("data", [])


async def list_openrouter_free() -> List[Dict[str, Any]]:
    """OpenRouter — без auth уже отдаёт каталог. Фильтруем :free."""
    async with _httpx_client() as c:
        r = await c.get("https://openrouter.ai/api/v1/models")
        r.raise_for_status()
        all_models = r.json().get("data", [])
    free = [m for m in all_models if ":free" in m.get("id", "")]
    return free


async def ping_groq_chat(model: str) -> Tuple[bool, str, float]:
    api_key = _key("groq")
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "reply with single word: OK"}],
        "max_tokens": 10,
        "temperature": 0.0,
    }
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:100]}", ms
        text = r.json()["choices"][0]["message"].get("content", "") or ""
        return True, text.strip()[:60], ms


async def ping_groq_vision(model: str) -> Tuple[bool, str, float]:
    """Vision-пинг: 1×1 красный pixel в base64."""
    api_key = _key("groq")
    # 1×1 PNG (red) — минимальный валидный
    PNG_RED_1X1 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
    )
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "what color? one word"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{PNG_RED_1X1}"},
                    },
                ],
            }
        ],
        "max_tokens": 10,
        "temperature": 0.0,
    }
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:100]}", ms
        text = r.json()["choices"][0]["message"].get("content", "") or ""
        return True, text.strip()[:60], ms


async def ping_openrouter(model: str) -> Tuple[bool, str, float]:
    api_key = _key("openrouter")
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "reply OK"}],
        "max_tokens": 10,
        "temperature": 0.0,
    }
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://xerocode.ru",
                "X-Title": "XeroCode Ping",
            },
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:100]}", ms
        text = r.json()["choices"][0]["message"].get("content", "") or ""
        return True, text.strip()[:60], ms


async def main():
    print("=" * 78)
    print("PHASE 1: discover live models")
    print("=" * 78)

    print("\n→ Groq /v1/models")
    try:
        groq_models = await list_groq_models()
        print(f"   total = {len(groq_models)}")
        # Все Groq модели сразу — у них в id видно vision/whisper
        for m in sorted(groq_models, key=lambda x: x.get("id", "")):
            mid = m.get("id", "")
            active = m.get("active", "?")
            ctx = m.get("context_window", "?")
            print(f"   {mid:<55} active={active}  ctx={ctx}")
    except Exception as e:
        print(f"   ERROR: {e}")
        groq_models = []

    print("\n→ OpenRouter /api/v1/models filter :free")
    try:
        or_free = await list_openrouter_free()
        print(f"   total = {len(or_free)}")
        # Фильтруем самые интересные: vision (multimodal) + актуальные модели
        for m in sorted(or_free, key=lambda x: x.get("id", "")):
            mid = m.get("id", "")
            arch = m.get("architecture", {})
            modal = arch.get("input_modalities", [])
            is_vision = "image" in modal
            ctx = m.get("context_length", "?")
            tag = "[VIS]" if is_vision else "     "
            print(f"   {tag} {mid:<55} ctx={ctx}")
    except Exception as e:
        print(f"   ERROR: {e}")
        or_free = []

    # ── PHASE 2: ping selected replacement candidates ──
    print("\n" + "=" * 78)
    print("PHASE 2: ping replacement candidates")
    print("=" * 78)

    # Groq vision candidates: всё что в models имеет 'vision' в id или Llama-4 (multimodal)
    groq_ids = [m.get("id", "") for m in groq_models if m.get("active")]
    groq_vision_candidates = [
        i for i in groq_ids if "vision" in i.lower() or "llama-4" in i.lower() or "scout" in i.lower() or "maverick" in i.lower()
    ]
    # топ-3 самых обещающих
    groq_vision_candidates = groq_vision_candidates[:5]

    # OpenRouter free vision candidates
    or_vision_candidates = [
        m["id"]
        for m in or_free
        if "image" in (m.get("architecture", {}).get("input_modalities", []) or [])
    ][:5]

    # OpenRouter free text candidates (Gemini/DeepSeek)
    or_text_candidates = [
        m["id"]
        for m in or_free
        if any(brand in m["id"].lower() for brand in ["gemini", "deepseek", "qwen", "llama-3"])
    ][:6]

    print(f"\nGroq vision candidates ({len(groq_vision_candidates)}):")
    for m in groq_vision_candidates:
        ok, msg, ms = await ping_groq_vision(m)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<55} {msg[:30]}")

    print(f"\nOpenRouter vision :free candidates ({len(or_vision_candidates)}):")
    for m in or_vision_candidates:
        ok, msg, ms = await ping_openrouter(m)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<55} {msg[:30]}")

    print(f"\nOpenRouter text :free candidates ({len(or_text_candidates)}):")
    for m in or_text_candidates:
        ok, msg, ms = await ping_openrouter(m)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<55} {msg[:30]}")

    print("\nDONE\n")


if __name__ == "__main__":
    asyncio.run(main())
