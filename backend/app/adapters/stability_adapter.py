"""
Адаптер для Stability AI — полный набор:
- Генерация: SD 3.5 Large/Medium/Turbo, Ultra, Core
- Редактирование: Inpaint, Outpaint, Remove BG, Search & Replace, Erase
- Улучшение: Upscale (Conservative, Creative)
- Видео: Image-to-Video
- 3D: Stable Fast 3D

$1021 баланс = ~15 000 изображений.
"""
from __future__ import annotations

import base64
import json
import time

import httpx

from app.adapters.base import AIResponse, BaseAdapter


# Маршрутизация модель → эндпоинт
MODEL_ENDPOINTS = {
    # Генерация
    "sd3.5-large": "/stable-image/generate/sd3",
    "sd3.5-large-turbo": "/stable-image/generate/sd3",
    "sd3.5-medium": "/stable-image/generate/sd3",
    "stable-image-core": "/stable-image/generate/core",
    "stable-image-ultra": "/stable-image/generate/ultra",
    # Редактирование
    "inpaint": "/stable-image/edit/inpaint",
    "outpaint": "/stable-image/edit/outpaint",
    "search-and-replace": "/stable-image/edit/search-and-replace",
    "search-and-recolor": "/stable-image/edit/search-and-recolor",
    "remove-background": "/stable-image/edit/remove-background",
    "erase": "/stable-image/edit/erase",
    "replace-background": "/stable-image/edit/replace-background-and-relight",
    # Улучшение
    "upscale-conservative": "/stable-image/upscale/conservative",
    "upscale-creative": "/stable-image/upscale/creative",
    # Контроль
    "control-sketch": "/stable-image/control/sketch",
    "control-structure": "/stable-image/control/structure",
    "style-transfer": "/stable-image/control/style",
    # Видео
    "image-to-video": "/image-to-video",
    # 3D
    "stable-fast-3d": "/3d/stable-fast-3d",
}

# Стиль-пресеты для Core
STYLE_PRESETS = [
    "enhance", "anime", "photographic", "digital-art", "comic-book",
    "fantasy-art", "line-art", "analog-film", "neon-punk", "isometric",
    "low-poly", "origami", "modeling-compound", "cinematic", "3d-model",
    "pixel-art", "tile-texture",
]


