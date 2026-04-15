"""Idempotency-Key middleware for safe retries.

Frontend sends `Idempotency-Key: <uuid>` on POSTs to sensitive endpoints.
Server caches response for 24h — identical retries return cached body.

Storage: in-memory LRU (1000 entries). TODO: migrate to Redis for multi-worker.
"""
from __future__ import annotations

import json
import time
from collections import OrderedDict
from typing import Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# LRU cache of key → (timestamp, body_bytes, status_code, headers)
_cache: OrderedDict[str, tuple[float, bytes, int, dict]] = OrderedDict()
_MAX_ENTRIES = 1000
_TTL_SEC = 24 * 3600

# Endpoints where idempotency applies (POST only)
IDEMPOTENT_PATHS = (
    "/api/modes/run",
    "/api/orchestration",
    "/api/payments",
    "/api/byok/keys",
    "/api/push/subscribe",
)


def _is_idempotent(request: Request) -> bool:
    if request.method != "POST":
        return False
    path = request.url.path
    return any(path.startswith(p) for p in IDEMPOTENT_PATHS)


def _evict_expired():
    now = time.time()
    keys_to_remove = [k for k, (ts, *_) in _cache.items() if now - ts > _TTL_SEC]
    for k in keys_to_remove:
        _cache.pop(k, None)


class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not _is_idempotent(request):
            return await call_next(request)

        key = request.headers.get("idempotency-key")
        if not key:
            return await call_next(request)  # optional — без ключа просто пропускаем

        # Cache key scoped by path + user (if auth header present) to avoid cross-user collisions
        auth = request.headers.get("authorization", "")
        cache_key = f"{request.url.path}:{auth[-16:] if auth else 'anon'}:{key}"

        _evict_expired()
        cached = _cache.get(cache_key)
        if cached:
            _ts, body, status, headers = cached
            resp_headers = dict(headers)
            resp_headers["X-Idempotency-Replay"] = "true"
            return Response(content=body, status_code=status, headers=resp_headers)

        response = await call_next(request)

        # Cache only successful responses (2xx). SSE streams aren't cached (content-type starts with text/event-stream)
        ct = response.headers.get("content-type", "")
        if 200 <= response.status_code < 300 and "event-stream" not in ct:
            body_chunks = []
            async for chunk in response.body_iterator:
                body_chunks.append(chunk)
            body = b"".join(body_chunks)
            _cache[cache_key] = (
                time.time(),
                body,
                response.status_code,
                {"content-type": ct},
            )
            _cache.move_to_end(cache_key)
            while len(_cache) > _MAX_ENTRIES:
                _cache.popitem(last=False)
            return Response(content=body, status_code=response.status_code, headers=dict(response.headers))
        return response
