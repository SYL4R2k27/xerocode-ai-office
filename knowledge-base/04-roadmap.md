# Роадмап ИИ Офис

## Статус: 5 из 10 этапов завершены (50%)

### ✅ Этап 1: MVP — Ядро платформы
- FastAPI бэкенд, 13 API эндпоинтов
- 4 базовых адаптера: OpenAI, Anthropic, Ollama, Custom
- Supervisor (3 режима: manager/discussion/auto)
- Communication Bus, Task Parser, Loop Guard, Cost Tracker
- WebSocket реалтайм (13 типов событий), SQLite
- Деплой на Yandex Cloud (YOUR_SERVER_IP)

### ✅ Этап 2: Chat-First интерфейс
- Полный редизайн (тёплая палитра, без неона)
- 3-панельная раскладка: Sidebar + Чат + Контекст
- 19 новых компонентов (chat, sidebar, context, modals, shared)
- Nginx proxy (API + WebSocket)
- Продакшн билд на сервере

### ✅ Этап 3: Agent Runtime
- Tool-calling во всех адаптерах (ToolCall, AIResponse расширен)
- 5 инструментов: write_file, read_file, run_command, list_files, search_code
- CodeExecutor (исполнение в /tmp sandbox)
- Tool execution loop (до 10 раундов)
- runtime_mode: text / cloud / local

### ✅ Этап 4: Новые адаптеры + Исследование
- Groq (Llama 3.3 70B, Mixtral — бесплатно)
- Google Gemini (Flash, Pro, Nano Banana — бесплатно)
- Stability AI (Stable Diffusion 3.5 — изображения)
- Grok xAI (исследован, адаптер через Custom)
- Итого 7 провайдеров + совместимость с 10+ через Custom
- Полный ресёрч: 20+ конкурентов, 30+ бесплатных моделей
- База знаний (9 файлов в knowledge-base/)

### ✅ Этап 5: EU Proxy — доступ к API из РФ
- Xray-core (VLESS+REALITY) установлен на Yandex Cloud
- Подключение через HyNet VDS (Нидерланды, 195.189.96.224)
- SOCKS5 прокси на localhost:10808
- Все 7 адаптеров маршрутизируют через прокси
- Проверено: OpenAI ✅, Anthropic ✅, Groq ✅
- Пользователю не нужен VPN — всё прозрачно
- Systemd сервис с автозапуском

---

### 🔵 Этап 6: Первый E2E тест (СЛЕДУЮЩИЙ)
- Получить Groq API ключ (бесплатно)
- Подключить модель через интерфейс
- Создать цель → оркестрация → результат
- Проверить tool-calling (write_file, run_command)
- Исправить баги по результатам теста

### 🔵 Этап 7: Авторизация + Личный кабинет
- Модель User (email, password_hash, plan)
- JWT авторизация (регистрация, вход, middleware)
- Личный кабинет (профиль, история, расходы)
- Привязка агентов и целей к user_id
- Лимиты по тарифу

### 🔵 Этап 8: Пулы моделей + Онбординг
- 5 категорий пулов: Код, Дизайн, Ресёрч, Тексты, Данные
- 2 уровня: Старт (бесплатные) + Премиум (платные)
- Конструктор индивидуальных пулов
- Визард первого запуска, подсказки
- Демо-режим без API-ключей

### 🔵 Этап 9: Десктоп-клиент
- WebSocket /ws/agent/{goal_id} для локального агента
- NPM пакет ai-office-agent
- Electron обёртка (Mac/Win/Linux)
- Доступ к файлам и терминалу пользователя

### ⬜ Этап 10: Монетизация
- Free (0₽) / Pro (990₽/мес) / Business (2990₽/мес)
- Оплата: ЮKassa / Stripe
- Наши API-ключи для PRO/BUSINESS пользователей

### ⬜ Этап 11: Docker Sandbox
- Изолированные контейнеры на задачу
- Python + Node.js в sandbox
- Превью веб-проектов через iframe

### ⬜ Этап 12: Масштабирование
- PostgreSQL (миграция с SQLite)
- Шифрование API-ключей (AES-256)
- Docker Compose + CI/CD
- Мониторинг (Grafana)
- Домен + SSL + бренд

---

## Бизнес-модель

| Тариф | Цена | Что включено |
|-------|------|-------------|
| Free | 0₽ | Свои модели (до 3), 50 задач/мес |
| Pro | 990₽/мес | 10 агентов, ~30 бесплатных моделей, 500 задач, готовые пулы |
| Business | 2990₽/мес | Без лимитов, премиум (GPT-4o, Claude, Grok), Docker sandbox |

## Расходы на содержание
- Yandex Cloud: ~2500₽/мес
- HyNet VDS (EU proxy): ~500₽/мес
- Бесплатные API (Groq, Gemini, OpenRouter): $0
- Премиум API (BUSINESS): ~$20-50/мес
- **Итого: ~3500-6500₽/мес**
- **Окупаемость: 4-7 PRO подписчиков**

## Инфраструктура
- Сервер: Yandex Cloud (YOUR_SERVER_IP), Ubuntu 22.04
- EU Proxy: HyNet VLESS+REALITY → Нидерланды (195.189.96.224)
- Xray-core: SOCKS5 на localhost:10808, systemd
- Nginx: фронтенд + /api/ + /ws/
- SQLite (dev), PostgreSQL (prod — будущее)
