"""Rate limiter для защиты от brute-force."""
from __future__ import annotations

import time
from collections import defaultdict


class RateLimiter:
    def __init__(self):
        self._attempts: dict[str, list[float]] = defaultdict(list)
        self._blocked: dict[str, float] = {}

    def check(self, key: str, max_attempts: int = 5, window: int = 900, block_duration: int = 900) -> tuple[bool, str]:
        now = time.time()
        if key in self._blocked:
            if now < self._blocked[key]:
                remaining = int(self._blocked[key] - now)
                return False, f"Заблокировано на {remaining} сек"
            del self._blocked[key]

        self._attempts[key] = [t for t in self._attempts[key] if now - t < window]

        if len(self._attempts[key]) >= max_attempts:
            self._blocked[key] = now + block_duration
            return False, f"Превышен лимит попыток. Заблокировано на {block_duration // 60} мин"

        return True, ""

    def record(self, key: str):
        self._attempts[key].append(time.time())

    def reset(self, key: str):
        self._attempts.pop(key, None)
        self._blocked.pop(key, None)


auth_limiter = RateLimiter()
