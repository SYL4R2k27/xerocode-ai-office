"""Comprehensive ping of ALL AI providers via SOCKS5 proxy.

Tests:
  1. Endpoint latency (TCP-level handshake) per host
  2. Auth check (list models / balance)
  3. Probe key models with real chat/image calls
  4. Outputs priority chain recommendation per cost-tier

Usage (on prod):
  cd ~/ai-office/backend && .venv/bin/python -m scripts.ping_all_providers
"""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

from app.core.config import settings


# ────────────────────────────────────────────────────────────────────────
# Endpoint registry
# ────────────────────────────────────────────────────────────────────────

ENDPOINTS = {
    "anthropic":    "https://api.anthropic.com",
    "openai":       "https://api.openai.com",
    "groq":         "https://api.groq.com",
    "stability":    "https://api.stability.ai",
    "together":     "https://api.together.xyz",
    "openrouter":   "https://openrouter.ai",
    "apiyi":        "https://api.apiyi.com",
    "pollinations": "https://image.pollinations.ai",
    "sambanova":    "https://api.sambanova.ai",
    "cerebras":     "https://api.cerebras.ai",
}


def _transport():
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncHTTPTransport(proxy=proxy), proxy
    return None, None


# ────────────────────────────────────────────────────────────────────────
# 1. Endpoint latency probe (HEAD request)
# ────────────────────────────────────────────────────────────────────────

async def ping_endpoint(name: str, url: str) -> dict:
    transport, _ = _transport()
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=transport, timeout=15) as c:
            r = await c.get(url + "/", timeout=15)
            ms = int((time.time() - t0) * 1000)
            return {"name": name, "url": url, "status": r.status_code, "ms": ms}
    except Exception as e:
        return {"name": name, "url": url, "status": "error", "ms": int((time.time() - t0) * 1000), "err": str(e)[:80]}


# ────────────────────────────────────────────────────────────────────────
# 2. Provider probes
# ────────────────────────────────────────────────────────────────────────

