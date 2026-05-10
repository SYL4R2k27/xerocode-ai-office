"""Финальный пинг: точная ошибка llama-4-scout, актуальная gpt-oss + проверить
наличие у groq/compound vision-возможности."""
from __future__ import annotations

import asyncio
import os
import sys
import time
from typing import Any, Optional, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402


def _httpx_client(timeout: float = 60.0) -> httpx.AsyncClient:
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(proxy=proxy), timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


def _key(p: str) -> Optional[str]:
    return {
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
    }.get(p)


PNG_RED_1X1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


async def groq_vision_detail(model: str, with_image: bool = True):
    """Vision-пинг с полным выводом ошибки."""
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": (
                    [
                        {"type": "text", "text": "what color? one word"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{PNG_RED_1X1}"},
                        },
                    ]
                    if with_image
                    else "reply OK"
                ),
            }
        ],
        "max_tokens": 10,
        "temperature": 0.0,
    }
    api_key = _key("groq")
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        ms = (time.monotonic() - t0) * 1000
        return r.status_code, r.text[:600], ms


async def openrouter_text(model: str):
    api_key = _key("openrouter")
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "reply OK"}],
        "max_tokens": 10,
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
        return r.status_code, r.text[:300], ms


async def main():
    print("=" * 78)
    print("DETAIL: groq llama-4-scout vision-call")
    print("=" * 78)
    code, text, ms = await groq_vision_detail("meta-llama/llama-4-scout-17b-16e-instruct", with_image=True)
    print(f"  WITH image: HTTP {code} in {ms:.0f}ms")
    print(f"  Body: {text}")
    print()
    code, text, ms = await groq_vision_detail("meta-llama/llama-4-scout-17b-16e-instruct", with_image=False)
    print(f"  TEXT-only: HTTP {code} in {ms:.0f}ms")
    print(f"  Body: {text}")

    # gpt-oss text
    print("\n" + "=" * 78)
    print("DETAIL: groq gpt-oss-20b / 120b text")
    print("=" * 78)
    for m in ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3-32b"]:
        code, text, ms = await groq_vision_detail(m, with_image=False)
        print(f"  {m:<35} HTTP {code} {ms:>6.0f}ms  {text[:200]}")

    # OpenRouter text retry
    print("\n" + "=" * 78)
    print("DETAIL: openrouter text retry (after rate-limit)")
    print("=" * 78)
    for m in [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "z-ai/glm-4.5-air:free",
        "minimax/minimax-m2.5:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "openai/gpt-oss-120b:free",
    ]:
        code, text, ms = await openrouter_text(m)
        print(f"  {m:<55} HTTP {code} {ms:>6.0f}ms  {text[:120]}")

    print("\nDONE")


if __name__ == "__main__":
    asyncio.run(main())
