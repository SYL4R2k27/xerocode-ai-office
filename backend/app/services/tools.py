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


def get_tools_for_task(task_type: str | None = None) -> list[dict]:
    """Вернуть набор инструментов для задачи."""
    tools = list(AGENT_TOOLS)
    # Добавить генерацию изображений для дизайн-задач
    if task_type in ("design", "image", "image processing", None):
        tools.append(IMAGE_TOOL)
    return tools
