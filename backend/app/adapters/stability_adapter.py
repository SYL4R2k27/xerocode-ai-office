"""
Адаптер для Stability AI — генерация изображений.
Stable Diffusion 3.5, SDXL.
Community License: бесплатно для <$1M revenue.
"""
from __future__ import annotations

import base64

import httpx

from app.adapters.base import AIResponse, BaseAdapter


class StabilityAdapter(BaseAdapter):
    """Адаптер для Stability AI API (Stable Diffusion)."""

    def __init__(self, api_key: str, base_url: str | None = None):
        super().__init__(api_key, base_url)
        self.endpoint = base_url or "https://api.stability.ai/v2beta"

    async def call(
        self,
        messages: list[dict],
        model: str = "sd3.5-large",
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        """
        Для Stability API: последнее сообщение используется как промпт.
        Возвращает base64 изображения в content.
        """
        # Extract last user message as prompt
        prompt = ""
        negative_prompt = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
                    prompt = content
                break

        if not prompt:
            return AIResponse(content="No prompt provided", model=model)

        # Check for negative prompt in system
        if system_prompt and "negative:" in system_prompt.lower():
            parts = system_prompt.split("negative:", 1)
            negative_prompt = parts[1].strip() if len(parts) > 1 else ""

        result = await self.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            model=model,
        )

        return AIResponse(
            content=result.get("text", "Image generated successfully"),
            model=model,
            raw=result,
        )

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        model: str = "sd3.5-large",
        width: int = 1024,
        height: int = 1024,
        steps: int = 30,
    ) -> dict:
        """Генерация изображения через Stability AI API."""
        form_data = {
            "prompt": prompt,
            "output_format": "png",
            "model": model,
        }
        if negative_prompt:
            form_data["negative_prompt"] = negative_prompt

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}/stable-image/generate/core",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                },
                files={k: (None, v) for k, v in form_data.items()},
            )
            response.raise_for_status()
            data = response.json()

        image_b64 = data.get("image", "")

        return {
            "text": f"Generated image: {prompt[:100]}",
            "image_base64": image_b64,
            "format": "png",
            "model": model,
        }

    async def test_connection(self, model: str = "sd3.5-large") -> bool:
        try:
            async with self._get_client(10.0) as client:
                response = await client.get(
                    "https://api.stability.ai/v1/user/account",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return response.status_code == 200
        except Exception:
            return False
