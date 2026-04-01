# Провайдеры XeroCode — Обновлено 01.04.2026

## Сводка: 283 рабочих модели через 7 провайдеров

| # | Провайдер | Ключ | Моделей | Прокси | Баланс |
|---|-----------|:----:|---------|:------:|--------|
| 1 | OpenAI | ✅ | 17 | Обязательно | Платный |
| 2 | Anthropic | ✅ | 5 | Обязательно | Платный |
| 3 | OpenRouter | ✅ | 234 | Частично | $23 |
| 4 | Groq | ✅ | 2 | Обязательно | Бесплатно |
| 5 | Cerebras | ✅ | 2 | Обязательно | Бесплатно |
| 6 | SambaNova | ✅ | 2 | Нет | Бесплатно |
| 7 | Stability AI | ✅ | 21 сервис | Нет | 865 кредитов |
| 8 | Together AI | ❌ | 0 | — | Ключ невалидный |
| 9 | APIyi | ❌ | 0 | — | Баланс 0 |

## OpenAI (17 моделей, через EU прокси)

**Текст:** gpt-5.4, gpt-5.4-mini, gpt-5.4-nano, gpt-5, gpt-5-mini, gpt-5-nano, gpt-5.2, gpt-5.1, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano
**Reasoning:** o3, o3-mini, o4-mini (требуют max_completion_tokens)
**Images:** dall-e-2
**Не работают:** gpt-5.4-pro (не chat API), codex модели (404)

## Anthropic (5 моделей, через EU прокси)

claude-opus-4-6, claude-sonnet-4-6, claude-sonnet-4-5-20250929, claude-opus-4-5-20251101, claude-haiku-4-5-20251001
**Важно:** Model ID без даты для новых: "claude-opus-4-6" не "claude-opus-4-6-20250918"

## OpenRouter (234 модели, $23 баланс)

**Ключевые:** llama-4-maverick, deepseek-v3, qwen3-coder, grok-4, sonar-pro, mistral-large, codestral, command-a, kimi-k2.5
**Free:** nemotron-3-nano:free, nemotron-nano-9b:free
**Заблокированы:** openai/*, anthropic/*, google/* на OR (403) — для них прямые ключи

## Groq (2, бесплатно, через прокси)

llama-3.3-70b-versatile, llama-3.1-8b-instant. Заблокирован по региону РФ.

## Cerebras (2, бесплатно, через прокси)

llama3.1-8b, qwen-3-235b-a22b-instruct-2507. Заблокирован по региону РФ.

## SambaNova (2, бесплатно, прямой)

Meta-Llama-3.3-70B-Instruct, Meta-Llama-3.1-8B-Instruct.

## Stability AI (21 сервис, 865 кредитов)

**Generate:** Ultra(8кр), SD 3.5 Large(6.5)/Turbo(4)/Medium(3.5)/Flash(2.5), Core(3), SDXL(0.9)
**Upscale:** Creative(60), Conservative(40), Fast(2)
**Edit:** Erase(5), Inpaint(5), Outpaint(4), Remove BG(5), Search&Replace(5), Recolor(5), BG+Relight(8)
**Control:** Structure(5), Sketch(5), Style Guide(5), Style Transfer(8)

## EU Proxy

Xray-core (VLESS+REALITY) → HyNet VDS Нидерланды, socks5://127.0.0.1:10808
Обязателен: OpenAI, Anthropic, Groq, Cerebras
Опционален: OpenRouter (для cohere и других забаненных)
