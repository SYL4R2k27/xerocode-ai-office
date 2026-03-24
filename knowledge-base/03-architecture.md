# Архитектура ИИ Офис

## Стек технологий

### Бэкенд
- Python 3.9+ (FastAPI)
- SQLAlchemy async + SQLite (dev) / PostgreSQL (prod)
- WebSocket (реалтайм)
- httpx (HTTP клиент для API)

### Фронтенд
- React 18 + TypeScript + Vite
- Tailwind CSS 4
- Framer Motion (анимации)
- Lucide React (иконки)
- Radix UI (примитивы)

### Инфраструктура
- Yandex Cloud (сервер YOUR_SERVER_IP)
- Nginx (reverse proxy)
- Systemd (сервис)
- Ubuntu 22.04

---

## Структура проекта

```
backend/
├── app/
│   ├── main.py                    # FastAPI entry point
│   ├── core/
│   │   ├── config.py              # Settings
│   │   ├── database.py            # SQLAlchemy engine
│   │   └── db_types.py            # Universal types (SQLite/PG)
│   ├── adapters/
│   │   ├── base.py                # BaseAdapter, AIResponse, ToolCall
│   │   ├── openai_adapter.py      # OpenAI + tool_calls
│   │   ├── anthropic_adapter.py   # Claude + tool_use blocks
│   │   ├── groq_adapter.py        # Groq (OpenAI-compatible)
│   │   ├── gemini_adapter.py      # Google Gemini + Nano Banana
│   │   ├── stability_adapter.py   # Stable Diffusion (images)
│   │   ├── ollama_adapter.py      # Local models
│   │   ├── custom_adapter.py      # Any OpenAI-compatible
│   │   └── __init__.py            # Factory: get_adapter()
│   ├── models/
│   │   ├── agent.py               # Agent (provider, api_key, skills)
│   │   ├── goal.py                # Goal (title, mode, runtime_mode)
│   │   ├── task.py                # Task (DAG, result, result_files)
│   │   ├── message.py             # Message (sender, content, cost)
│   │   └── memory.py              # Memory (context, decisions)
│   ├── schemas/                   # Pydantic schemas for API
│   ├── services/
│   │   ├── supervisor.py          # Brain: decomposition → execution
│   │   ├── communication_bus.py   # Relay + tool execution loop
│   │   ├── task_parser.py         # Text → Task objects
│   │   ├── loop_guard.py          # Anti-loop protection
│   │   ├── cost_tracker.py        # Cost tracking
│   │   ├── tools.py               # 5 tool definitions
│   │   └── code_executor.py       # File/command execution
│   └── api/
│       ├── routes/                # REST endpoints
│       └── websocket.py           # WebSocket manager
│
frontend/  (Enhance Office View Design/)
├── src/app/
│   ├── App.tsx                    # Root layout
│   ├── lib/api.ts                 # API client
│   ├── hooks/useWebSocket.ts      # WebSocket hook
│   ├── store/useStore.ts          # State management
│   └── components/
│       ├── layout/                # AppShell, Sidebar, ContextPanel
│       ├── chat/                  # ChatArea, ChatMessage, ChatInput
│       ├── sidebar/               # ModelList, TaskProgress, CostMeter
│       ├── context/               # TaskRoadmap, PreviewPane, ActivityFeed
│       ├── modals/                # ModelSetup
│       └── shared/                # StatusDot, ProviderBadge
```

---

## Ключевые потоки данных

### Создание цели и запуск
```
POST /api/goals/ → Goal создана
POST /api/orchestration/start/{id} → Supervisor.start_goal()
  → _mode_manager/_discussion/_auto → декомпозиция
  → TaskParser → Task объекты в БД
  → _execute_tasks() → send_to_agent() с tools
  → Tool loop (write_file, run_command...)
  → Результат в Task.result
  → WebSocket уведомления на каждом шаге
```

### Вмешательство пользователя
```
POST /api/orchestration/user-input
  → Supervisor.process_user_input()
  → broadcast_to_team() → все модели видят
  → TaskParser извлекает новые задачи
  → Возобновление исполнения
```

### WebSocket события
```
connected, new_message, agent_status, task_update,
discussion_round, consensus_reached, system_warning,
cost_limit, agent_error, tool_execution, tool_result
```
