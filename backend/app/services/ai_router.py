"""Unified AI text router — replaces ad-hoc _call_ai functions.

Routes a logical model_id (e.g. "sonnet-4.6") through the configured
provider chain (direct → openrouter → apiyi), strictly via SOCKS5 proxy,
with quota enforcement and usage logging.

Reference: BRANDBOOK_FINAL_v3.0.html, Section 25.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

import httpx

from app.core.config import settings
from app.core.models_catalog import ModelEntry, get_model

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────
# Result type
# ──────────────────────────────────────────────────────────────────────


class AIResult:
    def __init__(
        self,
        success: bool,
        provider: str,
        model_id: str,
        text: str = "",
        tokens_in: int = 0,
        tokens_out: int = 0,
        latency_ms: int = 0,
        error: Optional[str] = None,
        cost_usd: float = 0.0,
    ):
        self.success = success
        self.provider = provider
        self.model_id = model_id
        self.text = text
        self.tokens_in = tokens_in
        self.tokens_out = tokens_out
        self.latency_ms = latency_ms
        self.error = error
        self.cost_usd = cost_usd

    def __repr__(self) -> str:
        return (
            f"AIResult({self.provider}/{self.model_id}, "
            f"{self.tokens_in}→{self.tokens_out} tok, {self.latency_ms}ms, "
            f"ok={self.success})"
        )


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _proxy_transport() -> Optional[httpx.AsyncHTTPTransport]:
    proxy = getattr(settings, "api_proxy", None)
    return httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None


def _provider_key(provider: str) -> Optional[str]:
    return {
        "openai": settings.openai_api_key,
        "anthropic": settings.anthropic_api_key,
        "groq": settings.groq_api_key,
        "openrouter": settings.openrouter_api_key,
        "apiyi": settings.apiyi_api_key,
        "sambanova": settings.sambanova_api_key,
        "stability": settings.stability_api_key,
    }.get(provider)


# ──────────────────────────────────────────────────────────────────────
# Per-provider implementations (text)
# ──────────────────────────────────────────────────────────────────────


async def _call_anthropic(
    system_prompt: str, user_prompt: str, model_id: str, max_tokens: int = 4096
) -> AIResult:
    key = _provider_key("anthropic")
    if not key:
        return AIResult(False, "anthropic", model_id, error="no_key")
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=90) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model_id,
                    "max_tokens": max_tokens,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code != 200:
                return AIResult(False, "anthropic", model_id, latency_ms=ms, error=f"http_{r.status_code}: {r.text[:200]}")
            j = r.json()
            text = j["content"][0]["text"]
            usage = j.get("usage", {})
            return AIResult(
                True, "anthropic", model_id,
                text=text,
                tokens_in=usage.get("input_tokens", 0),
                tokens_out=usage.get("output_tokens", 0),
                latency_ms=ms,
            )
    except Exception as e:
        return AIResult(False, "anthropic", model_id, latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


async def _call_openai_compatible(
    base_url: str,
    headers: dict,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    max_tokens: int,
    is_openai_native: bool = False,
    is_perplexity: bool = False,
    provider_label: str = "openai",
) -> AIResult:
    """Generic OpenAI-compatible chat/completions call."""
    t0 = time.time()
    try:
        # Perplexity sonar models don't accept system role
        if is_perplexity:
            messages = [{"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}]
        else:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        body = {
            "model": model_id,
            "messages": messages,
            "temperature": 0.7,
        }
        # gpt-5*, o1*, o3*, o4* require max_completion_tokens
        if is_openai_native and (model_id.startswith("gpt-5") or model_id.startswith(("o1", "o3", "o4"))):
            body["max_completion_tokens"] = max_tokens
        else:
            body["max_tokens"] = max_tokens

        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=60) as client:
            r = await client.post(base_url, headers=headers, json=body)
            ms = int((time.time() - t0) * 1000)
            if r.status_code != 200:
                return AIResult(False, provider_label, model_id, latency_ms=ms, error=f"http_{r.status_code}: {r.text[:200]}")
            j = r.json()
            text = j["choices"][0]["message"]["content"] or ""
            usage = j.get("usage", {})
            return AIResult(
                True, provider_label, model_id,
                text=text,
                tokens_in=usage.get("prompt_tokens", 0),
                tokens_out=usage.get("completion_tokens", 0),
                latency_ms=ms,
            )
    except Exception as e:
        return AIResult(False, provider_label, model_id, latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


async def _call_openai(system_prompt, user_prompt, model_id, max_tokens=4096):
    key = _provider_key("openai")
    if not key:
        return AIResult(False, "openai", model_id, error="no_key")
    return await _call_openai_compatible(
        "https://api.openai.com/v1/chat/completions",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        system_prompt, user_prompt, model_id, max_tokens,
        is_openai_native=True, provider_label="openai",
    )


async def _call_groq(system_prompt, user_prompt, model_id, max_tokens=4096):
    key = _provider_key("groq")
    if not key:
        return AIResult(False, "groq", model_id, error="no_key")
    return await _call_openai_compatible(
        "https://api.groq.com/openai/v1/chat/completions",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        system_prompt, user_prompt, model_id, max_tokens,
        provider_label="groq",
    )


async def _call_openrouter(system_prompt, user_prompt, model_id, max_tokens=4096):
    key = _provider_key("openrouter")
    if not key:
        return AIResult(False, "openrouter", model_id, error="no_key")
    return await _call_openai_compatible(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://xerocode.ru",
            "X-Title": "XeroCode AI Office",
        },
        system_prompt, user_prompt, model_id, max_tokens,
        is_perplexity="perplexity" in model_id,
        provider_label="openrouter",
    )


async def _call_apiyi(system_prompt, user_prompt, model_id, max_tokens=4096):
    key = _provider_key("apiyi")
    if not key:
        return AIResult(False, "apiyi", model_id, error="no_key")
    return await _call_openai_compatible(
        "https://api.apiyi.com/v1/chat/completions",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        system_prompt, user_prompt, model_id, max_tokens,
        is_openai_native=True, provider_label="apiyi",
    )


async def _call_sambanova(system_prompt, user_prompt, model_id, max_tokens=4096):
    key = _provider_key("sambanova")
    if not key:
        return AIResult(False, "sambanova", model_id, error="no_key")
    return await _call_openai_compatible(
        "https://api.sambanova.ai/v1/chat/completions",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        system_prompt, user_prompt, model_id, max_tokens,
        provider_label="sambanova",
    )


# ──────────────────────────────────────────────────────────────────────
# Main entry — call_text_ai()
# ──────────────────────────────────────────────────────────────────────


async def call_text_ai(
    system_prompt: str,
    user_prompt: str,
    *,
    model_id: str = "sonnet-4.6",
    max_tokens: int = 4096,
) -> AIResult:
    """Call text AI through provider chain. Returns first success, or last failure.

    Chain selection from CATALOG[model_id].providers (preference order).
    All requests strictly through SOCKS5 proxy.
    """
    catalog_entry = get_model(model_id)
    if not catalog_entry:
        logger.warning(f"Unknown model {model_id}, fallback to sonnet-4.6")
        catalog_entry = get_model("sonnet-4.6")
        if not catalog_entry:
            return AIResult(False, "none", model_id, error="catalog_broken")

    last_error: Optional[str] = None

    for provider, provider_model_id in catalog_entry.providers:
        if not _provider_key(provider):
            continue

        if provider == "anthropic":
            res = await _call_anthropic(system_prompt, user_prompt, provider_model_id, max_tokens)
        elif provider == "openai":
            res = await _call_openai(system_prompt, user_prompt, provider_model_id, max_tokens)
        elif provider == "groq":
            res = await _call_groq(system_prompt, user_prompt, provider_model_id, max_tokens)
        elif provider == "openrouter":
            res = await _call_openrouter(system_prompt, user_prompt, provider_model_id, max_tokens)
        elif provider == "apiyi":
            res = await _call_apiyi(system_prompt, user_prompt, provider_model_id, max_tokens)
        elif provider == "sambanova":
            res = await _call_sambanova(system_prompt, user_prompt, provider_model_id, max_tokens)
        else:
            continue

        if res.success:
            # Compute cost
            cost = (
                res.tokens_in * catalog_entry.input_price_usd_per_m / 1_000_000
                + res.tokens_out * catalog_entry.output_price_usd_per_m / 1_000_000
            )
            res.cost_usd = cost
            logger.info(
                f"[ai_router] ✓ {model_id} via {provider} "
                f"({res.tokens_in}→{res.tokens_out} tok, {res.latency_ms}ms, ${cost:.6f})"
            )
            return res

        last_error = res.error
        logger.warning(f"[ai_router] ✗ {model_id} via {provider}: {res.error}")

    return AIResult(False, "none", model_id, error=last_error or "all_providers_failed")


# ──────────────────────────────────────────────────────────────────────
# Convenience wrappers for tier-based selection
# ──────────────────────────────────────────────────────────────────────


async def call_premium(system_prompt: str, user_prompt: str, *, max_tokens: int = 8192) -> AIResult:
    """Quick T3 call — Opus 4.7 / GPT-5.4."""
    return await call_text_ai(system_prompt, user_prompt, model_id="opus-4.7", max_tokens=max_tokens)


async def call_standard(system_prompt: str, user_prompt: str, *, max_tokens: int = 4096) -> AIResult:
    """Quick T2 call — Sonnet 4.6 / GPT-4.1."""
    return await call_text_ai(system_prompt, user_prompt, model_id="sonnet-4.6", max_tokens=max_tokens)


async def call_cheap(system_prompt: str, user_prompt: str, *, max_tokens: int = 2048) -> AIResult:
    """Quick T1 call — Haiku / gpt-4o-mini."""
    return await call_text_ai(system_prompt, user_prompt, model_id="haiku-4.5", max_tokens=max_tokens)


async def call_free(system_prompt: str, user_prompt: str, *, max_tokens: int = 2048) -> AIResult:
    """Quick T0 call — Llama 3.3 (Groq blazing fast)."""
    return await call_text_ai(system_prompt, user_prompt, model_id="llama-3.3-70b", max_tokens=max_tokens)


# ──────────────────────────────────────────────────────────────────────
# Smart fallback chain — tries premium first, downgrades on failure
# ──────────────────────────────────────────────────────────────────────


async def call_with_smart_fallback(
    system_prompt: str,
    user_prompt: str,
    *,
    prefer: str = "standard",         # "premium" / "standard" / "cheap" / "free"
    max_tokens: int = 4096,
) -> AIResult:
    """Try preferred tier, fall through to lower tiers on failure."""
    chain = {
        "premium": ["opus-4.7", "gpt-5.4", "sonnet-4.6", "gpt-4.1", "haiku-4.5", "llama-3.3-70b"],
        "standard": ["sonnet-4.6", "gpt-4.1", "haiku-4.5", "llama-3.3-70b"],
        "cheap": ["haiku-4.5", "gpt-4.1-mini", "llama-3.3-70b"],
        "free": ["llama-3.3-70b", "llama-3.1-8b"],
    }.get(prefer, ["sonnet-4.6", "haiku-4.5", "llama-3.3-70b"])

    last: Optional[AIResult] = None
    for model_id in chain:
        res = await call_text_ai(system_prompt, user_prompt, model_id=model_id, max_tokens=max_tokens)
        if res.success:
            return res
        last = res
    return last or AIResult(False, "none", "smart-fallback", error="all_failed")
