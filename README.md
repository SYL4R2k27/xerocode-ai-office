# XeroCode AI Office

> Your AI Agent Team — orchestrate multiple AI models as a collaborative team.

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev)

## What is this?

A platform that unites any AI models into a team. You set a goal — models distribute tasks by strengths, communicate, and deliver results. You observe and intervene at any moment.

- **9 providers**: OpenAI, Anthropic, Groq, Google Gemini, xAI Grok, Stability AI, OpenRouter, Ollama, Custom
- **60+ models** available through OpenRouter
- **3 orchestration modes**: Manager, Discussion, Auto
- **Tool-calling**: models write files, run code, generate images
- **Image generation**: Nano Banana / Nano Banana Pro
- **Corporate**: Dashboard, Kanban, Team management, Audit log

## Tech Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Gunicorn, WebSocket
**Frontend:** React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI
**Infrastructure:** Nginx, Xray-core (VLESS), Fail2ban, UFW

## Setup

```bash
# Backend
cd backend
cp .env.example .env  # Edit with your values
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd "Enhance Office View Design"
npm install
npm run dev
```

## Author

**Vladimir Tirskikh** — [xerocode.space](https://xerocode.space)

## License

Copyright (c) 2026 Vladimir Tirskikh. All Rights Reserved.
See [LICENSE](LICENSE) for details.
