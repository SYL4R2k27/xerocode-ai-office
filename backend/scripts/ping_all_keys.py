"""Полный аудит всех ключей на проде: AI-провайдеры + Telegram + инфра.

Для каждого:
  • есть ли ключ
  • живой ли endpoint (HTTP 200 на /models или /me)
  • актуальный каталог моделей (если есть /v1/models)
  • smoke-ping одной осмысленной модели
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from typing import Any, List, Optional, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402


def _http(timeout: float = 60.0) -> httpx.AsyncClient:
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(proxy=proxy), timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


def _key(name: str) -> Optional[str]:
    return getattr(settings, name, None) or os.environ.get(name.upper())


# ╔════════════════════════════════════════════════════════════════════╗
# ║   Универсальные пингеры                                            ║
# ╚════════════════════════════════════════════════════════════════════╝
async def _models_get(url: str, headers: dict) -> Tuple[Optional[List[Any]], int, str]:
    try:
        async with _http() as c:
            r = await c.get(url, headers=headers)
            if r.status_code != 200:
                return None, r.status_code, r.text[:200]
            data = r.json()
            return data.get("data", data.get("models", data)), 200, ""
    except Exception as e:
        return None, 0, f"{type(e).__name__}: {e}"


async def _chat_ping(
    base_url: str,
    api_key: str,
    model: str,
    extra_headers: Optional[dict] = None,
) -> Tuple[bool, str, float]:
    body = {
        "model": model,
        "messages": [{"role": "user", "content": "reply OK"}],
        "max_tokens": 10,
        "temperature": 0.0,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    t0 = time.monotonic()
    try:
        async with _http() as c:
            r = await c.post(f"{base_url}/chat/completions", json=body, headers=headers)
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200:
                # gpt-5.x retry
                if "max_tokens" in r.text or r.status_code == 400:
                    body2 = dict(body)
                    body2.pop("max_tokens", None)
                    body2["max_completion_tokens"] = 10
                    async with _http() as c2:
                        r2 = await c2.post(f"{base_url}/chat/completions", json=body2, headers=headers)
                        if r2.status_code == 200:
                            text = r2.json()["choices"][0]["message"].get("content", "") or ""
                            return True, f"(via max_completion_tokens) {text.strip()[:60]}", ms
                return False, f"HTTP {r.status_code}: {r.text[:160]}", ms
            text = r.json()["choices"][0]["message"].get("content", "") or ""
            return True, text.strip()[:60] or "<empty>", ms
    except Exception as e:
        return False, f"{type(e).__name__}: {e}", (time.monotonic() - t0) * 1000


# ╔════════════════════════════════════════════════════════════════════╗
# ║   Конкретные провайдеры                                            ║
# ╚════════════════════════════════════════════════════════════════════╝
async def ping_openai():
    k = _key("openai_api_key")
    if not k:
        return ("OpenAI", False, "no key", [], None)
    models, code, err = await _models_get("https://api.openai.com/v1/models", {"Authorization": f"Bearer {k}"})
    if models is None:
        return ("OpenAI", False, f"models {code}: {err}", [], None)
    chat = [m["id"] for m in models if any(x in m.get("id","") for x in ["gpt-5","gpt-4","gpt-3.5","whisper","o1","o3","o4"])]
    ok, msg, ms = await _chat_ping("https://api.openai.com/v1", k, "gpt-5-nano")
    return ("OpenAI", True, f"{len(models)} models, {len(chat)} chat/audio", chat[:8], (ok, msg, ms, "gpt-5-nano"))


async def ping_anthropic():
    k = _key("anthropic_api_key")
    if not k:
        return ("Anthropic", False, "no key", [], None)
    # Anthropic /v1/models since 2024-10
    headers = {"x-api-key": k, "anthropic-version": "2023-06-01"}
    models, code, err = await _models_get("https://api.anthropic.com/v1/models", headers)
    if models is None:
        return ("Anthropic", False, f"models {code}: {err}", [], None)
    ids = [m.get("id", "") for m in models]
    # smoke-ping
    body = {
        "model": "claude-haiku-4-5",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "reply OK"}],
    }
    t0 = time.monotonic()
    fallback_models = [
        "claude-haiku-4-5",
        "claude-3-5-haiku-latest",
        "claude-3-haiku-20240307",
    ]
    chosen = None
    for m in fallback_models:
        if m in ids:
            chosen = m; break
    if not chosen:
        chosen = ids[0] if ids else "claude-3-haiku-20240307"
    body["model"] = chosen
    try:
        async with _http() as c:
            r = await c.post("https://api.anthropic.com/v1/messages", headers={**headers, "content-type": "application/json"}, json=body)
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200:
                ping = (False, f"HTTP {r.status_code}: {r.text[:120]}", ms, chosen)
            else:
                d = r.json()
                txt = "".join(b.get("text","") for b in d.get("content",[]) or [] if b.get("type")=="text")
                ping = (True, txt.strip()[:60] or "<empty>", ms, chosen)
    except Exception as e:
        ping = (False, str(e), 0.0, chosen)
    return ("Anthropic", True, f"{len(models)} models", ids[:10], ping)


async def ping_groq():
    k = _key("groq_api_key")
    if not k:
        return ("Groq", False, "no key", [], None)
    models, code, err = await _models_get("https://api.groq.com/openai/v1/models", {"Authorization": f"Bearer {k}"})
    if models is None:
        return ("Groq", False, f"{code}: {err}", [], None)
    ids = [m.get("id", "") for m in models]
    ok, msg, ms = await _chat_ping("https://api.groq.com/openai/v1", k, "llama-3.3-70b-versatile")
    return ("Groq", True, f"{len(models)} models", ids[:12], (ok, msg, ms, "llama-3.3-70b-versatile"))


async def ping_openrouter():
    k = _key("openrouter_api_key")
    if not k:
        return ("OpenRouter", False, "no key", [], None)
    # OpenRouter /api/v1/models не требует auth, но key валидируем через chat
    models, code, err = await _models_get("https://openrouter.ai/api/v1/models", {"Authorization": f"Bearer {k}"})
    if models is None:
        return ("OpenRouter", False, f"{code}: {err}", [], None)
    free = [m["id"] for m in models if ":free" in m.get("id", "")]
    ok, msg, ms = await _chat_ping(
        "https://openrouter.ai/api/v1",
        k,
        "openai/gpt-oss-120b:free",
        extra_headers={"HTTP-Referer": "https://xerocode.ru", "X-Title": "XeroCode Audit"},
    )
    return ("OpenRouter", True, f"{len(models)} total / {len(free)} free", free[:10], (ok, msg, ms, "openai/gpt-oss-120b:free"))


async def ping_sambanova():
    k = _key("sambanova_api_key")
    if not k:
        return ("SambaNova", False, "no key", [], None)
    models, code, err = await _models_get("https://api.sambanova.ai/v1/models", {"Authorization": f"Bearer {k}"})
    ids = [m.get("id", "") for m in (models or [])]
    # SambaNova популярные модели:
    candidate = next((m for m in ["Meta-Llama-3.3-70B-Instruct", "Meta-Llama-3.1-405B-Instruct", "Llama-4-Maverick-17B-128E-Instruct"] if m in ids), ids[0] if ids else "Meta-Llama-3.3-70B-Instruct")
    ok, msg, ms = await _chat_ping("https://api.sambanova.ai/v1", k, candidate)
    return ("SambaNova", True if models is not None else False, f"{len(ids)} models" if ids else f"{code}: {err}", ids[:10], (ok, msg, ms, candidate))


async def ping_cerebras():
    k = _key("cerebras_api_key")
    if not k:
        return ("Cerebras", False, "no key", [], None)
    models, code, err = await _models_get("https://api.cerebras.ai/v1/models", {"Authorization": f"Bearer {k}"})
    ids = [m.get("id", "") for m in (models or [])]
    candidate = next((m for m in ["llama-3.3-70b", "llama3.1-70b", "llama-4-scout-17b-16e-instruct"] if m in ids), ids[0] if ids else "llama-3.3-70b")
    ok, msg, ms = await _chat_ping("https://api.cerebras.ai/v1", k, candidate)
    return ("Cerebras", True if models is not None else False, f"{len(ids)} models" if ids else f"{code}: {err}", ids[:10], (ok, msg, ms, candidate))


async def ping_together():
    k = _key("together_api_key")
    if not k:
        return ("Together", False, "no key", [], None)
    models, code, err = await _models_get("https://api.together.xyz/v1/models", {"Authorization": f"Bearer {k}"})
    ids = [m.get("id", "") for m in (models or [])]
    candidate = next((m for m in ["meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", "meta-llama/Llama-3.3-70B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"] if m in ids), ids[0] if ids else "meta-llama/Llama-3.3-70B-Instruct-Turbo")
    ok, msg, ms = await _chat_ping("https://api.together.xyz/v1", k, candidate)
    free_count = sum(1 for i in ids if "Free" in i or "free" in i)
    return ("Together", True if models is not None else False, f"{len(ids)} models, {free_count} free" if ids else f"{code}: {err}", [i for i in ids if 'Free' in i][:10] or ids[:10], (ok, msg, ms, candidate))


async def ping_stability():
    k = _key("stability_api_key")
    if not k:
        return ("Stability", False, "no key", [], None)
    # Stability use /v1/user/account чтобы проверить ключ (не models)
    try:
        async with _http() as c:
            r = await c.get(
                "https://api.stability.ai/v1/user/account",
                headers={"Authorization": f"Bearer {k}"},
            )
            if r.status_code != 200:
                return ("Stability", False, f"HTTP {r.status_code}: {r.text[:100]}", [], None)
            d = r.json()
            email = d.get("email", "?")
            # проверим баланс
            r2 = await c.get(
                "https://api.stability.ai/v1/user/balance",
                headers={"Authorization": f"Bearer {k}"},
            )
            credits = r2.json().get("credits", "?") if r2.status_code == 200 else "?"
            return ("Stability", True, f"acct={email}, credits={credits}", ["sd3-large", "sd3-medium", "sdxl-1.0"], None)
    except Exception as e:
        return ("Stability", False, str(e), [], None)


async def ping_apiyi():
    """Apiyi.com — китайский OpenAI-compatibility прокси."""
    k = _key("apiyi_api_key")
    if not k:
        return ("Apiyi", False, "no key", [], None)
    # Apiyi.com endpoint
    base = "https://api.apiyi.com/v1"
    models, code, err = await _models_get(f"{base}/models", {"Authorization": f"Bearer {k}"})
    if models is None:
        return ("Apiyi", False, f"models {code}: {err}", [], None)
    ids = [m.get("id", "") for m in models]
    candidate = next((m for m in ["gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet-20241022", "gemini-2.0-flash-exp"] if m in ids), ids[0] if ids else "gpt-4o-mini")
    ok, msg, ms = await _chat_ping(base, k, candidate)
    return ("Apiyi", True, f"{len(ids)} models", ids[:12], (ok, msg, ms, candidate))


# ╔════════════════════════════════════════════════════════════════════╗
# ║   Не-AI: Telegram, Sentry, OAuth                                   ║
# ╚════════════════════════════════════════════════════════════════════╝
async def ping_telegram():
    token = _key("telegram_bot_token")
    if not token:
        return ("Telegram", False, "no token")
    try:
        async with _http() as c:
            r = await c.get(f"https://api.telegram.org/bot{token}/getMe")
            if r.status_code != 200:
                return ("Telegram", False, f"HTTP {r.status_code}: {r.text[:120]}")
            d = r.json()
            if not d.get("ok"):
                return ("Telegram", False, str(d))
            u = d.get("result", {})
            return ("Telegram", True, f"@{u.get('username')}, id={u.get('id')}, name={u.get('first_name')}")
    except Exception as e:
        return ("Telegram", False, str(e))


# ╔════════════════════════════════════════════════════════════════════╗
# ║   MAIN                                                             ║
# ╚════════════════════════════════════════════════════════════════════╝
async def main():
    print("=" * 96)
    print(f"VLESS proxy : {settings.api_proxy or '<none>'}")
    print("=" * 96)

    # Параллельно — 9 пингов
    ai_results = await asyncio.gather(
        ping_openai(),
        ping_anthropic(),
        ping_groq(),
        ping_openrouter(),
        ping_sambanova(),
        ping_cerebras(),
        ping_together(),
        ping_stability(),
        ping_apiyi(),
        return_exceptions=True,
    )

    print(f"\n{'PROVIDER':<14} {'KEY':<5} {'CATALOG':<35} {'PING':<6} {'LATENCY':>9}  REPLY/ERR")
    print("-" * 96)
    for res in ai_results:
        if isinstance(res, Exception):
            print(f"  EXCEPTION: {res}")
            continue
        name, ok_key, catalog_msg, _, ping_info = res
        key_flag = "YES" if ok_key else "NO "
        if ping_info:
            ok, msg, ms, model = ping_info
            ping_flag = "PASS" if ok else "FAIL"
            print(f"{name:<14} {key_flag:<5} {catalog_msg[:35]:<35} {ping_flag:<6} {ms:>7.0f}ms  {msg[:42]}")
        else:
            print(f"{name:<14} {key_flag:<5} {catalog_msg[:35]:<35} {'—':<6} {'—':>9}   —")

    # Подробности — каталоги
    print("\n" + "=" * 96)
    print("CATALOGS")
    print("=" * 96)
    for res in ai_results:
        if isinstance(res, Exception):
            continue
        name, ok_key, catalog_msg, models, _ = res
        if not ok_key or not models:
            continue
        print(f"\n[{name}] · {catalog_msg}")
        for m in models:
            print(f"  · {m}")

    # Telegram
    print("\n" + "=" * 96)
    print("Non-AI services")
    print("=" * 96)
    tg_name, tg_ok, tg_msg = await ping_telegram()
    print(f"  {tg_name:<12} {'PASS' if tg_ok else 'FAIL':<6} {tg_msg}")

    # OAuth — только наличие
    oauth_keys = ["github_client_id", "google_client_id", "yandex_client_id"]
    print("\n  OAuth providers (keys-only, без живой проверки):")
    for k in oauth_keys:
        v = _key(k)
        print(f"    {k:<24} {'YES' if v else 'NO '}  {(v[:8]+'...') if v else ''}")

    # Push
    vapid = _key("vapid_public_key")
    print(f"\n  VAPID push           {'YES' if vapid else 'NO '}  {(vapid[:16]+'...') if vapid else ''}")

    print("\nDONE\n")


if __name__ == "__main__":
    asyncio.run(main())
