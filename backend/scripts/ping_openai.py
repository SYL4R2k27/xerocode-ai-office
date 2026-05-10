"""Smoke-ping OpenAI: text / vision / whisper / models-list."""
from __future__ import annotations

import asyncio
import io
import os
import struct
import sys
import time
import wave
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


PNG_RED_1X1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


def _silent_wav(seconds: float = 1.0, rate: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        n = int(seconds * rate)
        w.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


async def list_openai_models(api_key: str):
    async with _httpx_client() as c:
        r = await c.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}: {r.text[:200]}"
        return r.json().get("data", []), None


async def openai_chat(api_key: str, model: str, with_image: bool = False):
    if with_image:
        content = [
            {"type": "text", "text": "what color? one word"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{PNG_RED_1X1}"}},
        ]
    else:
        content = "reply OK"
    body = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": 10,
    }
    # gpt-5.x не поддерживает temperature=0; убираем
    t0 = time.monotonic()
    async with _httpx_client() as c:
        r = await c.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=body,
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            # retry с max_completion_tokens вместо max_tokens (новый OpenAI API)
            body2 = dict(body)
            body2.pop("max_tokens")
            body2["max_completion_tokens"] = 10
            t0b = time.monotonic()
            async with _httpx_client() as c2:
                r2 = await c2.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=body2,
                )
                ms2 = (time.monotonic() - t0b) * 1000
                if r2.status_code == 200:
                    text = r2.json()["choices"][0]["message"].get("content", "") or ""
                    return True, f"(via max_completion_tokens) {text.strip()[:60]}", ms2
                return False, f"HTTP {r.status_code}: {r.text[:200]}", ms
        text = r.json()["choices"][0]["message"].get("content", "") or ""
        return True, text.strip()[:60] or "<empty>", ms


async def openai_whisper(api_key: str, model: str = "whisper-1"):
    audio = _silent_wav(seconds=1.0)
    files = {"file": ("ping.wav", audio, "audio/wav")}
    data = {"model": model, "language": "ru", "response_format": "verbose_json"}
    t0 = time.monotonic()
    async with _httpx_client(timeout=90.0) as c:
        r = await c.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
            data=data,
        )
        ms = (time.monotonic() - t0) * 1000
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}: {r.text[:200]}", ms
        body = r.json()
        return True, f"duration={body.get('duration')}, text={body.get('text','').strip()!r}", ms


async def main():
    api_key = getattr(settings, "openai_api_key", None)
    if not api_key:
        print("NO openai_api_key in settings"); return

    print("=" * 78)
    print(f"OpenAI key: {api_key[:8]}...")
    print(f"VLESS proxy: {settings.api_proxy}")
    print("=" * 78)

    print("\n→ /v1/models (filter to chat/vision/audio)")
    models, err = await list_openai_models(api_key)
    if err:
        print(f"   ERROR: {err}")
        return
    print(f"   total = {len(models)}")
    interesting = []
    for m in models:
        mid = m.get("id", "")
        if any(s in mid for s in ["gpt-4o", "gpt-4.1", "gpt-5", "o1", "o3", "o4", "whisper", "gpt-3.5"]):
            interesting.append(mid)
    for mid in sorted(interesting):
        print(f"   {mid}")

    print("\n" + "=" * 78)
    print("PING text models (cheap)")
    print("=" * 78)
    text_targets = [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        "gpt-5-mini",
        "gpt-5-nano",
    ]
    for m in text_targets:
        if m not in [x.get("id") for x in models]:
            print(f"   SKIP {m:<20} not in account access")
            continue
        ok, msg, ms = await openai_chat(api_key, m, with_image=False)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<20} {msg[:80]}")

    print("\n" + "=" * 78)
    print("PING vision models (1×1 PNG)")
    print("=" * 78)
    vision_targets = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-5-mini", "gpt-5-nano"]
    for m in vision_targets:
        if m not in [x.get("id") for x in models]:
            print(f"   SKIP {m:<20}")
            continue
        ok, msg, ms = await openai_chat(api_key, m, with_image=True)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<20} {msg[:80]}")

    print("\n" + "=" * 78)
    print("PING whisper")
    print("=" * 78)
    for m in ["whisper-1"]:
        if m not in [x.get("id") for x in models]:
            print(f"   SKIP {m}")
            continue
        ok, msg, ms = await openai_whisper(api_key, m)
        print(f"   {'PASS' if ok else 'FAIL':<4} {ms:>6.0f}ms  {m:<20} {msg[:80]}")

    print("\nDONE")


if __name__ == "__main__":
    asyncio.run(main())
