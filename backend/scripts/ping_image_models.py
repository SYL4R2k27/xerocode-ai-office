"""Ping all image generation providers through proxy.

Usage:
    cd backend && python -m scripts.ping_image_models
    cd backend && python -m scripts.ping_image_models --full  # actually generates 1 image per provider (costs money)

Reports: provider, model, auth OK?, latency, errors — all via SOCKS5 proxy.
"""
from __future__ import annotations

import asyncio
import base64
import os
import sys
import time
import urllib.parse
from pathlib import Path

# Allow running as script from backend/ dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

from app.core.config import settings

# ----------------------------------------------------------------------
# Test prompt + output dir
# ----------------------------------------------------------------------

PROMPT = "a red apple on a clean white background, product photo"
OUT_DIR = Path("/tmp/xerocode_image_ping")
OUT_DIR.mkdir(exist_ok=True)


def _transport():
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncHTTPTransport(proxy=proxy), proxy
    return None, None


# ----------------------------------------------------------------------
# Individual provider pings
# ----------------------------------------------------------------------


async def ping_openai_gpt_image(full: bool) -> dict:
    name = "OpenAI / gpt-image-2"
    if not settings.openai_api_key:
        return {"provider": name, "status": "no_key", "latency_ms": 0}
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            if not full:
                # Auth check: list models
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                )
                ok = resp.status_code == 200
                has_img_model = False
                if ok:
                    ids = [m.get("id", "") for m in resp.json().get("data", [])]
                    has_img_model = any("image" in i or "dall" in i for i in ids)
                return {
                    "provider": name,
                    "status": "ok" if ok else f"http_{resp.status_code}",
                    "latency_ms": int((time.time() - t0) * 1000),
                    "extra": f"image_model_listed={has_img_model}",
                }
            # Full: actually generate
            resp = await client.post(
                "https://api.openai.com/v1/images",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": "gpt-image-2", "prompt": PROMPT, "size": "1024x1024", "n": 1},
            )
            latency = int((time.time() - t0) * 1000)
            if resp.status_code != 200:
                return {"provider": name, "status": f"http_{resp.status_code}", "latency_ms": latency, "error": resp.text[:200]}
            data = resp.json()
            b64 = data["data"][0].get("b64_json")
            if b64:
                (OUT_DIR / "openai_gpt_image_2.png").write_bytes(base64.b64decode(b64))
            else:
                url = data["data"][0].get("url")
                if url:
                    r2 = await client.get(url)
                    (OUT_DIR / "openai_gpt_image_2.png").write_bytes(r2.content)
            return {"provider": name, "status": "ok_generated", "latency_ms": latency}
    except Exception as e:
        return {"provider": name, "status": "error", "latency_ms": int((time.time() - t0) * 1000), "error": str(e)[:200]}


async def ping_stability(full: bool) -> dict:
    name = "Stability / sd3.5-large"
    if not settings.stability_api_key:
        return {"provider": name, "status": "no_key", "latency_ms": 0}
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            if not full:
                resp = await client.get(
                    "https://api.stability.ai/v1/user/account",
                    headers={"Authorization": f"Bearer {settings.stability_api_key}"},
                )
                return {
                    "provider": name,
                    "status": "ok" if resp.status_code == 200 else f"http_{resp.status_code}",
                    "latency_ms": int((time.time() - t0) * 1000),
                    "extra": resp.text[:100] if resp.status_code == 200 else "",
                }
            resp = await client.post(
                "https://api.stability.ai/v2beta/stable-image/generate/sd3",
                headers={
                    "Authorization": f"Bearer {settings.stability_api_key}",
                    "Accept": "image/*",
                },
                files={"prompt": (None, PROMPT), "model": (None, "sd3.5-large"), "output_format": (None, "png")},
            )
            latency = int((time.time() - t0) * 1000)
            if resp.status_code != 200:
                return {"provider": name, "status": f"http_{resp.status_code}", "latency_ms": latency, "error": resp.text[:200]}
            (OUT_DIR / "stability_sd35.png").write_bytes(resp.content)
            return {"provider": name, "status": "ok_generated", "latency_ms": latency}
    except Exception as e:
        return {"provider": name, "status": "error", "latency_ms": int((time.time() - t0) * 1000), "error": str(e)[:200]}


async def ping_together(full: bool) -> dict:
    name = "Together / FLUX.1-schnell-Free"
    if not settings.together_api_key:
        return {"provider": name, "status": "no_key", "latency_ms": 0}
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            if not full:
                resp = await client.get(
                    "https://api.together.xyz/v1/models",
                    headers={"Authorization": f"Bearer {settings.together_api_key}"},
                )
                return {
                    "provider": name,
                    "status": "ok" if resp.status_code == 200 else f"http_{resp.status_code}",
                    "latency_ms": int((time.time() - t0) * 1000),
                }
            resp = await client.post(
                "https://api.together.xyz/v1/images/generations",
                headers={"Authorization": f"Bearer {settings.together_api_key}", "Content-Type": "application/json"},
                json={"model": "black-forest-labs/FLUX.1-schnell-Free", "prompt": PROMPT, "width": 1024, "height": 1024, "steps": 4, "n": 1},
            )
            latency = int((time.time() - t0) * 1000)
            if resp.status_code != 200:
                return {"provider": name, "status": f"http_{resp.status_code}", "latency_ms": latency, "error": resp.text[:200]}
            d = resp.json().get("data", [{}])[0]
            url = d.get("url")
            b64 = d.get("b64_json")
            if b64:
                (OUT_DIR / "together_flux.png").write_bytes(base64.b64decode(b64))
            elif url:
                r2 = await client.get(url)
                (OUT_DIR / "together_flux.png").write_bytes(r2.content)
            return {"provider": name, "status": "ok_generated", "latency_ms": latency}
    except Exception as e:
        return {"provider": name, "status": "error", "latency_ms": int((time.time() - t0) * 1000), "error": str(e)[:200]}


