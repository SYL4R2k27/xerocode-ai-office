"""Реальный пинг каждой модели из планируемой матрицы v1.4 + Apiyi diagnostics.

Vision-пинги — на реальной 8×8 RGB PNG (не 1×1), чтобы OpenAI/Claude не отбивали.
"""
from __future__ import annotations

import asyncio
import base64
import io
import os
import struct
import sys
import time
import wave
import zlib
from typing import Any, Dict, List, Optional, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import httpx  # noqa: E402

from app.core.config import settings  # noqa: E402


def _http(timeout: float = 90.0) -> httpx.AsyncClient:
    proxy = getattr(settings, "api_proxy", None)
    if proxy:
        return httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(proxy=proxy), timeout=timeout)
    return httpx.AsyncClient(timeout=timeout)


def _key(name: str) -> Optional[str]:
    return getattr(settings, name, None) or os.environ.get(name.upper())


# ── Реальный 8×8 красный PNG (минимальный валидный) ────────────────
def _make_png(width: int = 8, height: int = 8, rgb=(220, 40, 40)) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(height):
        raw += b"\x00" + (bytes(rgb) * width)
    idat = zlib.compress(raw, 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


PNG_8X8_RED_B64 = base64.b64encode(_make_png(8, 8, (220, 40, 40))).decode("ascii")


def _silent_wav(seconds: float = 1.0, rate: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        n = int(seconds * rate)
        w.writeframes(struct.pack("<" + "h" * n, *([0] * n)))
    return buf.getvalue()


# ────────────────────────────────────────────────────────────────────
async def chat_openai_compat(
    base_url: str,
    api_key: str,
    model: str,
    image_b64: Optional[str] = None,
    extra_headers: Optional[dict] = None,
    use_completion_tokens: bool = False,
) -> Tuple[bool, str, float]:
    if image_b64:
        content = [
            {"type": "text", "text": "цвет одним словом"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
        ]
    else:
        content = "reply OK"
    body: Dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "temperature": 0.0,
    }
    if use_completion_tokens:
        body["max_completion_tokens"] = 20
        body.pop("temperature", None)  # gpt-5.x не поддерживает
    else:
        body["max_tokens"] = 20

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)

    t0 = time.monotonic()
    try:
        async with _http() as c:
            r = await c.post(f"{base_url}/chat/completions", json=body, headers=headers)
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200 and not use_completion_tokens:
                # один retry на gpt-5.x
                if r.status_code == 400 and ("max_tokens" in r.text or "completion_tokens" in r.text or "temperature" in r.text):
                    return await chat_openai_compat(base_url, api_key, model, image_b64, extra_headers, use_completion_tokens=True)
                return False, f"HTTP {r.status_code}: {r.text[:140]}", ms
            if r.status_code != 200:
                return False, f"HTTP {r.status_code}: {r.text[:140]}", ms
            text = r.json()["choices"][0]["message"].get("content", "") or ""
            return True, text.strip()[:80] or "<empty>", ms
    except Exception as e:
        return False, f"{type(e).__name__}: {e}", (time.monotonic() - t0) * 1000


async def chat_anthropic(api_key: str, model: str, image_b64: Optional[str] = None) -> Tuple[bool, str, float]:
    user_content: List[Dict[str, Any]] = [{"type": "text", "text": "цвет одним словом"}] if image_b64 else [{"type": "text", "text": "reply OK"}]
    if image_b64:
        user_content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": image_b64},
        })
    body = {
        "model": model,
        "max_tokens": 20,
        "messages": [{"role": "user", "content": user_content}],
    }
    headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
    t0 = time.monotonic()
    try:
        async with _http() as c:
            r = await c.post("https://api.anthropic.com/v1/messages", json=body, headers=headers)
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200:
                return False, f"HTTP {r.status_code}: {r.text[:140]}", ms
            txt = "".join(b.get("text", "") for b in r.json().get("content", []) if b.get("type") == "text")
            return True, txt.strip()[:80] or "<empty>", ms
    except Exception as e:
        return False, f"{type(e).__name__}: {e}", (time.monotonic() - t0) * 1000


