"""Redis client — cache, rate limiting, session store."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

_redis = None


async def get_redis():
    """Get or create Redis connection."""
    global _redis
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            from app.core.config import settings
            _redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=3,
            )
            await _redis.ping()
            logger.info("[Redis] Connected")
        except Exception as e:
            logger.warning(f"[Redis] Not available: {e}. Running without cache.")
            _redis = None
    return _redis


async def cache_get(key: str) -> Optional[Any]:
    """Get cached value. Returns None if Redis unavailable or key missing."""
    r = await get_redis()
    if not r:
        return None
    try:
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = 30):
    """Set cache value with TTL (seconds)."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_delete(key: str):
    """Delete cached key."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(key)
    except Exception:
        pass


async def rate_limit_check(key: str, max_requests: int, window_seconds: int) -> bool:
    """Check rate limit. Returns True if allowed, False if rate limited."""
    r = await get_redis()
    if not r:
        return True  # Allow if Redis unavailable

    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        current = results[0]
        return current <= max_requests
    except Exception:
        return True


async def check_login_rate(ip: str) -> bool:
    """Rate limit login attempts: 5 per minute per IP."""
    return await rate_limit_check(f"login:{ip}", max_requests=5, window_seconds=60)


async def check_api_rate(user_id: str, endpoint: str) -> bool:
    """Rate limit API calls: 60 per minute per user per endpoint."""
    return await rate_limit_check(f"api:{user_id}:{endpoint}", max_requests=60, window_seconds=60)


async def check_ai_rate(user_id: str) -> bool:
    """Rate limit AI calls: 10 per minute per user."""
    return await rate_limit_check(f"ai:{user_id}", max_requests=10, window_seconds=60)


async def check_research_rate(user_id: str) -> bool:
    """Rate limit Deep Research: 3 per hour per user."""
    return await rate_limit_check(f"research:{user_id}", max_requests=3, window_seconds=3600)
