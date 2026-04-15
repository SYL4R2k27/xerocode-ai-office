"""Idempotency-Key middleware for safe retries.

Frontend sends `Idempotency-Key: <uuid>` on POSTs to sensitive endpoints.
Server caches response for 24h — identical retries return cached body.

Storage: Redis (primary) with in-memory LRU fallback when Redis is down.
"""
from __future__ import annotations

import base64
import json
import logging
import time
from collections import OrderedDict
from typing import Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Fallback LRU if Redis unavailable
_cache: OrderedDict[str, tuple[float, bytes, int, dict]] = OrderedDict()
_MAX_ENTRIES = 1000
_TTL_SEC = 24 * 3600
_REDIS_PREFIX = "idem:"

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


async def _redis_get(cache_key: str) -> Optional[tuple[bytes, int, dict]]:
    """Try fetching cached response from Redis. Returns None on miss or Redis failure."""
    try:
        from app.core.redis_client import get_redis
        r = await get_redis()
        if not r:
            return None
        raw = await r.get(_REDIS_PREFIX + cache_key)
        if not raw:
            return None
        data = json.loads(raw)
        body = base64.b64decode(data["body"])
        return body, int(data["status"]), data.get("headers") or {}
    except Exception as e:
        logger.debug(f"[Idempotency] Redis get failed: {e}")
        return None


async def _redis_set(cache_key: str, body: bytes, status: int, headers: dict):
    try:
        from app.core.redis_client import get_redis
        r = await get_redis()
        if not r:
            return
        payload = json.dumps({
            "body": base64.b64encode(body).decode(),
            "status": status,
            "headers": headers,
        })
        await r.setex(_REDIS_PREFIX + cache_key, _TTL_SEC, payload)
    except Exception as e:
        logger.debug(f"[Idempotency] Redis set failed: {e}")


class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not _is_idempotent(request):
            return await call_next(request)

        key = request.headers.get("idempotency-key")
        if not key:
            return await call_next(request)

        auth = request.headers.get("authorization", "")
        cache_key = f"{request.url.path}:{auth[-16:] if auth else 'anon'}:{key}"

        # Check Redis first, then local LRU fallback
        hit = await _redis_get(cache_key)
        if hit is None:
            _evict_expired()
            local = _cache.get(cache_key)
            if local:
                _ts, body, status, headers = local
                hit = (body, status, headers)
        if hit:
            body, status, headers = hit
            resp_headers = dict(headers)
            resp_headers["X-Idempotency-Replay"] = "true"
            return Response(content=body, status_code=status, headers=resp_headers)

        response = await call_next(request)

        ct = response.headers.get("content-type", "")
        if 200 <= response.status_code < 300 and "event-stream" not in ct:
            body_chunks = []
            async for chunk in response.body_iterator:
                body_chunks.append(chunk)
            body = b"".join(body_chunks)
            # Write to both Redis (primary) and local LRU (fallback)
            headers_to_cache = {"content-type": ct}
            await _redis_set(cache_key, body, response.status_code, headers_to_cache)
            _cache[cache_key] = (time.time(), body, response.status_code, headers_to_cache)
            _cache.move_to_end(cache_key)
            while len(_cache) > _MAX_ENTRIES:
                _cache.popitem(last=False)
            return Response(content=body, status_code=response.status_code, headers=dict(response.headers))
        return response
