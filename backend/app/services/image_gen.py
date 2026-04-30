"""Unified image generation service.

ВСЕ вызовы строго через `settings.api_proxy`.
Цепочка: direct keys → openrouter (где работает) → apiyi → pollinations free.

Reference: BRANDBOOK_FINAL_v3.0.html, Section 25.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import time
import urllib.parse
from typing import Optional

import httpx

from app.core.config import settings
from app.core.models_catalog import ModelEntry, get_model

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────
# Result type
# ──────────────────────────────────────────────────────────────────────


class ImageGenResult:
    """Result of image generation."""

    def __init__(
        self,
        success: bool,
        provider: str,
        model_id: str,
        image_bytes: Optional[bytes] = None,
        latency_ms: int = 0,
        error: Optional[str] = None,
        cost_usd: float = 0.0,
    ):
        self.success = success
        self.provider = provider
        self.model_id = model_id
        self.image_bytes = image_bytes
        self.latency_ms = latency_ms
        self.error = error
        self.cost_usd = cost_usd

    def __repr__(self) -> str:
        size = len(self.image_bytes) if self.image_bytes else 0
        return f"ImageGenResult({self.provider}/{self.model_id}, {self.latency_ms}ms, {size}b, ok={self.success})"


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _proxy_transport() -> Optional[httpx.AsyncHTTPTransport]:
    """ВСЕ image-вызовы строго через прокси."""
    proxy = getattr(settings, "api_proxy", None)
    return httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None


def _provider_key(provider: str) -> Optional[str]:
    return {
        "openai": settings.openai_api_key,
        "anthropic": settings.anthropic_api_key,
        "stability": settings.stability_api_key,
        "openrouter": settings.openrouter_api_key,
        "apiyi": settings.apiyi_api_key,
        "groq": settings.groq_api_key,
        "together": settings.together_api_key,
        "pollinations": "free",  # marker
    }.get(provider)


# ──────────────────────────────────────────────────────────────────────
# Per-provider implementations
# ──────────────────────────────────────────────────────────────────────


async def _gen_openai(prompt: str, model_id: str, size: str) -> ImageGenResult:
    """Direct OpenAI — gpt-image-2 / 1.5 / 1, dall-e-3."""
    key = _provider_key("openai")
    if not key:
        return ImageGenResult(False, "openai", model_id, error="no_key")
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=120) as client:
            r = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"model": model_id, "prompt": prompt, "size": size, "n": 1},
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code != 200:
                return ImageGenResult(False, "openai", model_id, latency_ms=ms, error=f"http_{r.status_code}: {r.text[:200]}")
            d = (r.json().get("data") or [{}])[0]
            img: Optional[bytes] = None
            if d.get("b64_json"):
                img = base64.b64decode(d["b64_json"])
            elif d.get("url"):
                ir = await client.get(d["url"], timeout=60)
                if ir.status_code == 200:
                    img = ir.content
            if img and len(img) > 2000:
                return ImageGenResult(True, "openai", model_id, image_bytes=img, latency_ms=ms)
            return ImageGenResult(False, "openai", model_id, latency_ms=ms, error="empty_or_tiny_image")
    except Exception as e:
        return ImageGenResult(False, "openai", model_id, latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


async def _gen_stability(prompt: str, model_id: str) -> ImageGenResult:
    """Direct Stability AI — sd3.5-large/medium/turbo/ultra."""
    key = _provider_key("stability")
    if not key:
        return ImageGenResult(False, "stability", model_id, error="no_key")
    # Map to actual endpoint
    if "ultra" in model_id:
        url = "https://api.stability.ai/v2beta/stable-image/generate/ultra"
    elif "core" in model_id:
        url = "https://api.stability.ai/v2beta/stable-image/generate/core"
    else:
        url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=90) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {key}", "Accept": "image/*"},
                files={
                    "prompt": (None, prompt),
                    "model": (None, "sd3.5-large"),
                    "output_format": (None, "png"),
                },
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code == 200 and len(r.content) > 2000:
                return ImageGenResult(True, "stability", model_id, image_bytes=r.content, latency_ms=ms)
            return ImageGenResult(False, "stability", model_id, latency_ms=ms, error=f"http_{r.status_code}: {r.text[:200]}")
    except Exception as e:
        return ImageGenResult(False, "stability", model_id, latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


async def _gen_apiyi(prompt: str, model_id: str, size: str) -> ImageGenResult:
    """apiyi — universal OpenAI-compatible endpoint."""
    key = _provider_key("apiyi")
    if not key:
        return ImageGenResult(False, "apiyi", model_id, error="no_key")
    t0 = time.time()
    try:
        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=120) as client:
            r = await client.post(
                "https://api.apiyi.com/v1/images/generations",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"model": model_id, "prompt": prompt, "size": size, "n": 1},
            )
            ms = int((time.time() - t0) * 1000)
            if r.status_code != 200:
                return ImageGenResult(False, "apiyi", model_id, latency_ms=ms, error=f"http_{r.status_code}: {r.text[:200]}")
            d = (r.json().get("data") or [{}])[0]
            img: Optional[bytes] = None
            if d.get("b64_json"):
                img = base64.b64decode(d["b64_json"])
            elif d.get("url"):
                ir = await client.get(d["url"], timeout=60)
                if ir.status_code == 200:
                    img = ir.content
            if img and len(img) > 2000:
                return ImageGenResult(True, "apiyi", model_id, image_bytes=img, latency_ms=ms)
            return ImageGenResult(False, "apiyi", model_id, latency_ms=ms, error="empty_or_tiny_image")
    except Exception as e:
        return ImageGenResult(False, "apiyi", model_id, latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


async def _gen_pollinations(prompt: str, seed: int = 42) -> ImageGenResult:
    """Free Pollinations FLUX — ultimate fallback."""
    t0 = time.time()
    try:
        encoded = urllib.parse.quote(prompt, safe="")
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"
        async with httpx.AsyncClient(transport=_proxy_transport(), timeout=40) as client:
            r = await client.get(url)
            ms = int((time.time() - t0) * 1000)
            if r.status_code == 200 and len(r.content) > 2000:
                return ImageGenResult(True, "pollinations", "flux", image_bytes=r.content, latency_ms=ms)
            return ImageGenResult(False, "pollinations", "flux", latency_ms=ms, error=f"http_{r.status_code}")
    except Exception as e:
        return ImageGenResult(False, "pollinations", "flux", latency_ms=int((time.time() - t0) * 1000), error=str(e)[:200])


# ──────────────────────────────────────────────────────────────────────
# Main entry — generate_image()
# ──────────────────────────────────────────────────────────────────────


async def generate_image(
    prompt: str,
    *,
    model_id: str = "gpt-image-1.5",
    size: str = "1024x1024",
    seed: int = 42,
    fallback_to_free: bool = True,
) -> ImageGenResult:
    """Generate an image via best available provider, strictly through proxy.

    Tries chain:
      1. preferred provider for `model_id` from catalog
      2. all alternates from catalog
      3. Pollinations (free) as ultimate fallback
    """
    catalog_entry = get_model(model_id)
    if not catalog_entry:
        logger.warning(f"Unknown model {model_id}, fallback to gpt-image-1.5")
        catalog_entry = get_model("gpt-image-1.5")
        if not catalog_entry:
            # Catalog broken — fallback direct to Pollinations
            return await _gen_pollinations(prompt, seed)

    last_error: Optional[str] = None

    for provider, provider_model_id in catalog_entry.providers:
        if not _provider_key(provider) and provider != "pollinations":
            continue

        if provider == "openai":
            res = await _gen_openai(prompt, provider_model_id, size)
        elif provider == "stability":
            res = await _gen_stability(prompt, provider_model_id)
        elif provider == "apiyi":
            res = await _gen_apiyi(prompt, provider_model_id, size)
        elif provider == "pollinations":
            res = await _gen_pollinations(prompt, seed)
        else:
            continue

        if res.success:
            cost = (
                catalog_entry.media_price_usd_per_unit
                if provider != "pollinations" else 0.0
            )
            res.cost_usd = cost
            logger.info(f"[image_gen] ✓ {model_id} via {provider} in {res.latency_ms}ms")
            return res

        last_error = res.error
        logger.warning(f"[image_gen] ✗ {model_id} via {provider}: {res.error}")

    # Ultimate fallback to Pollinations
    if fallback_to_free:
        logger.info(f"[image_gen] All providers failed, trying Pollinations free")
        return await _gen_pollinations(prompt, seed)

    return ImageGenResult(False, "none", model_id, error=last_error or "all_providers_failed")


# ──────────────────────────────────────────────────────────────────────
# Batch API
# ──────────────────────────────────────────────────────────────────────


async def generate_batch(
    prompts: list[str],
    *,
    model_id: str = "gpt-image-1.5",
    size: str = "1024x1024",
) -> list[ImageGenResult]:
    """Generate multiple images in parallel."""
    tasks = [
        generate_image(prompt, model_id=model_id, size=size, seed=42 + i)
        for i, prompt in enumerate(prompts)
    ]
    return await asyncio.gather(*tasks, return_exceptions=False)


# ──────────────────────────────────────────────────────────────────────
# Health check (for /admin/images/health endpoint)
# ──────────────────────────────────────────────────────────────────────


async def health_check_all_providers() -> list[dict]:
    """Ping all configured image providers — for admin dashboard."""
    test_prompt = "a simple red circle on white background"
    candidates = [
        ("openai/gpt-image-1.5", "gpt-image-1.5"),
        ("openai/dall-e-3", "dall-e-3"),
        ("stability/sd3.5-ultra", "stability-sd35-ultra"),
        ("apiyi/nano-banana-pro", "nano-banana-pro"),
        ("apiyi/flux-2-pro", "flux-2-pro"),
        ("pollinations/flux", "pollinations-flux"),
    ]
    results = []
    for label, model_id in candidates:
        try:
            res = await generate_image(prompt=test_prompt, model_id=model_id, size="512x512")
            results.append(
                {
                    "label": label,
                    "model_id": model_id,
                    "provider": res.provider,
                    "success": res.success,
                    "latency_ms": res.latency_ms,
                    "size_bytes": len(res.image_bytes) if res.image_bytes else 0,
                    "cost_usd": res.cost_usd,
                    "error": res.error,
                }
            )
        except Exception as e:
            results.append({"label": label, "model_id": model_id, "success": False, "error": str(e)[:200]})
    return results
