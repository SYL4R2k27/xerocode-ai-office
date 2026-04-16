"""Public demo chat — no auth required.

Landing page hero uses this to let visitors try XeroCode instantly.
IP-based rate limit: 3 messages / IP / hour.
After 5 total messages from same IP → `register_prompt: true` nudge.

Model: Groq Llama-3.3-70B (fast + free tier).
Hard caps: 1000 chars input, 500 tokens output, 30s timeout.
No conversation history stored — each request is stateless.
"""
from __future__ import annotations

import json
import logging
import time
from collections import defaultdict
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings

router = APIRouter(prefix="/demo", tags=["demo"])
logger = logging.getLogger(__name__)

# In-memory rate limit state. Keys: client IP -> list of timestamps.
# Suitable for single-worker deployment; multi-worker should migrate to Redis.
_hits: dict[str, list[float]] = defaultdict(list)
_WINDOW_SEC = 3600          # 1 hour
_MAX_PER_WINDOW = 3         # 3 messages per hour per IP
_REGISTER_THRESHOLD = 5     # lifetime counter for register prompt
_lifetime: dict[str, int] = defaultdict(int)

SYSTEM_PROMPT = (
    "Ты — XeroCode AI, ассистент. Отвечай кратко, по делу, на русском языке. "
    "Не более 300 слов. Не упоминай что ты Llama или Groq — ты XeroCode AI."
)

MAX_INPUT_CHARS = 1000
MAX_OUTPUT_TOKENS = 500


def _client_ip(request: Request) -> str:
    """Extract client IP behind nginx. X-Forwarded-For first, fallback to client.host."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str) -> tuple[bool, int]:
    """Returns (allowed, remaining). Evicts expired timestamps."""
    now = time.time()
    bucket = _hits[ip]
    bucket[:] = [t for t in bucket if now - t < _WINDOW_SEC]
    if len(bucket) >= _MAX_PER_WINDOW:
        return False, 0
    return True, _MAX_PER_WINDOW - len(bucket) - 1


@router.post("/chat")
async def demo_chat(data: dict, request: Request):
    """Public demo chat endpoint. No auth. IP rate-limited.

    Body: {"prompt": "<=1000 chars"}
    Returns SSE stream:
      data: {"type": "meta", "remaining": 2}
      data: {"type": "chunk", "content": "..."}
      data: {"type": "done", "register_prompt": false}
    """
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(400, "Prompt required")
    if len(prompt) > MAX_INPUT_CHARS:
        raise HTTPException(400, f"Prompt too long (max {MAX_INPUT_CHARS} chars)")

    ip = _client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        raise HTTPException(
            429,
            detail={
                "error": "rate_limit",
                "message": "Лимит демо-сообщений исчерпан. Зарегистрируйся, чтобы продолжить.",
                "retry_after": _WINDOW_SEC,
            },
        )

    # Record hit and increment lifetime counter
    _hits[ip].append(time.time())
    _lifetime[ip] += 1
    total = _lifetime[ip]
    register_prompt = total >= _REGISTER_THRESHOLD

    api_key = settings.groq_api_key
    if not api_key:
        raise HTTPException(503, "Demo temporarily unavailable")

    proxy = getattr(settings, "api_proxy", None)
    use_proxy = bool(proxy)

    async def event_stream():
        yield f"data: {json.dumps({'type': 'meta', 'remaining': remaining, 'total': total})}\n\n"
        full = ""
        try:
            transport = httpx.AsyncHTTPTransport(proxy=proxy) if use_proxy else None
            async with httpx.AsyncClient(transport=transport, timeout=30) as client:
                async with client.stream(
                    "POST",
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": MAX_OUTPUT_TOKENS,
                        "temperature": 0.7,
                        "stream": True,
                    },
                ) as resp:
                    if resp.status_code != 200:
                        err_body = (await resp.aread()).decode(errors="ignore")[:300]
                        logger.warning(f"[demo] Groq {resp.status_code}: {err_body}")
                        yield f"data: {json.dumps({'type': 'error', 'message': 'AI провайдер недоступен'})}\n\n"
                        return
                    async for line in resp.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        payload = line[6:].strip()
                        if payload == "[DONE]":
                            break
                        try:
                            obj = json.loads(payload)
                            delta = obj.get("choices", [{}])[0].get("delta", {}).get("content")
                            if delta:
                                full += delta
                                yield f"data: {json.dumps({'type': 'chunk', 'content': delta})}\n\n"
                        except Exception:
                            continue
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Таймаут запроса'})}\n\n"
            return
        except Exception as e:
            logger.exception(f"[demo] stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Внутренняя ошибка'})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done', 'register_prompt': register_prompt, 'chars': len(full)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/status")
async def demo_status(request: Request):
    """Check remaining demo quota for current IP without consuming it."""
    ip = _client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    # _check_rate_limit returns remaining-after-use; for status we want remaining-now
    now = time.time()
    bucket = _hits[ip]
    active = sum(1 for t in bucket if now - t < _WINDOW_SEC)
    remaining_now = max(0, _MAX_PER_WINDOW - active)
    return {
        "remaining": remaining_now,
        "limit": _MAX_PER_WINDOW,
        "window_sec": _WINDOW_SEC,
        "total_lifetime": _lifetime.get(ip, 0),
        "register_prompt": _lifetime.get(ip, 0) >= _REGISTER_THRESHOLD,
    }
