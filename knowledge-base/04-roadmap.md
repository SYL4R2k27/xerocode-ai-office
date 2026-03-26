# Роадмап XeroCode AI Office

## Статус: 15 из 20 этапов завершены (75%)
## Последний деплой: 2026-03-26 — 32 711 строк кода (23 550 frontend + 9 161 backend)

---

## ═══════════════════════════════════════
## ФАЗА 1: ПЛАТФОРМА (завершена)
## ═══════════════════════════════════════

### ✅ Этап 1: MVP — Ядро платформы

**Бэкенд (FastAPI):**
- 13 API эндпоинтов: goals, tasks, agents, messages, orchestration, auth, files, pools, capabilities
- SQLAlchemy ORM + Alembic миграции + SQLite
- Модели данных: User, Goal, Task, Agent, Message

**Оркестрация:**
- Supervisor — мозг системы, 3 режима работы:
  - Manager — Supervisor распределяет задачи между агентами
  - Discussion — агенты обсуждают между собой, человек модерирует
  - Auto — полностью автономное выполнение
- Communication Bus — маршрутизация сообщений между агентами
- Task Parser — декомпозиция цели на подзадачи
- Loop Guard — защита от зацикливания (макс. 10 раундов)
- Cost Tracker — отслеживание расходов на API в реальном времени

**Реалтайм (WebSocket):**
- /ws/{goal_id} — 13 типов событий:
  - new_message, agent_status, task_update, goal_complete
  - thinking_start, thinking_end, tool_use, error
  - progress, cost_update, file_created, approval_request, system

**Деплой:**
- Yandex Cloud (Ubuntu 22.04)
- Nginx (фронтенд + /api/ reverse proxy + /ws/ WebSocket)
- Systemd сервис с автозапуском

---

### ✅ Этап 2: Chat-First интерфейс

**Дизайн-система:**
- Тёплая тёмная палитра (без кибер-неона)
- 30+ CSS переменных в theme.css (цвета, тени, радиусы)
- Провайдерные цвета: OpenAI=зелёный, Anthropic=бежевый, Groq=изумрудный

**3-панельная раскладка (десктоп):**
```
┌──────────┬──────────────────┬────────────┐
│ Sidebar  │     Чат          │  Контекст  │
│ 20%      │     55%          │  25%       │
│          │                  │            │
│ Цели     │ Сообщения агентов│ Задачи     │
│ Модели   │ Ввод пользователя│ Статусы    │
│ Прогресс │ Markdown+код     │ Расходы    │
└──────────┴──────────────────┴────────────┘
```

**19 компонентов:**
- Chat: ChatArea, ChatMessage, ChatInput, CodeBlock
- Sidebar: GoalSelector, ModelList, TaskProgress, CostMeter
- Context: ControlPanel, ActivityLog, TaskGraph
- Modals: ModelSetup, ProfileSettings, PricingPage
- Shared: StatusDot, Logo, ImageViewer, LoadingSkeleton
- Layout: TopBar, OfficeView

---

### ✅ Этап 3: Agent Runtime — инструменты для ИИ

**5 инструментов (tools):**
- write_file — Создать/перезаписать файл в workspace
- read_file — Прочитать содержимое файла
- run_command — Выполнить shell-команду (timeout 30s)
- list_files — Список файлов и папок в директории
- search_code — Поиск текста/паттерна по файлам проекта

**CodeExecutor:**
- Исполнение в /tmp sandbox (изоляция)
- Таймаут 30 секунд на команду
- Автоочистка временных файлов

**Tool Execution Loop:**
- Агент вызывает tool → получает результат → может вызвать снова
- До 10 раундов за одну задачу
- Автоостановка при зацикливании (Loop Guard)

**3 режима исполнения (runtime_mode):**
- text — только текстовый ответ (без инструментов)
- cloud — выполнение на сервере (через CodeExecutor)
- local — выполнение на ПК пользователя (через ai-office-agent)

---

### ✅ Этап 4: Новые адаптеры + Исследование

**7 провайдеров подключены:**

| Провайдер | Модели | Тип | Стоимость |
|-----------|--------|-----|-----------|
| OpenAI | GPT-5.4, GPT-5, GPT-4o, GPT-4.1, o3, o4-mini, DALL-E 3, Sora 2 | Текст + Изображения + Видео | Платный |
| Anthropic | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 | Текст | Платный |
| Groq | Llama 3.3 70B, Llama 3.1 8B | Текст | Бесплатно |
| Google Gemini | Gemini 2.5 Flash/Pro, Nano Banana 1/2/Pro | Текст + Изображения | Бесплатно |
| Stability AI | SD 3.5 Large/Medium/Turbo, Ultra, Core + edit/upscale/video/3D | Изображения + Видео + 3D | Кредиты |
| xAI | Grok 4, Grok 4.1 Fast, Grok Code Fast | Текст | Платный |
| Ollama | Любая локальная модель | Текст | Бесплатно |

