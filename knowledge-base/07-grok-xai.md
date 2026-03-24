# Grok by xAI — Справочник

## API
- **Endpoint:** `https://api.x.ai/v1`
- **Auth:** `Authorization: Bearer xai-...`
- **OpenAI-совместимый:** ДА (полностью, можно использовать OpenAI SDK)
- **Free credits:** $25 при регистрации + $150/мес через Data Sharing Program

## Модели

| Модель | ID | Вход $/1M | Выход $/1M | Контекст | Tools |
|--------|---|-----------|-----------|----------|-------|
| Grok 4 | `grok-4-0709` | $3.00 | $15.00 | Large | Да |
| Grok 4.1 Fast | `grok-4-1-fast-reasoning` | $0.20 | $0.50 | 2M | Да |
| Grok 4.1 Fast (no reason) | `grok-4-1-fast-non-reasoning` | $0.20 | $0.50 | 2M | Да |
| Grok 3 Beta | `grok-3-beta` | $3.00 | $15.00 | 131K | Да |
| Grok 3 Mini | `grok-3-mini-beta` | Дешевле | Дешевле | 131K | Да |
| Grok Code Fast | `grok-code-fast-1` | — | — | Large | Да |

## Генерация изображений (Aurora)
- `grok-2-image-1212` — text-to-image
- `grok-imagine-image` — новый text-to-image
- `grok-imagine` — image-to-video

## Сильные стороны
- 2M контекст (самый большой среди frontier)
- Реалтайм данные из X/Twitter
- Встроенный веб-поиск
- $0.20/1M вход — дешевле GPT-4o-mini
- Хорош для кода (75% SWE-bench)

## Доступность из РФ: ЗАБЛОКИРОВАН
