"""
Определения инструментов для Agent Runtime.
Формат: OpenAI function-calling (канонический).
Каждый адаптер конвертирует под свой API.
"""
from __future__ import annotations

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Создать или перезаписать файл. Путь относительно /workspace/.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Путь к файлу (например: src/main.py)",
                    },
                    "content": {
                        "type": "string",
                        "description": "Содержимое файла",
                    },
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Прочитать содержимое файла.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Путь к файлу (например: src/main.py)",
                    },
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Выполнить shell-команду в терминале. Таймаут 30 секунд.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Команда для выполнения (например: python main.py)",
                    },
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "Получить список файлов и папок в директории.",
            "parameters": {
                "type": "object",
                "properties": {
                    "directory": {
                        "type": "string",
                        "description": "Путь к директории (по умолчанию: корень workspace)",
                        "default": ".",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_code",
            "description": "Поиск текста или паттерна по файлам проекта.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Строка или regex для поиска",
                    },
                    "path": {
                        "type": "string",
                        "description": "Директория для поиска (по умолчанию: всё)",
                        "default": ".",
                    },
                },
                "required": ["query"],
            },
        },
    },
]


IMAGE_TOOL = {
    "type": "function",
    "function": {
        "name": "generate_image",
        "description": "Сгенерировать изображение по текстовому описанию. Результат — base64 PNG.",
        "parameters": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "Описание изображения на английском (детальное, для AI генератора)",
                },
                "style": {
                    "type": "string",
                    "description": "Стиль: photorealistic, illustration, 3d_render, sketch, minimalist",
                    "default": "photorealistic",
                },
            },
            "required": ["prompt"],
        },
    },
}


EDIT_IMAGE_TOOL = {
    "type": "function",
    "function": {
        "name": "edit_image",
        "description": "Редактировать изображение: inpaint, remove-background, erase, search-and-replace, upscale.",
        "parameters": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Путь к исходному изображению в workspace"},
                "operation": {
                    "type": "string",
                    "description": "Операция: inpaint, remove-background, erase, search-and-replace, upscale-conservative, upscale-creative",
                },
                "prompt": {"type": "string", "description": "Описание результата (для inpaint/search-replace)"},
                "search_prompt": {"type": "string", "description": "Что заменить (для search-and-replace)"},
            },
            "required": ["image_path", "operation"],
        },
    },
}

TRANSFORM_IMAGE_TOOL = {
    "type": "function",
    "function": {
        "name": "transform_image",
        "description": "Трансформировать изображение (Img2Img). Загрузить фото и создать новое на его основе.",
        "parameters": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Путь к исходному изображению"},
                "prompt": {"type": "string", "description": "Описание желаемого результата"},
                "strength": {"type": "number", "description": "Сила трансформации 0.0-1.0 (0=минимум, 1=полная перегенерация)", "default": 0.7},
                "style": {"type": "string", "description": "Стиль: photorealistic, anime, illustration", "default": "photorealistic"},
            },
            "required": ["image_path", "prompt"],
        },
    },
}

GENERATE_VIDEO_TOOL = {
    "type": "function",
    "function": {
        "name": "generate_video",
        "description": "Создать видео из изображения (Image-to-Video). Результат — MP4 2-4 секунды.",
        "parameters": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Путь к исходному изображению"},
            },
            "required": ["image_path"],
        },
    },
}


def get_tools_for_task(task_type: str | None = None) -> list[dict]:
    """Вернуть набор инструментов для задачи."""
    tools = list(AGENT_TOOLS)
    if task_type in ("design", "image", "image processing", None):
        tools.append(IMAGE_TOOL)
        tools.append(EDIT_IMAGE_TOOL)
        tools.append(TRANSFORM_IMAGE_TOOL)
        tools.append(GENERATE_VIDEO_TOOL)
    return tools