**Адаптерная архитектура:**
```python
BaseAdapter (абстрактный)
├── OpenAIAdapter      → /v1/chat/completions
├── AnthropicAdapter   → /v1/messages
├── GroqAdapter        → extends OpenAI (другой endpoint)
├── GeminiAdapter      → Google AI API
├── StabilityAdapter   → /v2beta/* (multipart/form-data)
├── OllamaAdapter      → localhost:11434
└── CustomAdapter      → любой OpenAI-совместимый URL
```

**Ресёрч проведён:**
- 20+ конкурентов проанализировано (Cursor, Bolt, Replit Agent, v0, Devin)
- 30+ бесплатных моделей каталогизировано
- База знаний создана: 9 файлов в knowledge-base/

---

### ✅ Этап 5: EU Proxy — доступ к API из РФ

**Проблема:** OpenAI, Anthropic, xAI блокируют запросы из РФ.
**Решение:** прозрачный прокси через Европу.

**Схема:**
```
Пользователь (РФ) → Yandex Cloud (РФ) → Xray-core → HyNet VDS (Нидерланды) → OpenAI/Anthropic
```

- Xray-core (VLESS+REALITY) — не блокируется DPI
- HyNet VDS — Нидерланды, €3.5/мес
- SOCKS5 прокси на localhost:10808
- Все адаптеры автоматически маршрутизируют через прокси
- Systemd сервис с автозапуском
- Пользователю VPN не нужен — всё прозрачно

---

## ═══════════════════════════════════════
## ФАЗА 2: ПОДПИСКИ И МОДЕЛИ (завершена)
## ═══════════════════════════════════════

### ✅ Этап 6: Авторизация + Подписки

**Модель User:**
```
id, email, password_hash, name
plan: free | start | pro | pro_plus | ultima | corporate
is_admin: bool
trial_expires_at, trial_plan
tasks_used_this_month, images_generated_this_month
```

**JWT авторизация:**
- POST /auth/register → аккаунт + trial 14 дней
- POST /auth/login → JWT токен (exp 7 дней)
- GET /auth/me → профиль + динамические лимиты
- Middleware get_current_user на всех защищённых эндпоинтах

**6 тарифов с лимитами:**

| Параметр | Free | Pro | Pro Plus | Ultima | Corporate |
|----------|------|-----|----------|--------|-----------|
| Цена | 0₽ | 990₽/мес | 2490₽/мес | 4990₽/мес | от 15000₽ |
| Агенты | 3 | 10 | 15 | ∞ | ∞ |
| Задачи/мес | 50 | 500 | 2000 | ∞ | ∞ |
| Изображения/мес | 0 | 100 | 500 | ∞ | ∞ |
| Пулы | Нет | 6 | 11 | Все | Все + свои |
| Премиум-модели | Нет | Нет | 100K ток/день | ∞ | ∞ |
| Кастомные пулы | Нет | Нет | Да | Да | Да |

**Проверки (subscription.py):**
- check_subscription_limits(user, action) → raise 403
- check_can_create_agent(user, count) → bool
- check_pool_access(user, pool_id) → bool
- is_premium_model(model_name) → bool
- increment_task_usage(user, db)
- get_user_limits(user) → dict для фронтенда

---

### ✅ Этап 7: Пулы моделей — готовые команды ИИ

**14 готовых пулов:**

| ID | Название | Категория | Модели | Подписка |
|----|---------|-----------|--------|----------|
| flagship | Flagship Team | Код | GPT-5 + Claude Opus + Grok 4 | ultima |
| coding_start | Кодинг Старт | Код | Llama 3.3 + Llama 3.1 + Gemini Flash | pro |
| coding_pro | Кодинг Про | Код | Qwen3 Coder + DeepSeek V3 + Gemini Pro | pro_plus |
| coding_fullstack | Fullstack | Код | Claude Sonnet + GPT-4.1 + Grok Code + o4-mini | pro_plus |
| design_start | Дизайн Старт | Дизайн | Nano Banana + Llama 3.3 | pro |
| design_pro | Дизайн Про | Дизайн | SD 3.5 + Nano Banana Pro + Claude | ultima |
| research | Ресёрч | Ресёрч | Gemini Flash + Llama 3.3 | pro |
| research_deep | Deep Research | Ресёрч | Sonar Pro + Gemini Pro + DeepSeek R1 | ultima |
| copywriting | Копирайтинг | Тексты | Llama 3.3 + Gemini Flash | pro |
| data_analysis | Аналитика | Данные | Gemini Pro + Llama 3.3 | pro_plus |
| automation | Автоматизация | Другое | DeepSeek V3 + Gemini Flash + Llama 3.1 | pro_plus |
| solo_grok | Solo Grok | Одиночный | Grok 4.1 Fast | pro_plus |
| solo_deepseek | Solo DeepSeek | Одиночный | DeepSeek Chat V3.1 | pro |
| solo_fast | Solo Fast | Одиночный | Llama 3.1 8B (Groq) | pro |

