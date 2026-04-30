"""Deep probe of OpenAI direct key for image generation.

Checks:
  1. List models — what image models are in the catalog
  2. Try multiple endpoints (/v1/images, /v1/images/generations)
  3. Try multiple model IDs (gpt-image-2, gpt-image-1, dall-e-3)
  4. Get billing/quota info
"""
from __future__ import annotations

import asyncio
import base64
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

from app.core.config import settings


def _transport():
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncHTTPTransport(proxy=proxy), proxy
    return None, None


KEY = settings.openai_api_key
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"} if KEY else {}
PROMPT = "a red apple on white background"
OUT = Path("/tmp/openai_image_test")
OUT.mkdir(exist_ok=True)


async def list_models(client):
    """Get full models list from OpenAI."""
    print("\n[1] List all models")
    print("-" * 70)
    t0 = time.time()
    r = await client.get("https://api.openai.com/v1/models", headers=HEADERS, timeout=30)
    ms = int((time.time() - t0) * 1000)
    if r.status_code != 200:
        print(f"  ❌ HTTP {r.status_code} ({ms}ms): {r.text[:200]}")
        return []
    data = r.json().get("data", [])
    print(f"  ✓ {len(data)} models total ({ms}ms)")
    # Filter image-related
    img_models = [m for m in data if any(k in m.get("id", "") for k in ["image", "dall", "vision"])]
    print(f"\n  Image-related models found:")
    for m in sorted(img_models, key=lambda x: x.get("id", "")):
        print(f"    · {m.get('id'):<40}  owned_by: {m.get('owned_by','?')}")
    if not img_models:
        print("    (no image models in catalog — strange)")
    return data


async def try_endpoint(client, url: str, body: dict, label: str):
    """Try a specific endpoint+body combo."""
    t0 = time.time()
    try:
        r = await client.post(url, headers=HEADERS, json=body, timeout=120)
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            j = r.json()
            d = (j.get("data") or [{}])[0]
            url_or_b64 = "url" if d.get("url") else ("b64" if d.get("b64_json") else "empty")
            # save image
            if d.get("b64_json"):
                fname = label.replace(" ", "_").replace("/", "_") + ".png"
                (OUT / fname).write_bytes(base64.b64decode(d["b64_json"]))
            elif d.get("url"):
                ir = await client.get(d["url"], timeout=60)
                if ir.status_code == 200:
                    fname = label.replace(" ", "_").replace("/", "_") + ".png"
                    (OUT / fname).write_bytes(ir.content)
            print(f"  🟢 {label:<55} {ms}ms  → {url_or_b64}")
            return True
        else:
            err = r.text[:300]
            print(f"  🔴 {label:<55} {ms}ms  HTTP {r.status_code}")
            try:
                err_json = r.json()
                msg = err_json.get("error", {}).get("message", "")[:200]
                code = err_json.get("error", {}).get("code", "")
                print(f"     → {msg}  [{code}]")
            except Exception:
                print(f"     → {err[:200]}")
            return False
    except Exception as e:
        print(f"  💥 {label:<55} {int((time.time()-t0)*1000)}ms  {str(e)[:150]}")
        return False


async def main():
    transport, proxy = _transport()
    print("=" * 78)
    print("🎨 OPENAI IMAGE — DEEP PROBE")
    print("=" * 78)
    print(f"Proxy:    {proxy or '❌ NOT SET'}")
    print(f"Key:      {'✅ ' + KEY[:8] + '…' if KEY else '❌ NOT SET'}")
    print(f"Output:   {OUT}/")
    print("=" * 78)

    if not KEY:
        return

    async with httpx.AsyncClient(transport=transport, timeout=120) as client:
        # 1. List models
        models = await list_models(client)
        ids = {m.get("id") for m in models}

        # 2. Try image endpoints
        print("\n[2] Endpoint probes")
        print("-" * 70)

        # /v1/images/generations (legacy DALL-E)
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images/generations",
            {"model": "dall-e-3", "prompt": PROMPT, "size": "1024x1024", "n": 1},
            "/v1/images/generations · dall-e-3",
        )
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images/generations",
            {"model": "dall-e-2", "prompt": PROMPT, "size": "512x512", "n": 1},
            "/v1/images/generations · dall-e-2",
        )

        # gpt-image-1 (current production model)
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images/generations",
            {"model": "gpt-image-1", "prompt": PROMPT, "size": "1024x1024", "n": 1},
            "/v1/images/generations · gpt-image-1",
        )

        # gpt-image-1.5 (rumored)
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images/generations",
            {"model": "gpt-image-1.5", "prompt": PROMPT, "size": "1024x1024", "n": 1},
            "/v1/images/generations · gpt-image-1.5",
        )

        # gpt-image-2
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images/generations",
            {"model": "gpt-image-2", "prompt": PROMPT, "size": "1024x1024", "n": 1},
            "/v1/images/generations · gpt-image-2",
        )

        # New /v1/images endpoint (per user spec earlier)
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images",
            {"model": "gpt-image-2", "prompt": PROMPT, "size": "1024x1024"},
            "/v1/images · gpt-image-2",
        )
        await try_endpoint(
            client,
            "https://api.openai.com/v1/images",
            {"model": "gpt-image-1", "prompt": PROMPT, "size": "1024x1024"},
            "/v1/images · gpt-image-1",
        )

        # 3. Also try /v1/images/responses (newest format)
        await try_endpoint(
            client,
            "https://api.openai.com/v1/responses",
            {"model": "gpt-image-2", "input": [{"role": "user", "content": PROMPT}]},
            "/v1/responses · gpt-image-2",
        )

        # 4. Quota info
        print("\n[3] Subscription info")
        print("-" * 70)
        for path in ["/v1/dashboard/billing/credit_grants", "/v1/dashboard/billing/subscription"]:
            try:
                r = await client.get(f"https://api.openai.com{path}", headers=HEADERS, timeout=15)
                if r.status_code == 200:
                    print(f"  ✓ {path}")
                    print(f"    → {json.dumps(r.json(), indent=2)[:400]}")
                else:
                    print(f"  ⚠️ {path}: HTTP {r.status_code}")
            except Exception as e:
                print(f"  💥 {path}: {e}")

    print("\n" + "=" * 78)
    print(f"DONE. Saved images to: {OUT}/")


if __name__ == "__main__":
    asyncio.run(main())