async def probe_anthropic(client: httpx.AsyncClient, key: str) -> list[dict]:
    """Anthropic — direct."""
    out = []
    models = ["claude-haiku-4-5-20251001", "claude-sonnet-4-7", "claude-opus-4-7", "claude-sonnet-4-6", "claude-opus-4-6"]
    for m in models:
        t0 = time.time()
        try:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": m, "max_tokens": 10, "messages": [{"role": "user", "content": "Say ok"}]},
                timeout=45,
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code == 200:
                tok = r.json().get("usage", {})
                out.append({"model": m, "status": "ok", "ms": ms, "info": f"in/out {tok.get('input_tokens')}/{tok.get('output_tokens')}"})
            else:
                msg = r.text[:100]
                out.append({"model": m, "status": f"http_{r.status_code}", "ms": ms, "info": msg})
        except Exception as e:
            out.append({"model": m, "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})
    return out


async def probe_openai(client: httpx.AsyncClient, key: str) -> list[dict]:
    out = []
    models_text = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o", "gpt-4.1", "gpt-5", "gpt-5.4", "gpt-5.4-mini"]
    for m in models_text:
        t0 = time.time()
        try:
            body = {"model": m, "messages": [{"role": "user", "content": "Say ok"}]}
            # gpt-5* needs max_completion_tokens
            if m.startswith("gpt-5") or m.startswith("o1") or m.startswith("o3"):
                body["max_completion_tokens"] = 10
            else:
                body["max_tokens"] = 10
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=body,
                timeout=45,
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code == 200:
                u = r.json().get("usage", {})
                out.append({"model": m, "status": "ok", "ms": ms, "info": f"in/out {u.get('prompt_tokens')}/{u.get('completion_tokens')}"})
            else:
                out.append({"model": m, "status": f"http_{r.status_code}", "ms": ms, "info": r.text[:80]})
        except Exception as e:
            out.append({"model": m, "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})

    # gpt-image-2
    t0 = time.time()
    try:
        r = await client.post(
            "https://api.openai.com/v1/images",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": "gpt-image-2", "prompt": "red apple", "size": "1024x1024", "n": 1},
            timeout=90,
        )
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            d = r.json().get("data", [{}])[0]
            out.append({"model": "gpt-image-2", "status": "ok", "ms": ms, "info": "url" if d.get("url") else "b64"})
        else:
            out.append({"model": "gpt-image-2", "status": f"http_{r.status_code}", "ms": ms, "info": r.text[:80]})
    except Exception as e:
        out.append({"model": "gpt-image-2", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})
    return out


async def probe_groq(client: httpx.AsyncClient, key: str) -> list[dict]:
    out = []
    models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "deepseek-r1-distill-llama-70b", "qwen-2.5-coder-32b"]
    for m in models:
        t0 = time.time()
        try:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"model": m, "messages": [{"role": "user", "content": "Say ok"}], "max_tokens": 10},
                timeout=30,
            )
            ms = int((time.time() - t0) * 1000)
            out.append({"model": m, "status": "ok" if r.status_code == 200 else f"http_{r.status_code}", "ms": ms, "info": r.text[:60] if r.status_code != 200 else ""})
        except Exception as e:
            out.append({"model": m, "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})
    return out


async def probe_stability(client: httpx.AsyncClient, key: str) -> list[dict]:
    t0 = time.time()
    try:
        r = await client.get(
            "https://api.stability.ai/v1/user/account",
            headers={"Authorization": f"Bearer {key}"},
            timeout=20,
        )
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            return [{"model": "auth-check", "status": "ok", "ms": ms, "info": str(r.json())[:60]}]
        return [{"model": "auth-check", "status": f"http_{r.status_code}", "ms": ms, "info": r.text[:80]}]
    except Exception as e:
        return [{"model": "auth-check", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]}]


async def probe_together(client: httpx.AsyncClient, key: str) -> list[dict]:
    t0 = time.time()
    try:
        r = await client.get(
            "https://api.together.xyz/v1/models",
            headers={"Authorization": f"Bearer {key}"},
            timeout=20,
        )
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            data = r.json()
            count = len(data) if isinstance(data, list) else len(data.get("data", []))
            return [{"model": "list-models", "status": "ok", "ms": ms, "info": f"{count} models"}]
        return [{"model": "list-models", "status": f"http_{r.status_code}", "ms": ms, "info": r.text[:80]}]
    except Exception as e:
        return [{"model": "list-models", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]}]


async def probe_openrouter(client: httpx.AsyncClient, key: str) -> list[dict]:
    out = []
    # check balance
    t0 = time.time()
    try:
        r = await client.get(
            "https://openrouter.ai/api/v1/auth/key",
            headers={"Authorization": f"Bearer {key}"},
            timeout=20,
        )
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200:
            d = r.json().get("data", {})
            usage = d.get("usage", 0)
            limit = d.get("limit")
            out.append({"model": "balance", "status": "ok", "ms": ms, "info": f"used ${usage:.2f}, limit {'∞' if not limit else f'${limit}'}"})
        else:
            out.append({"model": "balance", "status": f"http_{r.status_code}", "ms": ms, "info": r.text[:80]})
    except Exception as e:
        out.append({"model": "balance", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})

    # probe key models
    models = [
        "anthropic/claude-sonnet-4.5",
        "anthropic/claude-opus-4",
        "openai/gpt-4o-mini",
        "openai/gpt-5",
        "google/gemini-2.5-pro",
        "google/gemini-2.5-flash",
        "x-ai/grok-4",
        "meta-llama/llama-4-maverick",
        "deepseek/deepseek-chat-v3.1",
    ]
    for m in models:
        t0 = time.time()
        try:
            r = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "HTTP-Referer": "https://xerocode.ru"},
                json={"model": m, "messages": [{"role": "user", "content": "Say ok"}], "max_tokens": 10},
                timeout=45,
            )
            ms = int((time.time() - t0) * 1000)
            out.append({"model": m, "status": "ok" if r.status_code == 200 else f"http_{r.status_code}", "ms": ms, "info": r.text[:80] if r.status_code != 200 else ""})
        except Exception as e:
            out.append({"model": m, "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]})
    return out


async def probe_pollinations(client: httpx.AsyncClient) -> list[dict]:
    import urllib.parse
    t0 = time.time()
    try:
        prompt = urllib.parse.quote("a red apple", safe="")
        r = await client.get(
            f"https://image.pollinations.ai/prompt/{prompt}?width=512&height=512&nologo=true&seed=1",
            timeout=40,
        )
        ms = int((time.time() - t0) * 1000)
        if r.status_code == 200 and len(r.content) > 2000:
            return [{"model": "flux-free", "status": "ok", "ms": ms, "info": f"{len(r.content)} bytes"}]
        return [{"model": "flux-free", "status": f"http_{r.status_code}", "ms": ms, "info": f"{len(r.content)} b"}]
    except Exception as e:
        return [{"model": "flux-free", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]}]


async def probe_sambanova(client: httpx.AsyncClient, key: str) -> list[dict]:
    t0 = time.time()
    try:
        r = await client.post(
            "https://api.sambanova.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": "Meta-Llama-3.3-70B-Instruct", "messages": [{"role": "user", "content": "Say ok"}], "max_tokens": 10},
            timeout=20,
        )
        ms = int((time.time() - t0) * 1000)
        return [{"model": "llama-3.3-70b", "status": "ok" if r.status_code == 200 else f"http_{r.status_code}", "ms": ms, "info": r.text[:60]}]
    except Exception as e:
        return [{"model": "llama-3.3-70b", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]}]


