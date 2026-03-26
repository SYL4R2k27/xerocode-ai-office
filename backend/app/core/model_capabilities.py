"""
Capabilities каждой модели — что умеет, что нет.
UI использует для показа доступных функций и предупреждений.
"""
from __future__ import annotations

# Capability types
CAPS = {
    "text": "Текст",
    "code": "Код",
    "image_gen": "Генерация изображений",
    "image_edit": "Редактирование изображений",
    "image_analysis": "Анализ изображений (Vision)",
    "img2img": "Image-to-Image",
    "upscale": "Увеличение разрешения",
    "remove_bg": "Удаление фона",
    "inpaint": "Inpainting",
    "outpaint": "Outpainting",
    "video_gen": "Генерация видео",
    "3d_gen": "Генерация 3D",
    "search": "Поиск в интернете",
    "reasoning": "Reasoning (chain-of-thought)",
    "function_calling": "Tool-calling",
    "batch": "Batch генерация",
    "style_presets": "Стиль-пресеты",
    "negative_prompt": "Негативный промпт",
    "seed_control": "Контроль seed",
    "aspect_ratio": "Выбор формата",
    "resolution": "Выбор разрешения",
    "svg_output": "SVG/Вектор",
}

# Capabilities по моделям
MODEL_CAPS: dict[str, list[str]] = {
    # ============ Stability AI ============
    "sd3.5-large": ["image_gen", "negative_prompt", "seed_control", "aspect_ratio", "style_presets", "batch", "resolution"],
    "sd3.5-medium": ["image_gen", "negative_prompt", "seed_control", "aspect_ratio", "batch", "resolution"],
    "sd3.5-large-turbo": ["image_gen", "negative_prompt", "seed_control", "aspect_ratio", "batch", "resolution"],
    "stable-image-ultra": ["image_gen", "negative_prompt", "seed_control", "aspect_ratio", "resolution"],
    "stable-image-core": ["image_gen", "style_presets", "seed_control", "aspect_ratio", "resolution"],
    "inpaint": ["image_edit", "inpaint"],
    "outpaint": ["image_edit", "outpaint"],
    "remove-background": ["remove_bg"],
    "search-and-replace": ["image_edit", "img2img"],
    "erase": ["image_edit"],
    "upscale-conservative": ["upscale"],
    "upscale-creative": ["upscale"],
    "control-sketch": ["img2img", "image_gen"],
    "control-structure": ["img2img", "image_gen"],
    "style-transfer": ["img2img", "image_gen"],
    "image-to-video": ["video_gen"],
    "stable-fast-3d": ["3d_gen"],

    # ============ OpenAI ============
    "gpt-5.4": ["text", "code", "reasoning", "function_calling", "image_analysis"],
    "gpt-5.4-pro": ["text", "code", "reasoning"],
    "gpt-5": ["text", "code", "reasoning", "function_calling", "image_analysis"],
    "gpt-5-nano": ["text", "code", "function_calling"],
    "gpt-4o": ["text", "code", "function_calling", "image_analysis"],
    "gpt-4.1": ["text", "code", "function_calling"],
    "gpt-4.1-nano": ["text", "code", "function_calling"],
    "gpt-4o-mini": ["text", "code", "function_calling"],
    "o3": ["text", "code", "reasoning"],
    "o4-mini": ["text", "code", "reasoning"],
    "gpt-image-1.5": ["image_gen", "image_edit", "resolution"],
    "gpt-image-1": ["image_gen", "image_edit"],
    "dall-e-3": ["image_gen", "resolution"],
    "sora-2": ["video_gen"],
    "sora-2-pro": ["video_gen"],

    # ============ Anthropic ============
    "claude-opus-4-6": ["text", "code", "reasoning", "function_calling", "image_analysis"],
    "claude-sonnet-4-6": ["text", "code", "function_calling", "image_analysis"],
    "claude-haiku-4-5": ["text", "code", "function_calling", "image_analysis"],

    # ============ Google/Nano Banana ============
    "nano-banana": ["image_gen", "text", "aspect_ratio"],
    "nano-banana-2": ["image_gen", "text", "aspect_ratio", "resolution"],
    "nano-banana-pro": ["image_gen", "text", "aspect_ratio", "resolution", "image_analysis"],
    "gemini-2.5-flash": ["text", "code", "function_calling", "image_analysis"],
    "gemini-2.5-pro": ["text", "code", "reasoning", "function_calling", "image_analysis"],

    # ============ xAI Grok ============
    "grok-4": ["text", "code", "reasoning", "function_calling", "image_analysis", "search"],
    "grok-4.1-fast": ["text", "code", "function_calling"],
    "grok-code-fast-1": ["text", "code", "function_calling"],
    "grok-3": ["text", "code", "function_calling"],
    "grok-2-image": ["image_gen"],

    # ============ DeepSeek ============
    "deepseek-r1": ["text", "code", "reasoning"],
    "deepseek-r1-0528": ["text", "code", "reasoning"],
    "deepseek-chat": ["text", "code", "function_calling"],
    "deepseek-chat-v3.1": ["text", "code", "function_calling"],

    # ============ Qwen ============
    "qwen3-coder": ["text", "code", "function_calling"],
    "qwen-max": ["text", "code", "reasoning", "function_calling"],
    "qwen3-235b-a22b": ["text", "code", "reasoning"],

    # ============ Meta Llama ============
    "llama-4-maverick": ["text", "code", "image_analysis", "function_calling"],
    "llama-3.3-70b": ["text", "code", "function_calling"],
    "llama-3.1-8b": ["text", "code"],

    # ============ Mistral ============
    "codestral-2508": ["text", "code", "function_calling"],
    "mistral-large-2411": ["text", "code", "function_calling", "image_analysis"],
    "devstral-medium": ["text", "code"],

    # ============ FLUX (через APIyi) ============
    "flux-2-pro": ["image_gen", "resolution", "aspect_ratio", "seed_control"],
    "flux-2-max": ["image_gen", "resolution", "aspect_ratio"],
    "flux-kontext-pro": ["img2img", "image_gen"],

    # ============ Perplexity ============
    "sonar-pro-search": ["text", "search"],
    "sonar-pro": ["text", "search"],
    "sonar-deep-research": ["text", "search", "reasoning"],

    # ============ Groq (бесплатные) ============
    "llama-3.3-70b-versatile": ["text", "code", "function_calling"],
    "llama-3.1-8b-instant": ["text", "code"],
}


def get_model_capabilities(model_name: str) -> list[str]:
    """Получить capabilities модели."""
    clean = model_name.split("/")[-1] if "/" in model_name else model_name
    # Точное совпадение
    if clean in MODEL_CAPS:
        return MODEL_CAPS[clean]
    # Частичное совпадение
    for key, caps in MODEL_CAPS.items():
        if key in clean.lower() or clean.lower().startswith(key):
            return caps
    # Дефолт — текстовая модель
    return ["text"]


def can_model_do(model_name: str, capability: str) -> bool:
    """Проверить умеет ли модель конкретную задачу."""
    return capability in get_model_capabilities(model_name)


def get_image_models() -> list[str]:
    """Все модели умеющие генерировать изображения."""
    return [m for m, caps in MODEL_CAPS.items() if "image_gen" in caps]


def get_video_models() -> list[str]:
    """Все модели умеющие генерировать видео."""
    return [m for m, caps in MODEL_CAPS.items() if "video_gen" in caps]


def get_models_for_capability(capability: str) -> list[str]:
    """Все модели с данной capability."""
    return [m for m, caps in MODEL_CAPS.items() if capability in caps]