async def chat_gemini(api_key: str, model: str, image_b64: Optional[str] = None) -> Tuple[bool, str, float]:
    parts: List[Dict[str, Any]] = [{"text": "цвет одним словом" if image_b64 else "reply OK"}]
    if image_b64:
        parts.append({"inline_data": {"mime_type": "image/png", "data": image_b64}})
    body = {"contents": [{"role": "user", "parts": parts}], "generationConfig": {"maxOutputTokens": 20, "temperature": 0.0}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    t0 = time.monotonic()
    try:
        async with _http() as c:
            r = await c.post(url, json=body)
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200:
                return False, f"HTTP {r.status_code}: {r.text[:140]}", ms
            d = r.json()
            text = ""
            for cand in d.get("candidates") or []:
                for p in cand.get("content", {}).get("parts", []):
                    text += p.get("text", "")
            return True, text.strip()[:80] or "<empty>", ms
    except Exception as e:
        return False, f"{type(e).__name__}: {e}", (time.monotonic() - t0) * 1000


async def whisper_ping(base_url: str, api_key: str, model: str) -> Tuple[bool, str, float]:
    audio = _silent_wav(seconds=1.0)
    files = {"file": ("ping.wav", audio, "audio/wav")}
    data = {"model": model, "language": "ru", "response_format": "verbose_json"}
    t0 = time.monotonic()
    try:
        async with _http(timeout=120.0) as c:
            r = await c.post(
                f"{base_url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                files=files,
                data=data,
            )
            ms = (time.monotonic() - t0) * 1000
            if r.status_code != 200:
                return False, f"HTTP {r.status_code}: {r.text[:140]}", ms
            b = r.json()
            return True, f"d={b.get('duration')}s text={b.get('text','').strip()!r}", ms
    except Exception as e:
        return False, f"{type(e).__name__}: {e}", (time.monotonic() - t0) * 1000


# ╔════════════════════════════════════════════════════════════════════╗
# ║   APIYI diagnostics                                                ║
# ╚════════════════════════════════════════════════════════════════════╝
async def apiyi_diagnostics(api_key: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    base = "https://api.apiyi.com"
    headers = {"Authorization": f"Bearer {api_key}"}
    # Apiyi обычно копирует OpenAI dashboard endpoints
    candidates = [
        "/v1/dashboard/billing/credit_grants",
        "/v1/dashboard/billing/subscription",
        "/dashboard/billing/credit_grants",
        "/v1/billing/credits",
        "/v1/billing/usage",
        "/api/user/info",
        "/v1/me",
        "/v1/user/balance",
    ]
    async with _http() as c:
        for ep in candidates:
            try:
                r = await c.get(base + ep, headers=headers, timeout=20.0)
                out[ep] = {"status": r.status_code, "body": r.text[:240]}
            except Exception as e:
                out[ep] = {"status": 0, "body": f"{type(e).__name__}: {e}"}
    return out


# ╔════════════════════════════════════════════════════════════════════╗
# ║   MAIN                                                             ║
# ╚════════════════════════════════════════════════════════════════════╝
async def main():
    print("=" * 100)
    print(f"VLESS proxy: {settings.api_proxy}")
    print(f"PNG sample : 8×8 RGB red, {len(PNG_8X8_RED_B64)} chars base64")
    print("=" * 100)

    groq = _key("groq_api_key")
    openrouter = _key("openrouter_api_key")
    anthropic = _key("anthropic_api_key")
    openai = _key("openai_api_key")
    cerebras = _key("cerebras_api_key")
    sambanova = _key("sambanova_api_key")
    apiyi = _key("apiyi_api_key")
    gemini = _key("gemini_api_key") or _key("google_api_key")

    targets: List[Tuple[str, str, str, str]] = []
    # (label, kind, provider, model)

    # ── Vision ──
    targets += [
        ("VIS · groq llama-4-scout",       "vision_groq",  "groq",       "meta-llama/llama-4-scout-17b-16e-instruct"),
        ("VIS · OR gemma-4-26b:free",      "vision_or",    "openrouter", "google/gemma-4-26b-a4b-it:free"),
        ("VIS · OR nemotron-12b-vl:free",  "vision_or",    "openrouter", "nvidia/nemotron-nano-12b-v2-vl:free"),
        ("VIS · claude-haiku-4-5",         "vision_anth",  "anthropic",  "claude-haiku-4-5-20251001"),
        ("VIS · claude-sonnet-4-6",        "vision_anth",  "anthropic",  "claude-sonnet-4-6"),
        ("VIS · gemini-2.0-flash",         "vision_gem",   "gemini",     "gemini-2.0-flash") if gemini else None,
    ]
    targets = [t for t in targets if t]
    # ── Text fast (8B-class) ──
    targets += [
        ("8B · groq llama-3.1-8b",         "text_chat",    "groq",       "llama-3.1-8b-instant"),
        ("8B · groq gpt-oss-20b",          "text_chat",    "groq",       "openai/gpt-oss-20b"),
        ("8B · cerebras llama3.1-8b",      "text_cer",     "cerebras",   "llama3.1-8b"),
        ("8B · apiyi gpt-5-nano",          "text_apiyi",   "apiyi",      "gpt-5-nano"),
    ]
    # ── Text mid (70B-class / reasoning) ──
    targets += [
        ("70B · groq llama-3.3-70b",       "text_chat",    "groq",       "llama-3.3-70b-versatile"),
        ("70B · groq gpt-oss-120b",        "text_chat",    "groq",       "openai/gpt-oss-120b"),
        ("70B · cerebras gpt-oss-120b",    "text_cer",     "cerebras",   "gpt-oss-120b"),
        ("70B · cerebras qwen-3-235b",     "text_cer",     "cerebras",   "qwen-3-235b-a22b-instruct-2507"),
        ("70B · cerebras zai-glm-4.7",     "text_cer",     "cerebras",   "zai-glm-4.7"),
        ("70B · OR gpt-oss-120b:free",     "text_or",      "openrouter", "openai/gpt-oss-120b:free"),
        ("70B · sambanova llama-3.3-70b",  "text_samba",   "sambanova",  "Meta-Llama-3.3-70B-Instruct"),
        ("70B · sambanova deepseek-v3.2",  "text_samba",   "sambanova",  "DeepSeek-V3.2"),
        ("70B · apiyi gpt-5-mini",         "text_apiyi",   "apiyi",      "gpt-5-mini"),
        ("70B · apiyi claude-haiku-4-5",   "text_apiyi",   "apiyi",      "claude-haiku-4-5-20251001"),
        ("70B · apiyi claude-sonnet-4-6",  "text_apiyi",   "apiyi",      "claude-sonnet-4-6"),
        ("70B · anthropic haiku-4-5",      "text_anth",    "anthropic",  "claude-haiku-4-5-20251001"),
    ]
    # ── Whisper ──
    targets += [
        ("AUD · groq whisper-v3-turbo",    "whisper",      "groq",       "whisper-large-v3-turbo"),
        ("AUD · groq whisper-v3",          "whisper",      "groq",       "whisper-large-v3"),
        ("AUD · openai whisper-1",         "whisper",      "openai",     "whisper-1"),
    ]

    # ── Run sequentially чтобы не упереться в rate-limit одного провайдера ──
    print("\nRunning pings sequentially…\n")
    print(f"{'TARGET':<42} {'STATUS':<6} {'LATENCY':>10}  REPLY/ERR")
    print("-" * 100)

    for label, kind, prov, model in targets:
        if prov == "groq" and not groq:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no groq key"); continue
        if prov == "openrouter" and not openrouter:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no openrouter"); continue
        if prov == "anthropic" and not anthropic:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no anthropic"); continue
        if prov == "openai" and not openai:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no openai"); continue
        if prov == "cerebras" and not cerebras:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no cerebras"); continue
        if prov == "sambanova" and not sambanova:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no sambanova"); continue
        if prov == "apiyi" and not apiyi:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no apiyi"); continue
        if prov == "gemini" and not gemini:
            print(f"{label:<42} {'SKIP':<6} {'—':>10}  no gemini"); continue

        try:
            if kind == "vision_groq":
                ok, msg, ms = await chat_openai_compat("https://api.groq.com/openai/v1", groq, model, image_b64=PNG_8X8_RED_B64)
            elif kind == "vision_or":
                ok, msg, ms = await chat_openai_compat(
                    "https://openrouter.ai/api/v1", openrouter, model, image_b64=PNG_8X8_RED_B64,
                    extra_headers={"HTTP-Referer": "https://xerocode.ru", "X-Title": "XeroCode Audit"},
                )
            elif kind == "vision_anth":
                ok, msg, ms = await chat_anthropic(anthropic, model, image_b64=PNG_8X8_RED_B64)
            elif kind == "vision_gem":
                ok, msg, ms = await chat_gemini(gemini, model, image_b64=PNG_8X8_RED_B64)
            elif kind == "text_chat":
                ok, msg, ms = await chat_openai_compat("https://api.groq.com/openai/v1", groq, model)
            elif kind == "text_cer":
                ok, msg, ms = await chat_openai_compat("https://api.cerebras.ai/v1", cerebras, model)
            elif kind == "text_or":
                ok, msg, ms = await chat_openai_compat(
                    "https://openrouter.ai/api/v1", openrouter, model,
                    extra_headers={"HTTP-Referer": "https://xerocode.ru", "X-Title": "XeroCode Audit"},
                )
            elif kind == "text_samba":
                ok, msg, ms = await chat_openai_compat("https://api.sambanova.ai/v1", sambanova, model)
            elif kind == "text_apiyi":
                ok, msg, ms = await chat_openai_compat("https://api.apiyi.com/v1", apiyi, model)
            elif kind == "text_anth":
                ok, msg, ms = await chat_anthropic(anthropic, model)
            elif kind == "whisper":
                if prov == "groq":
                    ok, msg, ms = await whisper_ping("https://api.groq.com/openai/v1", groq, model)
                else:
                    ok, msg, ms = await whisper_ping("https://api.openai.com/v1", openai, model)
            else:
                ok, msg, ms = False, f"unknown kind {kind}", 0.0
        except Exception as e:
            ok, msg, ms = False, f"{type(e).__name__}: {e}", 0.0

        flag = "PASS" if ok else "FAIL"
        print(f"{label:<42} {flag:<6} {ms:>8.0f}ms  {msg[:50]}")

    # ── Apiyi diagnostics ──
    print("\n" + "=" * 100)
    print("APIYI DIAGNOSTICS — billing/balance/limits")
    print("=" * 100)
    if apiyi:
        diag = await apiyi_diagnostics(apiyi)
        for ep, r in diag.items():
            status = r.get("status")
            body = r.get("body")
            short = body[:200] if body else ""
            tag = "OK" if status == 200 else f"HTTP {status}" if status else "ERR"
            print(f"  {ep:<48} [{tag}] {short}")
    else:
        print("  no apiyi key")

    print("\nDONE\n")


if __name__ == "__main__":
    asyncio.run(main())
