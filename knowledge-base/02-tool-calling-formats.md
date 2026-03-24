# Tool Calling — Форматы по провайдерам

## OpenAI / Groq / Custom / OpenRouter / Cerebras / SambaNova (один формат)

### Запрос:
```json
{
  "tools": [{
    "type": "function",
    "function": {
      "name": "write_file",
      "description": "Создать файл",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "content": {"type": "string"}
        },
        "required": ["path", "content"]
      }
    }
  }],
  "tool_choice": "auto"
}
```

### Ответ модели:
```json
{
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [{
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "write_file",
        "arguments": "{\"path\": \"main.py\", \"content\": \"print('hello')\"}"
      }
    }]
  }
}
```

### Отправка результата:
```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "File written: main.py (15 bytes)"
}
```

---

## Anthropic (Claude) — ДРУГОЙ ФОРМАТ

### Запрос:
```json
{
  "tools": [{
    "name": "write_file",
    "description": "Создать файл",
    "input_schema": {
      "type": "object",
      "properties": {
        "path": {"type": "string"},
        "content": {"type": "string"}
      },
      "required": ["path", "content"]
    }
  }]
}
```

### Ответ модели:
```json
{
  "stop_reason": "tool_use",
  "content": [
    {"type": "text", "text": "Создаю файл..."},
    {
      "type": "tool_use",
      "id": "toolu_01A09q90",
      "name": "write_file",
      "input": {"path": "main.py", "content": "print('hello')"}
    }
  ]
}
```

### Отправка результата:
```json
{
  "role": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "toolu_01A09q90",
    "content": "File written: main.py (15 bytes)"
  }]
}
```

---

## Google Gemini — ТРЕТИЙ ФОРМАТ

### Запрос:
```json
{
  "tools": [{
    "functionDeclarations": [{
      "name": "write_file",
      "description": "Создать файл",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "content": {"type": "string"}
        },
        "required": ["path", "content"]
      }
    }]
  }]
}
```

### Ответ модели:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "functionCall": {
          "name": "write_file",
          "args": {"path": "main.py", "content": "print('hello')"}
        }
      }]
    }
  }]
}
```

### Отправка результата:
```json
{
  "role": "user",
  "parts": [{
    "functionResponse": {
      "name": "write_file",
      "response": {"result": "File written: main.py (15 bytes)"}
    }
  }]
}
```

---

## Конвертация в нашей платформе

Наша платформа хранит tools в **OpenAI формате** (канонический).
Каждый адаптер конвертирует при отправке:

- OpenAI/Groq/Custom → отправляет как есть
- Anthropic → `parameters` → `input_schema`, убирает `type: "function"` обёртку
- Gemini → `parameters` оставляет, оборачивает в `functionDeclarations`

Парсинг ответов тоже разный:
- OpenAI → `message.tool_calls[].function`
- Anthropic → `content[].type == "tool_use"`
- Gemini → `parts[].functionCall`
