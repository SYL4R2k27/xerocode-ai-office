"""Smoke-ping всех провайдеров из BELSI v1.3 матрицы.

Запускать ТОЛЬКО на проде (там лежат ключи + VLESS-прокси).
Каждая модель — один минимальный запрос: 'reply OK' (текст) или 1-сек silent wav (whisper).
Печатает таблицу PASS/FAIL/SKIP с латентностью.
"""
from __future__ import annotations

import asyncio
import io
import os
import struct
import sys
import time
import traceback
import wave
from typing import Any, Dict, List, Optional, Tuple

# Настраиваем sys.path под прод-структуру (~/ai-office/backend/)
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402


# ─────────────────────────────────────────────────────────────
def _httpx_client(timeout: float = 60.0) -> httpx.AsyncClient:
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        transport = httpx.AsyncHTTPTransport(proxy=proxy)
        return httpx.AsyncClient(transport=transport, timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


def _provider_key(provider: str) -> Optional[str]:
    return {
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
        "anthropic": getattr(settings, "anthropic_api_key", None),
        "gemini": getattr(settings, "gemini_api_key", None)
        or getattr(settings, "google_api_key", None),
    }.get(provider)


# ─────────────────────────────────────────────────────────────
async def ping_gemini(model: str) -> Tuple[bool, str, float]:
    api_key = _provider_key("gemini")
    if not api_key:
        return False, "no GEMINI_API_KEY/GOOGLE_API_KEY", 0.0
    body = {
        "contents": [{"role": "user", "parts": [{"text": "reply with single word: OK"}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 10},
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        f"?key={api_key}"
    )
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(url, json=body)
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:160]}", ms
        text = ""
        for cand in r.json().get("candidates") or []:
            for p in cand.get("content", {}).get("parts", []):
                text += p.get("text", "")
        return True, text.strip()[:60] or "<empty>", ms


async def ping_groq_chat(model: str) -> Tuple[bool, str, float]:
    api_key = _provider_key("groq")
    if not api_key:
        return False, "no GROQ_API_KEY", 0.0
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
            return False, f"HTTP {r.status_code}: {r.text[:160]}", ms
        choices = r.json().get("choices") or []
        text = choices[0].get("message", {}).get("content", "") if choices else ""
        return True, text.strip()[:60] or "<empty>", ms


async def ping_openrouter(model: str) -> Tuple[bool, str, float]:
    api_key = _provider_key("openrouter")
    if not api_key:
        return False, "no OPENROUTER_API_KEY", 0.0
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "reply with single word: OK"}],
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
            return False, f"HTTP {r.status_code}: {r.text[:160]}", ms
        choices = r.json().get("choices") or []
        text = choices[0].get("message", {}).get("content", "") if choices else ""
        return True, text.strip()[:60] or "<empty>", ms


def _silent_wav(seconds: float = 1.0, rate: int = 16000) -> bytes:
    """Возвращает bytes 1-канального 16-bit PCM WAV с тишиной заданной длительности."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(rate)
        n_samples = int(seconds * rate)
        # тишина = нули
        w.writeframes(struct.pack("<" + "h" * n_samples, *([0] * n_samples)))
    return buf.getvalue()


async def ping_groq_whisper(model: str) -> Tuple[bool, str, float]:
    api_key = _provider_key("groq")
    if not api_key:
        return False, "no GROQ_API_KEY", 0.0
    audio = _silent_wav(seconds=1.0)
    files = {"file": ("ping.wav", audio, "audio/wav")}
    data = {"model": model, "language": "ru", "response_format": "verbose_json"}
    t0 = time.monotonic()
    async with _httpx_client(timeout=90.0) as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
            data=data,
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:160]}", ms
        body = r.json()
        text = (body.get("text") or "").strip()
        # Тишина → text='' нормально, главное что endpoint живой
        return True, f"duration={body.get('duration')}, text={text!r}", ms


# ─────────────────────────────────────────────────────────────
TARGETS: List[Tuple[str, str, str]] = [
    # (label, provider, model)
    ("gemini-flash", "gemini", "gemini-2.0-flash"),
    ("groq-llama70b", "groq", "llama-3.3-70b-versatile"),
    ("groq-llama8b", "groq", "llama-3.1-8b-instant"),
    ("groq-vision90b", "groq", "llama-3.2-90b-vision-preview"),
    ("groq-whisper-turbo", "whisper", "whisper-large-v3-turbo"),
    ("groq-whisper-v3", "whisper", "whisper-large-v3"),
    ("openrouter-gemini-free", "openrouter", "google/gemini-2.0-flash-exp:free"),
    ("openrouter-deepseek-free", "openrouter", "deepseek/deepseek-chat-v3.2:free"),
]


async def main() -> int:
    print("\n" + "=" * 78)
    proxy = getattr(settings, "api_proxy", None)
    print(f"VLESS proxy : {proxy or '<NONE — direct>'}")
    print(f"Keys present:")
    for p in ("gemini", "groq", "openrouter", "anthropic"):
        k = _provider_key(p)
        print(f"  {p:<12} {'YES' if k else 'NO '}  {(k[:8]+'...') if k else ''}")
    print("=" * 78)

    results: List[Dict[str, Any]] = []
    for label, provider, model in TARGETS:
        print(f"\n→ {label} ({provider}/{model})")
        try:
            if provider == "gemini":
                ok, msg, ms = await ping_gemini(model)
            elif provider == "groq":
                ok, msg, ms = await ping_groq_chat(model)
            elif provider == "whisper":
                ok, msg, ms = await ping_groq_whisper(model)
            elif provider == "openrouter":
                ok, msg, ms = await ping_openrouter(model)
            else:
                ok, msg, ms = False, "unknown provider", 0.0
        except Exception as e:
            ok, msg, ms = False, f"{type(e).__name__}: {str(e)[:160]}", 0.0
            traceback.print_exc()

        status = "PASS" if ok else "FAIL"
        print(f"   [{status}] {ms:7.0f}ms  {msg}")
        results.append({"label": label, "ok": ok, "ms": ms, "msg": msg})

    print("\n" + "=" * 78)
    print(f"{'LABEL':<28} {'STATUS':<6} {'LATENCY':>10}  RESPONSE/ERROR")
    print("-" * 78)
    n_pass = 0
    for r in results:
        n_pass += 1 if r["ok"] else 0
        st = "PASS" if r["ok"] else "FAIL"
        print(f"{r['label']:<28} {st:<6} {r['ms']:>8.0f}ms  {r['msg'][:40]}")
    print("=" * 78)
    print(f"TOTAL: {n_pass}/{len(results)} green\n")
    return 0 if n_pass == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