**API:**
- GET /agents/pools/?tier=pro → список доступных пулов
- POST /agents/pools/{pool_id}/activate → создать агентов из шаблона

---

### ✅ Этап 8: Model Capabilities — карта умений

**50+ моделей с 22 типами capabilities:**
```
text, code, image_gen, image_edit, image_analysis, img2img
upscale, remove_bg, inpaint, outpaint, video_gen, 3d_gen
search, reasoning, function_calling, batch, style_presets
negative_prompt, seed_control, aspect_ratio, resolution, svg_output
```

**API:** GET /agents/models/capabilities?model=sd3.5-large
**Функции:**
- get_model_capabilities(model) → ["image_gen", "seed_control", ...]
- can_model_do(model, "image_gen") → True/False
- get_image_models() → список всех моделей для генерации
- get_models_for_capability("reasoning") → ["o3", "deepseek-r1", ...]

---

### ✅ Этап 9: Stability AI — полная интеграция

**StabilityAdapter — 15 операций:**

| Группа | Операции | Эндпоинты |
|--------|---------|-----------|
| Генерация | SD 3.5 Large, Medium, Turbo, Ultra, Core | /stable-image/generate/* |
| Редактирование | Inpaint, Outpaint, Remove BG, Search&Replace, Erase | /stable-image/edit/* |
| Улучшение | Upscale Conservative, Upscale Creative | /stable-image/upscale/* |
| Контроль | Sketch, Structure, Style Transfer | /stable-image/control/* |
| Видео | Image-to-Video (async poll, 60 попыток × 3с) | /image-to-video |
| 3D | Stable Fast 3D (GLB формат) | /3d/stable-fast-3d |

**Новые tools для агентов:**
- generate_image — текст → изображение (prompt, style, aspect_ratio, seed, batch)
- edit_image — inpaint, remove-bg, erase, search-replace, upscale
- transform_image — Img2Img (фото + prompt + strength 0.0-1.0)
- generate_video — изображение → MP4 видео (2-4 сек)

---

## ═══════════════════════════════════════
## ФАЗА 3: UI/UX (завершена)
## ═══════════════════════════════════════

### ✅ Этап 10: UI/UX Редизайн — IDE стиль

**Resizable панели:**
- react-resizable-panels v2.1.7 + ResizableHandle
- Sidebar: default 20%, min 12%, max 30%
- Chat: default 55% (flexes)
- Context: default 25%, min 12%, max 40%, collapsible
- Размеры сохраняются в localStorage
- Авто-коллапс sidebar/context на мобильных и планшетах

**Markdown в сообщениях:**
- react-markdown + remark-gfm (таблицы, чеклисты, зачёркивание)
- Подсветка кода: Prism + oneDark тема + JetBrains Mono шрифт
- Кнопка "Копировать" на каждом блоке кода
- Защита: скрипты, iframes, event handlers удаляются

**ImageViewer (fullscreen):**
- Клик по картинке → overlay с blur
- Zoom 0.5x — 3x (кнопки +/-)
- Скачивание, закрытие (Esc / клик по overlay)
- Анимация: motion fade + scale

**Keyboard shortcuts:**
- Ctrl+B → toggle sidebar
- Ctrl+J → toggle context panel
- Ctrl+N → новая цель
- Ctrl+/ → focus input
- Escape → закрыть модалку

---

### ✅ Этап 11: Мобильный UI — Telegram-стиль

**Детекция:** window.width < 768px → MobileLayout вместо 3-панельного

**5-tab навигация (BottomTabBar):**
```
[ 💬 Чат ] [ 🤖 Модели ] [ ➕ ] [ 📋 Задачи ] [ 👤 Профиль ]
```
- Центральная "+" — градиент purple→blue, поднята на -12px, shadow
- Активная вкладка — фиолетовый цвет + индикатор-линия сверху
- Backdrop-filter blur(24px), safe-area-inset-bottom

**MobileChatView:**
- Сообщения пользователя справа (синий пузырь, borderRadius 18px 4px 18px 18px)
- Сообщения агентов слева (тёмный фон + цветная полоска провайдера)
- Группировка: аватар только у первого сообщения в серии
- Long-press 500ms → контекстное меню (Копировать / Цитировать)
- MobileCodeBlock — горизонтальная прокрутка, шрифт 12px
- AgentStatusCompact — строка "💭 Agent думает / ⚙️ работает"
- Reply preview с цитатой + кнопка X
- Автоскролл на новые сообщения

**MobileModelsView:**
- Карточки агентов (аватар + имя + модель + статус)
- Свайп влево → красная кнопка "Удалить" (2-step: "Удалить" → "Точно?")
- Кнопки внизу: "Добавить" (синяя) + "Пулы" (серая)

**MobileTaskView:**
- Вертикальный таймлайн с линией слева
- Иконки: ✅ done, ⚡ in_progress, 🕐 pending, ❌ failed
- Нажатие → развёрнутые детали (описание + результат)
- Прогресс-бар для задач в работе (60% для in_progress, 20% для assigned)

**MobileProfileView:**
- Аватар 80px с градиентом (purple → blue) + первая буква имени
- Бейдж плана: Free (серый) / PRO (синий) / ULTIMA (фиолетовый+Crown)
- Trial: "X дней пробного" (жёлтый бейдж с pluralize)
- Прогресс-бар задач (X / limit, анимация от 0%)
- Меню из 6 пунктов + красная кнопка "Выйти"
- Staggered анимация появления (delay: index × 0.04)

---

### ✅ Этап 12: DesignPanel — контролы для дизайнеров

**Выезжающая панель при выборе "Дизайн":**
- maxHeight: 300px → 0px (transition 0.3s)
- Тёмный фон #141416, скролл внутри

| Контрол | Опции |
|---------|-------|
| Модель | SD 3.5 Large/Medium/Turbo, Ultra, Core, Nano Banana, Nano Banana Pro, FLUX Pro |
| Разрешение | 512, 768, 1024, 1536, 2048, 4K |
| Пропорции | 1:1, 16:9, 9:16, 4:3, 3:2, 4:5, 21:9 |
| Стиль | 20 пресетов: Фотореализм, Аниме, Акварель, Масло, 3D, Вектор, Лайн-арт, Скетч, Пиксель, Комикс, Кино, Фэнтези, Неон-панк, Изометрия, Low Poly, Диджитал, Плёнка, Оригами, Улучшение |
| Negative prompt | Текстовое поле (сворачиваемое) |
| Batch | x1, x2, x4, x8 |
| Seed | Случайный ↔ Зафиксированный + рандомизация |
| Формат | PNG, JPEG, WebP |
| Img2Img | Загрузка фото + ползунок силы 0.0-1.0 |

**Сериализация:** `[DESIGN:model=sd3.5-large,aspect=16:9,style=anime,batch=4]`

---

### ✅ Этап 13: 6 профильных панелей — контролы для каждого профиля

**Принцип:** выбрал категорию → снизу выехала панель с настройками. Панель остаётся после создания цели. Toggle-кнопка рядом с Send.

**💻 CodePanel (синий #3b82f6) — для программистов:**

| Контрол | Опции |
|---------|-------|
| Язык (12) | Python, TypeScript, JavaScript, Rust, Go, Java, C#, C++, Swift, Kotlin, PHP, Ruby |
| Фреймворк | Динамический по языку: TS→React/Next.js/Vue/NestJS/Angular/Svelte, Python→FastAPI/Django/Flask/PyTorch/LangChain, Rust→Actix/Axum/Tauri, Go→Gin/Fiber/Echo, и т.д. |
| Режим | Один файл / Весь проект / Монорепо |
| Вывод | Diff / Полный файл / Inline |
| Стиль кода | ESLint/Prettier/Biome (JS), Black/Ruff/PEP8 (Python), Rustfmt, Gofmt, и т.д. |
| Тесты | Vitest/Jest/Playwright/Cypress (JS), Pytest (Python), Cargo Test, Go Test, и т.д. |

→ `[CODE:lang=python,framework=fastapi,tests=pytest,scope=project]`

**🔬 ResearchPanel (бирюзовый #2dd4bf) — для ресёрчеров:**

| Контрол | Опции |
|---------|-------|
| Глубина | Быстрый / Стандартный / Глубокий |
| Источники | 5 / 10 / 25 / 50+ |
| Тип | Все / Академические / Новости / Патенты / Блоги |
| Период | Неделя / Месяц / Год / Всё время |
| Цитаты | APA / MLA / Chicago / ГОСТ / Harvard |
| Вывод | Сводка / Отчёт / Таблица / Презентация |
| Язык | RU / EN / Мультиязычный |

→ `[RESEARCH:depth=deep,sources=25,type=academic,citation=gost]`

**📝 TextPanel (янтарный #f59e0b) — для копирайтеров:**

| Контрол | Опции |
|---------|-------|
| Тон (6) | Профессиональный / Дружелюбный / Продающий / Экспертный / Юмористический / Формальный |
| Длина | Твит / Пост / Статья / Лонгрид |
| Аудитория | B2B / B2C / Подростки / Бизнес / Широкая |
| Платформа (7) | Блог / LinkedIn / Telegram / Email / Реклама / Instagram / YouTube |
| SEO | Текстовое поле для ключевых слов |
| Формат | Markdown / HTML / Plain text |
| Язык | RU / EN / Адаптация |

→ `[TEXT:tone=professional,length=article,platform=linkedin,seo=AI офис]`

**📊 DataPanel (изумрудный #10b981) — для аналитиков:**

| Контрол | Опции |
|---------|-------|
| Источник | CSV / Excel / JSON / SQL / Google Sheets / API |
| Код | Python / R / SQL |
| Графики (7) | Bar / Line / Scatter / Heatmap / Pie / Histogram / Treemap |
| Анализ (5) | Описательный / Предиктивный / Кластеризация / Регрессия / Временной ряд |
| Библиотека | Matplotlib / Plotly / Seaborn / Pandas (только для Python) |
| Вывод | Notebook / PDF / Dashboard / Код |

→ `[DATA:source=csv,chart=heatmap,analysis=clustering,code=python,lib=plotly]`

**📋 ManagementPanel (розовый #f43f5e) — для менеджеров:**

| Контрол | Опции |
|---------|-------|
| Формат | Executive summary / Детальный / Одностраничник / Презентация |
| Аудитория | Руководство / Команда / Клиент / Инвесторы |
| Шаблон (6) | Статус-отчёт / Ретро / Риски / Устав проекта / Спринт-обзор / KPI |
| Интеграции (6) | Jira / Trello / Notion / Slack / Linear / Asana |
| Период | За день / За неделю / За спринт / За месяц / За квартал |

→ `[MGMT:format=executive,audience=leadership,template=status,period=week]`

**🎓 EducationPanel (фиолетовый #8b5cf6) — для обучения:**

| Контрол | Опции |
|---------|-------|
| Уровень | Школа / Бакалавриат / Магистратура / PhD / Самообучение |
| Предмет (7) | Математика / Программирование / Физика / Языки / История / Биология / Экономика |
| Режим (5) | Объясни / Проверь меня / Сократ / Задачи / Конспект |
| Сложность | Ползунок 1-5 (Легко → Средне → Сложно) |

→ `[EDU:level=bachelor,subject=programming,mode=socratic,difficulty=4]`

**ChatInput обновлён:**
- 7 категорий: Код, Дизайн, Ресёрч, Текст, Данные, Менеджмент, Обучение
- Панель открывается автоматически при выборе категории
- Панель сохраняется после создания цели (не сбрасывается)
- Кнопка toggle рядом с Send — иконка категории с её цветом
- При отправке → параметры сериализуются и добавляются к сообщению

---

### ✅ Этап 14: Лендинг + Бренд

- Бренд: XeroCode (от "zero code")
- Лендинг с анимациями (motion/react)
- AuthPage: регистрация + вход (email + password)
- PricingPage: тарифы Free / Pro / Pro Plus / Ultima
- Legal: Terms of Service, Privacy Policy
- Beta badge на логотипе

---

## ═══════════════════════════════════════
## ЧТО НУЖНО ЗАДЕПЛОИТЬ (28 файлов)
## ═══════════════════════════════════════

### Новые файлы (A — 16 файлов, +5271 строк):

**7 панелей:**
- CodePanel.tsx (412 строк)
- DataPanel.tsx (470 строк)
- DesignPanel.tsx (699 строк)
- EducationPanel.tsx (328 строк)
- ManagementPanel.tsx (412 строк)
- ResearchPanel.tsx (280 строк)
- TextPanel.tsx (340 строк)

**6 мобильных компонентов:**
- MobileLayout.tsx (343 строки)
- MobileChatView.tsx (728 строк)
- MobileModelsView.tsx (214 строк)
- MobileTaskView.tsx (239 строк)
- MobileProfileView.tsx (244 строки)
- BottomTabBar.tsx (130 строк)

**Прочее:**
- useSwipe.ts (74 строки) — хук для свайп-жестов
- model_capabilities.py (158 строк) — карта capabilities 50+ моделей

### Изменённые файлы (M — 12 файлов, +972 строк backend):

**Frontend:**
- App.tsx — resizable панели, мобильный детект, localStorage
- ChatInput.tsx — 7 категорий, все панели подключены, сериализация
- AuthPage.tsx — обновления дизайна
- ModelSetup.tsx — расширенная форма добавления модели
- Logo.tsx — обновлённый логотип

**Backend:**
- stability_adapter.py — полный адаптер (generate/edit/upscale/video/3D) (+296 строк)
- supervisor.py — парсинг параметров панелей, design params (+417 строк)
- tools.py — generate_image, edit_image, transform_image, generate_video (+59 строк)
- model_pools.py — 14 пулов с ролями и моделями
- subscription.py — 6 тарифов, POOL_ACCESS
- agents.py — API pools, capabilities
- openai_adapter.py — max_completion_tokens fix для GPT-5+
- code_executor.py — улучшения sandbox

---

## ═══════════════════════════════════════
## ФАЗА 4: ЗАПУСК (следующая)
## ═══════════════════════════════════════

### ✅ Этап 15: Деплой (2026-03-26)

**Процесс деплоя:**
```
Локально: vite build → dist/ (3140 модулей, 480 KB gzip)
rsync dist/ → vladimir@server:/var/www/ai-office/     ← Nginx раздаёт
rsync backend/app/ → vladimir@server:~/ai-office/backend/app/  ← без .env, .venv, БД
sudo systemctl restart ai-office → gunicorn 5 workers
```

**Верификация:**
- Frontend: https://xerocode.space → 200 OK
- API auth: 401 "Not authenticated" (правильно без токена)
- API pools: 14 пулов возвращаются
- API capabilities: 50+ моделей, 22 типа capabilities
- Gunicorn: 5 worker-процессов, active
- MD5 хеши: 100% файлов сервер = локальная версия
- Git: коммит d105ae9 на GitHub (origin/main)

### 🔵 Этап 16: E2E тестирование
- Полный флоу: регистрация → модель → цель → оркестрация → результат
- Каждая из 7 панелей открывается и параметры передаются
- Мобильная версия на реальном устройстве
- Tool-calling: write_file, run_command
- WebSocket: сообщения приходят реалтайм
- Пулы: активация → агенты создаются
- Баг-фиксы по результатам

### 🔵 Этап 17: Lock-система (фичи по подпискам)
- FeatureLock компонент — 🔒 на недоступных фичах
- MobilePoolsView — экран пулов
- Динамические прогресс-бары из API (задачи/изображения/токены)
- Upgrade-баннеры при достижении лимитов
- Premium-бейджи на моделях
- Конструктор кастомных пулов (Pro Plus+)

### 🔵 Этап 18: Десктоп-клиент
- Доработать ai-office-agent (уже есть каркас)
- WebSocket подключение к серверу
- Исполнение задач на ПК пользователя
- Electron обёртка или CLI

---

## ═══════════════════════════════════════
## ФАЗА 5: БИЗНЕС (будущее)
## ═══════════════════════════════════════

### ⬜ Этап 19: Монетизация
- ЮKassa (РФ) + Stripe (зарубежные)
- Webhook: оплата → обновить plan в БД
- Recurring (автопродление), отмена, downgrade
- Наши API-ключи для PRO+ юзеров
- Ротация ключей при rate limit
- Промокоды, реферальная программа

### ⬜ Этап 20: Масштабирование
- PostgreSQL (миграция через Alembic)
- Redis (кеш, очереди)
- Docker Compose (backend + postgres + redis + nginx)
- CI/CD: GitHub Actions → build → test → deploy
- Docker Sandbox (изолированные контейнеры на задачу)
- Grafana + Sentry мониторинг
- Домен xerocode.ai + SSL + CDN

---

## БИЗНЕС-МОДЕЛЬ

### Тарифы

| Тариф | Цена | Агенты | Задачи/мес | Изображения | Пулы | Премиум |
|-------|------|--------|-----------|-------------|------|---------|
| Free | 0₽ | 3 (BYOK) | 50 | 0 | 0 | Нет |
| Pro | 990₽ | 10 | 500 | 100 | 6 | Нет |
| Pro Plus | 2490₽ | 15 | 2000 | 500 | 11 | 100K/день |
| Ultima | 4990₽ | ∞ | ∞ | ∞ | Все | ∞ |
| Corporate | 15000₽+ | ∞ | ∞ | ∞ | Все | Свой сервер |

### Расходы и окупаемость

| Статья | Сумма |
|--------|-------|
| Yandex Cloud | ~2500₽/мес |
| HyNet VDS (EU proxy) | ~500₽/мес |
| Бесплатные API | $0 |
| **Итого базовые** | **~3500₽/мес** |
| Премиум API на юзера | ~$20-50/мес |

- 4 PRO подписчика = покрытие базовых расходов
- 10 PRO = первая прибыль (~6500₽/мес)
- 3 Ultima + 10 Pro = ~25000₽/мес

### Тех. стек

**Backend:** FastAPI, SQLAlchemy, Alembic, 7 AI-адаптеров, 50+ моделей, 14 пулов, JWT, WebSocket, httpx+SOCKS5, Pydantic v2

**Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4, 50+ shadcn/radix компонентов, react-resizable-panels, motion 12, react-markdown, 7 панелей, мобильный UI

**Инфра:** Yandex Cloud, Nginx, Xray-core (EU proxy), HyNet VDS, GitHub, SQLite → PostgreSQL

---

## ═══════════════════════════════════════
## ПОЛНАЯ ИНВЕНТАРИЗАЦИЯ ПРОЕКТА
## ═══════════════════════════════════════

### Масштаб кода

| Категория | Строк кода |
|-----------|-----------|
| Frontend (TSX/TS) | 23 550 |
| Backend (Python) | 9 161 |
| **Итого** | **32 711** |

### Frontend: 75 компонентов

**7 профильных панелей (chat/):**
| Компонент | Строк | Для кого | Акцент |
|-----------|-------|----------|--------|
| CodePanel.tsx | 412 | Программисты | #3b82f6 синий |
| DesignPanel.tsx | 699 | Дизайнеры | #a855f7 фиолетовый |
| ResearchPanel.tsx | 280 | Ресёрчеры | #2dd4bf бирюзовый |
| TextPanel.tsx | 340 | Копирайтеры | #f59e0b янтарный |
| DataPanel.tsx | 470 | Аналитики | #10b981 изумрудный |
| ManagementPanel.tsx | 412 | Менеджеры | #f43f5e розовый |
| EducationPanel.tsx | 328 | Обучение | #8b5cf6 фиолетовый |

**6 мобильных компонентов (mobile/):**
| Компонент | Строк | Описание |
|-----------|-------|----------|
| MobileLayout.tsx | 343 | Детекция <768px, роутинг, safe area |
| MobileChatView.tsx | 728 | Пузыри, long-press, reply, автоскролл |
| MobileModelsView.tsx | 214 | Карточки агентов, свайп-удаление |
| MobileTaskView.tsx | 239 | Вертикальный таймлайн, прогресс |
| MobileProfileView.tsx | 244 | Аватар, бейдж, прогресс, меню |
| BottomTabBar.tsx | 130 | 5 табов, центральная "+", backdrop blur |

**Чат (chat/):**
- ChatArea.tsx — контейнер чата, скролл, сообщения
- ChatInput.tsx — ввод, 7 категорий, панели, сериализация
- ChatMessage.tsx — markdown, код, аватар провайдера
- CodeBlock.tsx — подсветка Prism, копирование
- AgentStatusBar.tsx — статус агента (думает/работает)
- ApprovalCard.tsx — карточка подтверждения действия

**Sidebar (sidebar/):**
- GoalSelector.tsx — список целей, создание новой
- ModelList.tsx — список моделей с провайдерами
- TaskProgress.tsx — прогресс задач
- CostMeter.tsx — расходы на API

**Модалки (modals/):**
- ModelSetup.tsx — добавление модели (провайдер, ключ, endpoint)
- ProfileSettings.tsx — настройки профиля
- PricingPage.tsx — тарифы Free/Pro/Pro+/Ultima
- OnboardingWizard.tsx — пошаговый онбординг
- PoolBuilder.tsx — конструктор кастомных пулов

**Shared:**
- ImageViewer.tsx — fullscreen, zoom, скачивание
- LoadingSkeleton.tsx — скелетоны загрузки
- Logo.tsx — логотип XeroCode
- StatusDot.tsx — индикатор статуса
- ProviderBadge.tsx — бейдж провайдера

**Layout:**
- Sidebar.tsx — левая панель
- ContextPanel.tsx — правая панель (задачи, статус)

**Landing/Auth/Legal:**
- LandingPage.tsx — лендинг с анимациями
- AuthPage.tsx — вход + регистрация
- TermsPage.tsx — пользовательское соглашение
- PrivacyPage.tsx — политика конфиденциальности

**Corporate (для корпоративных клиентов):**
- CorporateLayout.tsx, Dashboard.tsx, KanbanBoard.tsx
- TeamPage.tsx, BackgroundPicker.tsx

**Hooks:**
- useWebSocket.ts — подключение к /ws/{goal_id}
- useKeyboardShortcuts.ts — Ctrl+B/J/N, Escape
- useSwipe.ts — свайп-жесты для мобильных

**Store:**
- useStore.ts — Zustand: цели, агенты, сообщения, задачи
- useAuthStore.ts — JWT токен, пользователь, подписка

**50+ UI компонентов (shadcn/radix):**
- button, card, dialog, tabs, slider, input, select, badge, tooltip, accordion, sheet, drawer, popover, и т.д.

### Backend: 69 файлов Python

**8 адаптеров (adapters/):**
| Адаптер | API | Модели |
|---------|-----|--------|
| openai_adapter.py | /v1/chat/completions | GPT-5.4, GPT-5, GPT-4o, o3, o4-mini, DALL-E 3 |
| anthropic_adapter.py | /v1/messages | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| groq_adapter.py | Groq Cloud | Llama 3.3 70B, Llama 3.1 8B |
| gemini_adapter.py | Google AI | Gemini 2.5 Flash/Pro, Nano Banana 1/2/Pro |
| stability_adapter.py | /v2beta/* | SD 3.5 L/M/T, Ultra, Core + edit/upscale/video/3D |
| ollama_adapter.py | localhost:11434 | Любая локальная модель |
| openrouter_adapter.py | OpenRouter | 200+ моделей через единый API |
| custom_adapter.py | Любой URL | OpenAI-совместимый endpoint |

**Core (core/):**
| Модуль | Описание |
|--------|----------|
| model_capabilities.py | 50+ моделей, 22 типа capabilities, API |
| model_pools.py | 14 пулов, роли, подбор моделей |
| subscription.py | 6 тарифов, лимиты, POOL_ACCESS |
| model_router.py | Маршрутизация по capabilities |
| model_registry.py | Реестр провайдеров |
| config.py | Настройки (Pydantic Settings) |
| auth.py | JWT encode/decode, middleware |
| encryption.py | AES шифрование API-ключей |
| rate_limiter.py | Лимиты запросов |
| security_logger.py | Аудит безопасности |
| database.py | SQLAlchemy engine + session |

**Services (services/):**
| Сервис | Описание |
|--------|----------|
| supervisor.py | Мозг: 3 режима, парсинг панелей, оркестрация |
| tools.py | 9 tools: write/read/run/list/search + generate/edit/transform/video |
| code_executor.py | Sandbox /tmp, timeout 30s, автоочистка |
| communication_bus.py | Маршрутизация между агентами |
| loop_guard.py | Защита от зацикливания (10 раундов) |
| cost_tracker.py | Отслеживание расходов API |
| task_parser.py | Декомпозиция цели на задачи |
| auth.py | Регистрация, логин, JWT |

**API Routes (api/routes/) — 13 эндпоинтов:**
- auth.py — register, login, me
- goals.py — CRUD целей
- tasks.py — CRUD задач
- agents.py — CRUD агентов + pools + capabilities
- messages.py — история сообщений
- orchestration.py — запуск/остановка оркестрации
- files.py — загрузка файлов
- admin.py — админ-панель
- payments.py — платежи (заготовка)
- custom_pools.py — кастомные пулы
- organization.py — корпоративные аккаунты
- templates.py — шаблоны задач
- audit.py — лог аудита

**WebSocket:**
- websocket.py — /ws/{goal_id}, 13 типов событий

**Models (7 ORM моделей):**
- User, Goal, Task, Agent, Message, AuditLog, Organization, CustomPool, TaskTemplate, Memory

### Инфраструктура сервера

```
xerocode.space (Yandex Cloud, Ubuntu 22.04)
├── Nginx (HTTPS, Let's Encrypt, rate limiting, security headers)
│   ├── /           → /var/www/ai-office/ (статика)
│   ├── /api/       → 127.0.0.1:8000 (proxy)
│   └── /ws/        → 127.0.0.1:8000 (WebSocket upgrade)
├── Gunicorn + Uvicorn (5 workers, port 8000)
│   └── FastAPI app
├── Xray-core (VLESS+REALITY) → EU proxy
│   └── SOCKS5 localhost:10808 → HyNet VDS (Нидерланды)
├── Fail2ban (защита SSH + Nginx)
├── UFW (файрвол: 22, 80, 443)
├── Certbot (автообновление SSL)
└── Systemd: ai-office.service (автозапуск)
```
