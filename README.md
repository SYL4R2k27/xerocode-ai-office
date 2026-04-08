# XeroCode AI Office

> Ваша команда ИИ-агентов — объединяйте любые ИИ-модели в одну команду.

[![Лицензия](https://img.shields.io/badge/лицензия-Проприетарная-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev)
[![Сайт](https://img.shields.io/badge/сайт-xerocode.space-purple.svg)](https://xerocode.space)

## Что это?

Платформа-хаб, которая объединяет любые ИИ-модели в команду. Вы ставите цель — модели распределяют задачи по сильным сторонам, общаются между собой и доставляют результат. Вы наблюдаете и вмешиваетесь в любой момент.

### Ключевые возможности

- 🧠 **9 провайдеров**: OpenAI, Anthropic, Groq, Google Gemini, xAI Grok, Stability AI, OpenRouter, Ollama, Custom
- 🤖 **60+ моделей** доступно через OpenRouter (GPT-5, Claude Opus 4.6, Grok 4, Gemini Pro и др.)
- 🔄 **3 режима оркестрации**: Менеджер, Обсуждение, Авто
- ⚡ **Tool-calling**: модели пишут файлы, запускают код, генерируют изображения
- 🎨 **Генерация изображений**: Nano Banana / Nano Banana Pro
- 🏢 **Корпоративный режим**: Дашборд, Kanban, управление командой, аудит
- 🎯 **Фокус-режим**: переключение из корп. вида в чистый чат
- 📎 **Загрузка файлов**: drag & drop любых типов
- 📝 **Markdown + подсветка кода** в чате
- 🖼️ **Галерея изображений** с fullscreen просмотром
- 🔒 **Безопасность**: шифрование API-ключей, JWT + refresh tokens, rate limiting
- 🌍 **Работа из РФ** без VPN через VLESS-прокси
- 🎨 **Кастомизация фона** для корпоративных профилей (анимированные + статичные)

### Тарифы

| START | PRO | PRO PLUS | ULTIMA | CORPORATE |
|-------|-----|----------|--------|-----------|
| 290₽ разово | 1 990₽/мес | 5 490₽/мес | 19 990₽/мес | от 14 990₽/мес |
| 3 дня триал | 3 дня триал | 3 дня триал | — | — |

## Технологии

**Бэкенд:** FastAPI, PostgreSQL, SQLAlchemy, Gunicorn, WebSocket
**Фронтенд:** React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI
**Инфраструктура:** Nginx, Xray-core (VLESS), Fail2ban, UFW, Let's Encrypt

## Установка

```bash
# Бэкенд
cd backend
cp .env.example .env  # Заполните своими значениями
pip install -e .
uvicorn app.main:app --reload

# Фронтенд
cd "Enhance Office View Design"
npm install
npm run dev
```

## Структура проекта

```
├── backend/                 # FastAPI бэкенд
│   ├── app/
│   │   ├── adapters/        # 9 адаптеров ИИ-провайдеров
│   │   ├── api/routes/      # REST API эндпоинты
│   │   ├── core/            # Конфигурация, безопасность, подписки
│   │   ├── models/          # SQLAlchemy модели (10 таблиц)
│   │   ├── schemas/         # Pydantic схемы
│   │   └── services/        # Supervisor, Communication Bus, CodeExecutor
│   └── .env.example         # Шаблон переменных окружения
├── Enhance Office View Design/  # React фронтенд
│   └── src/app/
│       ├── components/      # 30+ компонентов (чат, sidebar, корпоратив)
│       ├── hooks/           # WebSocket, keyboard shortcuts
│       ├── store/           # Zustand-подобные хуки состояния
│       └── lib/             # API клиент
├── ai-office-agent/         # NPM пакет для локальной работы с файлами
├── knowledge-base/          # База знаний (провайдеры, модели, конкуренты)
├── LICENSE                  # Проприетарная лицензия
└── README.md
```

## Автор

**Владимир Тирских** — [xerocode.space](https://xerocode.space)

## Лицензия

Copyright (c) 2026 Vladimir Tirskikh. Все права защищены.
Подробнее в [LICENSE](LICENSE).