class StabilityAdapter(BaseAdapter):
    """Адаптер для Stability AI API — генерация, редактирование, видео, 3D."""

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
        """Извлекает промпт из сообщений и генерирует изображение."""
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

        if system_prompt and "negative:" in system_prompt.lower():
            parts = system_prompt.split("negative:", 1)
            negative_prompt = parts[1].strip() if len(parts) > 1 else ""

        result = await self.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            model=model,
        )

        return AIResponse(
            content=result.get("text", "Image generated"),
            model=model,
            raw=result,
        )

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        model: str = "sd3.5-large",
        aspect_ratio: str = "1:1",
        output_format: str = "png",
        style_preset: str | None = None,
        seed: int | None = None,
    ) -> dict:
        """Генерация изображения. Роутинг по модели."""
        endpoint_path = MODEL_ENDPOINTS.get(model, "/stable-image/generate/sd3")

        form_data: dict[str, str] = {
            "prompt": prompt,
            "output_format": output_format,
            "aspect_ratio": aspect_ratio,
        }

        # SD3 эндпоинт принимает model параметр
        if "/sd3" in endpoint_path:
            form_data["model"] = model
        # Core принимает style_preset
        elif "/core" in endpoint_path and style_preset:
            form_data["style_preset"] = style_preset

        if negative_prompt:
            form_data["negative_prompt"] = negative_prompt

        if seed is not None:
            form_data["seed"] = str(seed)

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}{endpoint_path}",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                },
                files={k: (None, v) for k, v in form_data.items()},
            )
            response.raise_for_status()
            data = response.json()

        image_b64 = data.get("image", "")
        returned_seed = data.get("seed", 0)

        return {
            "text": f"Generated ({model}): {prompt[:80]}",
            "image_base64": image_b64,
            "format": output_format,
            "model": model,
            "seed": returned_seed,
        }

    async def edit_image(
        self,
        image_bytes: bytes,
        operation: str,
        prompt: str = "",
        mask_bytes: bytes | None = None,
        **kwargs: str,
    ) -> dict:
        """Редактирование изображения (inpaint, outpaint, remove-bg, erase, search-replace)."""
        endpoint_path = MODEL_ENDPOINTS.get(operation)
        if not endpoint_path:
            return {"error": f"Unknown operation: {operation}"}

        files: dict = {"image": ("image.png", image_bytes, "image/png")}

        if mask_bytes and operation in ("inpaint", "erase"):
            files["mask"] = ("mask.png", mask_bytes, "image/png")

        data: dict[str, str] = {"output_format": kwargs.get("output_format", "png")}
        if prompt:
            data["prompt"] = prompt
        if "search_prompt" in kwargs:
            data["search_prompt"] = kwargs["search_prompt"]

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}{endpoint_path}",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                },
                files=files,
                data=data,
            )
            response.raise_for_status()
            result = response.json()

        return {
            "text": f"Edited ({operation}): {prompt[:50]}",
            "image_base64": result.get("image", ""),
            "format": data["output_format"],
        }

    async def upscale_image(
        self,
        image_bytes: bytes,
        mode: str = "conservative",
        prompt: str = "",
    ) -> dict:
        """Увеличение разрешения изображения."""
        endpoint_path = MODEL_ENDPOINTS.get(f"upscale-{mode}", "/stable-image/upscale/conservative")

        files = {"image": ("image.png", image_bytes, "image/png")}
        data: dict[str, str] = {"output_format": "png"}
        if prompt:
            data["prompt"] = prompt

        async with self._get_client(120.0) as client:
            response = await client.post(
                f"{self.endpoint}{endpoint_path}",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                },
                files=files,
                data=data,
            )
            response.raise_for_status()

            # Creative upscale возвращает generation_id (async)
            if mode == "creative":
                result = response.json()
                gen_id = result.get("id", "")
                if gen_id:
                    return await self._poll_result(f"/stable-image/upscale/creative/result/{gen_id}")

            result = response.json()

        return {
            "text": f"Upscaled ({mode})",
            "image_base64": result.get("image", ""),
            "format": "png",
        }

    async def generate_video(
        self,
        image_bytes: bytes,
        seed: int = 0,
        cfg_scale: float = 1.8,
        motion_bucket_id: int = 127,
    ) -> dict:
        """Image-to-Video генерация (async — submit + poll)."""
        files = {"image": ("image.png", image_bytes, "image/png")}
        data = {
            "seed": str(seed),
            "cfg_scale": str(cfg_scale),
            "motion_bucket_id": str(motion_bucket_id),
        }

        async with self._get_client(30.0) as client:
            response = await client.post(
                f"{self.endpoint}/image-to-video",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
                data=data,
            )
            response.raise_for_status()
            result = response.json()

        gen_id = result.get("id", "")
        if not gen_id:
            return {"error": "No generation ID returned"}

        return await self._poll_video_result(gen_id)

    async def generate_3d(self, image_bytes: bytes) -> dict:
        """Image-to-3D через Stable Fast 3D (~0.5s)."""
        files = {"image": ("image.png", image_bytes, "image/png")}

        async with self._get_client(30.0) as client:
            response = await client.post(
                f"{self.endpoint}/3d/stable-fast-3d",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/octet-stream",
                },
                files=files,
            )
            response.raise_for_status()

        return {
            "text": "3D model generated",
            "data": base64.b64encode(response.content).decode(),
            "format": "glb",
        }

    async def get_balance(self) -> float:
        """Проверить баланс кредитов."""
        async with self._get_client(10.0) as client:
            response = await client.get(
                "https://api.stability.ai/v1/user/balance",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            return response.json().get("credits", 0)

    async def _poll_result(self, path: str, max_attempts: int = 30, interval: float = 2.0) -> dict:
        """Поллинг async-результата."""
        import asyncio

        for _ in range(max_attempts):
            async with self._get_client(10.0) as client:
                response = await client.get(
                    f"{self.endpoint}{path}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Accept": "application/json",
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("image"):
                        return {"image_base64": data["image"], "format": "png", "text": "Upscaled (creative)"}
                elif response.status_code != 202:
                    return {"error": f"Poll failed: {response.status_code}"}
            await asyncio.sleep(interval)

        return {"error": "Timeout waiting for result"}

    async def _poll_video_result(self, gen_id: str, max_attempts: int = 60, interval: float = 3.0) -> dict:
        """Поллинг результата видео."""
        import asyncio

        for _ in range(max_attempts):
            async with self._get_client(10.0) as client:
                response = await client.get(
                    f"{self.endpoint}/image-to-video/result/{gen_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Accept": "video/*",
                    },
                )
                if response.status_code == 200:
                    video_b64 = base64.b64encode(response.content).decode()
                    return {"text": "Video generated", "video_base64": video_b64, "format": "mp4"}
                elif response.status_code != 202:
                    return {"error": f"Video poll failed: {response.status_code}"}
            await asyncio.sleep(interval)

        return {"error": "Timeout waiting for video"}

    async def test_connection(self, model: str = "sd3.5-large") -> bool:
        """Тест подключения — проверяем баланс."""
        try:
            balance = await self.get_balance()
            return balance > 0
        except Exception:
            return False
