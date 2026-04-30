"""Ping apiyi.com — list models, check balance, test key models.

Usage (on prod):
    cd ~/ai-office/backend && .venv/bin/python -m scripts.ping_apiyi
    cd ~/ai-office/backend && .venv/bin/python -m scripts.ping_apiyi --probe   # test text + image gen
"""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

from app.core.config import settings


BASE_URL = "https://api.apiyi.com/v1"
KEY_MODELS_TO_PROBE = [
    # ── OpenAI ─────────────────
    ("gpt-5.4",                       "text"),
    ("gpt-5.4-mini",                  "text"),
    ("gpt-5.2",                       "text"),
    ("gpt-5.2-chat-latest",           "text"),
    ("gpt-5.1",                       "text"),
    ("gpt-5",                         "text"),
    ("gpt-5-mini",                    "text"),
    ("gpt-5-chat-latest",             "text"),
    ("gpt-4.1",                       "text"),
    ("gpt-4.1-mini",                  "text"),
    ("gpt-4o",                        "text"),
    ("gpt-4o-mini",                   "text"),
    # ── Claude ─────────────────
    ("claude-opus-4-6",               "text"),
    ("claude-sonnet-4-6",             "text"),
    ("claude-sonnet-4-5-20250929",    "text"),
    ("claude-haiku-4-5-20251001",     "text"),
    # ── Gemini ─────────────────
    ("gemini-2.5-pro",                "text"),
    ("gemini-2.5-flash",              "text"),
    ("gemini-3.1-pro-preview",        "text"),
    ("gemini-3.1-flash-lite-preview", "text"),
    # ── Grok ───────────────────
    ("grok-4-1-fast-reasoning",       "text"),
    ("grok-4-1-fast-non-reasoning",   "text"),
    # ── China ──────────────────
    ("deepseek-v3.2",                 "text"),
    ("glm-5",                         "text"),
    ("kimi-k2.5",                     "text"),
    ("qwen3.5-plus",                  "text"),
    # ── Image ──────────────────
    ("gpt-image-2",                   "image"),
    ("nano-banana",                   "image"),
    ("nano-banana-2",                 "image"),
    ("nano-banana-pro",               "image"),
    ("flux-2-pro",                    "image"),
    ("flux-2-max",                    "image"),
    ("flux-kontext-pro",              "image"),
]


def _transport():
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncHTTPTransport(proxy=proxy), proxy
    return None, None


async def fetch_balance(client, key):
    """Try common balance endpoints."""
    for path in ["/dashboard/billing/credit_grants", "/billing/usage", "/credits", "/dashboard/billing/subscription"]:
        try:
            r = await client.get(BASE_URL + path, headers={"Authorization": f"Bearer {key}"}, timeout=15)
            if r.status_code == 200:
                return path, r.json()
        except Exception:
            continue
    return None, None


async def list_models(client, key):
    r = await client.get(BASE_URL + "/models", headers={"Authorization": f"Bearer {key}"}, timeout=30)
    if r.status_code != 200:
        return None, f"http_{r.status_code}: {r.text[:200]}"
    data = r.json()
    return data.get("data", []), None


async def probe_text(client, key, model):
    t0 = time.time()
    try:
        r = await client.post(
            BASE_URL + "/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": "Say 'ok' in one word."}],
                "max_tokens": 10,
            },
            timeout=45,
        )
        latency = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            j = r.json()
            content = (j.get("choices") or [{}])[0].get("message", {}).get("content", "")
            usage = j.get("usage", {})
            return "ok", latency, f"{content[:30]} | tok in/out: {usage.get('prompt_tokens','?')}/{usage.get('completion_tokens','?')}"
        return f"http_{r.status_code}", latency, r.text[:200]
    except Exception as e:
        return "error", int((time.time() - t0) * 1000), str(e)[:200]


async def probe_image(client, key, model):
    t0 = time.time()
    try:
        r = await client.post(
            BASE_URL + "/images/generations",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": model, "prompt": "a red apple, white background", "size": "512x512", "n": 1},
            timeout=90,
        )
        latency = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            j = r.json()
            d = (j.get("data") or [{}])[0]
            has = bool(d.get("url") or d.get("b64_json"))
            return ("ok" if has else "ok_no_data"), latency, ("url" if d.get("url") else "b64") if has else "empty"
        return f"http_{r.status_code}", latency, r.text[:200]
    except Exception as e:
        return "error", int((time.time() - t0) * 1000), str(e)[:200]


async def main():
    probe = "--probe" in sys.argv
    key = getattr(settings, "apiyi_api_key", None)
    transport, proxy = _transport()

    print("=" * 72)
    print("🔑 APIYI PING")
    print("=" * 72)
    print(f"Endpoint: {BASE_URL}")
    print(f"Proxy:    {proxy or '❌ NOT SET'}")
    print(f"Key:      {'✅ set ('+ key[:8] +'…)' if key else '❌ NOT SET'}")
    print(f"Mode:     {'PROBE (text + image gen)' if probe else 'LIST (models + balance only)'}")
    print("=" * 72)
    if not key:
        print("\nNo apiyi_api_key in .env — abort.")
        return

    async with httpx.AsyncClient(transport=transport, timeout=60) as client:
        # ── balance ────────────────────────────────────────────────────
        print("\n[1/3] Balance / credits")
        path, bal = await fetch_balance(client, key)
        if bal:
            print(f"  ✓ {path}")
            print(f"  → {str(bal)[:300]}")
        else:
            print("  (нет стандартного balance endpoint — apiyi может его не отдавать)")

        # ── models list ────────────────────────────────────────────────
        print("\n[2/3] Available models")
        models, err = await list_models(client, key)
        if err:
            print(f"  ✗ {err}")
            return
        print(f"  ✓ Total: {len(models)} models")
        # group by family
        families = {}
        for m in models:
            mid = m.get("id", "")
            fam = mid.split("-")[0] if "-" in mid else mid
            families.setdefault(fam, []).append(mid)
        # print top families
        for fam in sorted(families.keys()):
            ids = families[fam]
            print(f"  ── {fam} ({len(ids)})")
            for mid in sorted(ids)[:8]:
                print(f"     · {mid}")
            if len(ids) > 8:
                print(f"     · …+{len(ids)-8} more")

        # full list dump
        print("\n  ── FULL LIST ──")
        for m in sorted(models, key=lambda x: x.get("id", "")):
            print(f"     {m.get('id')}")

        # ── probe key models ───────────────────────────────────────────
        if probe:
            print("\n[3/3] Probe key models")
            avail_ids = {m.get("id") for m in models}
            for model_id, kind in KEY_MODELS_TO_PROBE:
                if model_id not in avail_ids:
                    print(f"  ⚪ {model_id:<30} not in catalog — skip")
                    continue
                if kind == "text":
                    status, ms, info = await probe_text(client, key, model_id)
                else:
                    status, ms, info = await probe_image(client, key, model_id)
                icon = "🟢" if status.startswith("ok") else "🔴"
                print(f"  {icon} {model_id:<30} {status:<10} {ms}ms · {info[:60]}")
        else:
            print("\n[3/3] Probe skipped (use --probe)")

    print("\n" + "=" * 72)


if __name__ == "__main__":
    asyncio.run(main())