async def ping_openrouter_nano_banana(full: bool) -> dict:
    name = "OpenRouter / gemini-2.5-flash-image"
    if not settings.openrouter_api_key:
        return {"provider": name, "status": "no_key", "latency_ms": 0}
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            resp = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
            )
            latency = int((time.time() - t0) * 1000)
            if resp.status_code != 200:
                return {"provider": name, "status": f"http_{resp.status_code}", "latency_ms": latency, "error": resp.text[:200]}
            models = [m.get("id") for m in resp.json().get("data", [])]
            has = any("gemini-2.5-flash-image" in (m or "") for m in models)
            return {"provider": name, "status": "ok" if has else "model_not_listed", "latency_ms": latency, "extra": f"available={has}"}
    except Exception as e:
        return {"provider": name, "status": "error", "latency_ms": int((time.time() - t0) * 1000), "error": str(e)[:200]}


async def ping_pollinations(full: bool) -> dict:
    name = "Pollinations / FLUX (free)"
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=40) as client:
            encoded = urllib.parse.quote(PROMPT, safe="")
            url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true&seed=1"
            resp = await client.get(url)
            latency = int((time.time() - t0) * 1000)
            if resp.status_code == 200 and len(resp.content) > 2000:
                (OUT_DIR / "pollinations_flux.png").write_bytes(resp.content)
                return {"provider": name, "status": "ok_generated", "latency_ms": latency, "extra": f"{len(resp.content)} bytes"}
            return {"provider": name, "status": f"http_{resp.status_code}", "latency_ms": latency, "extra": f"{len(resp.content)} bytes"}
    except Exception as e:
        return {"provider": name, "status": "error", "latency_ms": int((time.time() - t0) * 1000), "error": str(e)[:200]}


async def ping_anthropic(full: bool) -> dict:
    # Claude cannot generate images — only analyze them.
    return {"provider": "Anthropic / Claude", "status": "not_applicable", "latency_ms": 0, "extra": "Claude does not generate images (vision only)"}


# ----------------------------------------------------------------------
# Runner
# ----------------------------------------------------------------------

async def main():
    full = "--full" in sys.argv

    proxy = getattr(settings, "api_proxy", None)
    print("=" * 70)
    print("🖼️  XeroCode Image Model Ping")
    print("=" * 70)
    print(f"Proxy:     {proxy or '❌ NOT SET (all calls direct — unsafe for GEO-blocked providers)'}")
    print(f"Mode:      {'FULL (real image gen, costs money)' if full else 'LIGHT (auth check only, free)'}")
    print(f"Output:    {OUT_DIR}")
    print("=" * 70)

    pings = [
        ping_openai_gpt_image(full),
        ping_stability(full),
        ping_together(full),
        ping_openrouter_nano_banana(full),
        ping_pollinations(full),
        ping_anthropic(full),
    ]
    results = await asyncio.gather(*pings, return_exceptions=True)

    print()
    print(f"{'Provider':<40} {'Status':<20} {'Latency':<10} Extra")
    print("-" * 110)
    for r in results:
        if isinstance(r, Exception):
            print(f"{'?':<40} {'exception':<20} {'-':<10} {str(r)[:60]}")
            continue
        icon = {
            "ok": "🟢",
            "ok_generated": "🟢",
            "no_key": "⚪",
            "not_applicable": "➖",
            "model_not_listed": "🟡",
        }.get(r["status"], "🔴")
        extra = r.get("extra") or r.get("error", "")
        print(f"{icon} {r['provider']:<38} {r['status']:<20} {str(r['latency_ms'])+'ms':<10} {extra[:50]}")

    print()
    print("Legend: 🟢 ok · 🟡 partial · 🔴 fail · ⚪ no key · ➖ n/a")
    print()

    # Suggestions
    missing = []
    if not getattr(settings, "openai_api_key", None):
        missing.append("openai_api_key")
    if not getattr(settings, "stability_api_key", None):
        missing.append("stability_api_key")
    if not getattr(settings, "together_api_key", None):
        missing.append("together_api_key")
    if not getattr(settings, "openrouter_api_key", None):
        missing.append("openrouter_api_key")
    if missing:
        print("⚠️  Missing keys in .env:", ", ".join(missing))
    if not proxy:
        print("⚠️  api_proxy not set — add to .env: api_proxy=socks5://127.0.0.1:10808")


if __name__ == "__main__":
    asyncio.run(main())
