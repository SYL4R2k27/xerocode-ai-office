# Провайдеры ИИ-моделей — Полный справочник

## ПЛАТНЫЕ ПРОВАЙДЕРЫ

### OpenAI
- **Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Auth:** `Authorization: Bearer sk-...`
- **Формат tools:** `tools[].function.parameters` + `strict: true`
- **Ответ tool_calls:** `message.tool_calls[].function.name/arguments`
- **Результат:** `{"role": "tool", "tool_call_id": "...", "content": "..."}`
- **Минимум:** $5 для Tier 1

| Модель | ID | Вход $/1M | Выход $/1M | Контекст | Tools |
|--------|---|-----------|-----------|----------|-------|
| GPT-4o | `gpt-4o` | $2.50 | $10.00 | 128K | Да |
| GPT-4o-mini | `gpt-4o-mini` | $0.15 | $0.60 | 128K | Да |
| GPT-4.1 | `gpt-4.1` | $2.00 | $8.00 | 1M | Да |
| GPT-4.1 mini | `gpt-4.1-mini` | $0.40 | $1.60 | 1M | Да |
| GPT-4.1 nano | `gpt-4.1-nano` | $0.10 | $0.40 | 1M | Да |
| o3 | `o3` | $2.00 | $8.00 | 200K | Да |
| o4-mini | `o4-mini` | $1.10 | $4.40 | 200K | Да |
| GPT-5 | `gpt-5` | $1.25 | $10.00 | — | Да |

**Rate limits:** Free=3 RPM, Tier1($5)=500 RPM, Tier2($50)=1000, Tier3($100)=5000

---

### Anthropic (Claude)
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Auth:** `x-api-key` + `anthropic-version: 2023-06-01`
- **Формат tools:** `tools[].input_schema` (НЕ parameters!)
- **Ответ:** `content[].type == "tool_use"`, `stop_reason: "tool_use"`
- **Результат:** `content[].type == "tool_result"` + `tool_use_id` + `is_error`
- **Минимум:** $5 для Tier 1

| Модель | ID | Вход $/1M | Выход $/1M | Контекст | Tools |
|--------|---|-----------|-----------|----------|-------|
| Claude Opus 4.6 | `claude-opus-4-6` | $5.00 | $25.00 | 1M | Да |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3.00 | $15.00 | 1M | Да |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 | 200K | Да |

**Rate limits:** Tier1=50 RPM, Tier2=1000, Tier3=2000, Tier4=4000

---

### Stability AI (изображения)
- **Endpoint:** `https://api.stability.ai/v2beta/stable-image/generate/sd3`
- **Auth:** `Authorization: Bearer sk-...`
- **Формат:** multipart/form-data (НЕ JSON)
- **Community License:** Бесплатно при revenue < $1M

| Модель | ~Цена/изображение |
|--------|-------------------|
| SD 3.5 Large | $0.065 |
| SD 3.5 Medium | $0.035 |
| Stable Image Ultra | $0.08 |

---

## БЕСПЛАТНЫЕ ПРОВАЙДЕРЫ

### Groq (OpenAI-совместимый)
- **Endpoint:** `https://api.groq.com/openai/v1`
- **Auth:** Бесплатный ключ, без карты → console.groq.com
- **OpenAI-совместимый:** Да

| Модель | ID | RPM | Tools |
|--------|---|-----|-------|
| Llama 3.3 70B | `llama-3.3-70b-versatile` | 30 | Да |
| Llama 3.1 8B | `llama-3.1-8b-instant` | 30 | Да |
| Llama 4 Scout | `llama-4-scout-17b-16e-instruct` | 30 | Да |
| Qwen QwQ 32B | `qwen-qwq-32b` | 60 | Да |

---

### Google Gemini
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta`
- **Auth:** Бесплатный ключ → aistudio.google.com/apikey
- **Формат:** Свой (functionDeclarations)

| Модель | ID | RPM | RPD |
|--------|---|-----|-----|
| Gemini 2.5 Pro | `gemini-2.5-pro` | 5 | 100 |
| Gemini 2.5 Flash | `gemini-2.5-flash` | 10 | 250 |
| Nano Banana | `gemini-2.5-flash-image` | — | 500/день |
| Nano Banana Pro | `gemini-3-pro-image-preview` | — | $0.134/img |

---

### OpenRouter (29 бесплатных моделей)
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Auth:** Бесплатный ключ → openrouter.ai/keys
- **OpenAI-совместимый:** Да
- **Лимит:** 20 RPM, 50-1000 req/день

Лучшие бесплатные:
- `deepseek/deepseek-chat-v3-0324:free`
- `qwen/qwen3-coder:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `openai/gpt-oss-120b:free`

---

### Cerebras
- **Endpoint:** `https://api.cerebras.ai/v1/chat/completions`
- **Auth:** Бесплатный ключ → cloud.cerebras.ai
- **Лимит:** 1M токенов/день
- **Скорость:** 2600 tok/sec

### SambaNova
- **Endpoint:** `https://api.sambanova.ai/v1/chat/completions`
- **Auth:** Бесплатный ключ → cloud.sambanova.ai
- **Модели:** Llama 3.1 405B (!), DeepSeek, GPT-OSS

### Mistral
- **Endpoint:** `https://api.mistral.ai/v1/chat/completions`
- **Auth:** Бесплатный ключ (верификация телефона)
- **Лимит:** 2 RPM (медленно)
- **Codestral** — лучший для кода