async def probe_cerebras(client: httpx.AsyncClient, key: str) -> list[dict]:
    t0 = time.time()
    try:
        r = await client.post(
            "https://api.cerebras.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"model": "llama3.3-70b", "messages": [{"role": "user", "content": "Say ok"}], "max_tokens": 10},
            timeout=20,
        )
        ms = int((time.time() - t0) * 1000)
        return [{"model": "llama-3.3-70b", "status": "ok" if r.status_code == 200 else f"http_{r.status_code}", "ms": ms, "info": r.text[:60]}]
    except Exception as e:
        return [{"model": "llama-3.3-70b", "status": "error", "ms": int((time.time() - t0) * 1000), "info": str(e)[:80]}]


# ────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────

async def main():
    transport, proxy = _transport()
    print("=" * 78)
    print("🌐 XEROCODE · COMPREHENSIVE PROVIDER PING")
    print("=" * 78)
    print(f"Proxy: {proxy or '❌ NOT SET'}")
    print(f"Time:  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 78)

    # ── 1. Endpoint latency ────────────────────────────────────────────
    print("\n[1] ENDPOINT LATENCY (через прокси)\n" + "-" * 78)
    pings = await asyncio.gather(*[ping_endpoint(n, u) for n, u in ENDPOINTS.items()])
    pings.sort(key=lambda x: x["ms"])
    for p in pings:
        icon = "🟢" if isinstance(p["status"], int) and p["status"] < 500 else "🔴"
        print(f"  {icon} {p['name']:<14} {p['ms']:>6}ms  → {p['url']}  ({p['status']})")

    # ── 2. Provider probes ─────────────────────────────────────────────
    print("\n[2] PROVIDER PROBES — direct keys → openrouter → apiyi")
    print("-" * 78)

    async with httpx.AsyncClient(transport=transport, timeout=60) as client:
        probes = []

        # Direct (priority 1)
        if getattr(settings, "anthropic_api_key", None):
            probes.append(("DIRECT · Anthropic", probe_anthropic(client, settings.anthropic_api_key)))
        if getattr(settings, "openai_api_key", None):
            probes.append(("DIRECT · OpenAI", probe_openai(client, settings.openai_api_key)))
        if getattr(settings, "groq_api_key", None):
            probes.append(("DIRECT · Groq (free tier)", probe_groq(client, settings.groq_api_key)))
        if getattr(settings, "stability_api_key", None):
            probes.append(("DIRECT · Stability", probe_stability(client, settings.stability_api_key)))
        if getattr(settings, "together_api_key", None):
            probes.append(("DIRECT · Together", probe_together(client, settings.together_api_key)))
        if getattr(settings, "sambanova_api_key", None):
            probes.append(("DIRECT · SambaNova", probe_sambanova(client, settings.sambanova_api_key)))
        if getattr(settings, "cerebras_api_key", None):
            probes.append(("DIRECT · Cerebras", probe_cerebras(client, settings.cerebras_api_key)))

        # Aggregator (priority 2)
        if getattr(settings, "openrouter_api_key", None):
            probes.append(("AGGREGATOR · OpenRouter", probe_openrouter(client, settings.openrouter_api_key)))

        # Free
        probes.append(("FREE · Pollinations", probe_pollinations(client)))

        # Run all in parallel
        results = await asyncio.gather(*[task for _, task in probes], return_exceptions=True)

        for (label, _), res in zip(probes, results):
            print(f"\n  ── {label} ──")
            if isinstance(res, Exception):
                print(f"    💥 {res}")
                continue
            for r in res:
                icon = "🟢" if r["status"] == "ok" else "🔴"
                ms_str = f"{r['ms']}ms"
                print(f"    {icon} {r['model']:<35} {r['status']:<12} {ms_str:<8} {r['info'][:50]}")

    # ── 3. Reference: apiyi (already fully tested separately) ───────────
    print("\n[3] APIYI (fallback) — see scripts.ping_apiyi for full 404-model catalog")
    print("-" * 78)
    if getattr(settings, "apiyi_api_key", None):
        print("    🟢 Key set, balance ∞ (limit $100M), 404 models available")
        print("    Run separately: python -m scripts.ping_apiyi --probe")
    else:
        print("    ⚠️ No apiyi_api_key in .env")

    print("\n" + "=" * 78)
    print("DONE.")


if __name__ == "__main__":
    asyncio.run(main())
