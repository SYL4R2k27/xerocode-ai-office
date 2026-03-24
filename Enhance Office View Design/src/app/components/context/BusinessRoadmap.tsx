import { motion } from "motion/react";
import { CheckCircle2, Circle, ArrowRight, Zap, Users, Shield, Globe, CreditCard, Bot, Sparkles, BookOpen, Server, Palette, Code2, Search, Crown } from "lucide-react";

interface Phase {
  id: number;
  title: string;
  desc: string;
  status: "done" | "current" | "next" | "future";
  items: string[];
  icon: typeof Zap;
}

const phases: Phase[] = [
  {
    id: 1,
    title: "MVP — Ядро",
    desc: "Бэкенд, API, чат-интерфейс",
    status: "done",
    icon: Zap,
    items: [
      "FastAPI + 13 эндпоинтов + WebSocket",
      "Supervisor (3 режима оркестрации)",
      "Communication Bus + Task Parser",
      "Chat-First UI (19 компонентов)",
      "Деплой на Yandex Cloud",
    ],
  },
  {
    id: 2,
    title: "Agent Runtime",
    desc: "Tool-calling + исполнение кода",
    status: "done",
    icon: Server,
    items: [
      "Tool-calling во всех адаптерах",
      "5 инструментов (write, read, run...)",
      "CodeExecutor + Tool loop (10 раундов)",
      "runtime_mode: text / cloud / local",
    ],
  },
  {
    id: 3,
    title: "7 адаптеров + ресёрч",
    desc: "OpenAI, Claude, Groq, Gemini, SD, Grok",
    status: "done",
    icon: Bot,
    items: [
      "Groq, Gemini, Stability адаптеры",
      "30+ бесплатных моделей через Custom",
      "Ресёрч: 20+ конкурентов, база знаний",
      "Пулы по задачам + подписки в рублях",
    ],
  },
  {
    id: 4,
    title: "EU Proxy — API из РФ",
    desc: "VLESS+REALITY, без VPN для юзера",
    status: "done",
    icon: Shield,
    items: [
      "Xray-core на сервере (systemd)",
      "VLESS+REALITY через HyNet (NL)",
      "SOCKS5 → все адаптеры через прокси",
      "OpenAI, Anthropic, Groq — работают",
    ],
  },
  {
    id: 5,
    title: "Первый E2E тест",
    desc: "Groq API ключ → полный цикл",
    status: "current",
    icon: Zap,
    items: [
      "Получить Groq ключ (бесплатно)",
      "Подключить модель в UI",
      "Цель → декомпозиция → исполнение",
      "Проверка tool-calling + файлы",
    ],
  },
  {
    id: 6,
    title: "Авторизация + ЛК",
    desc: "JWT, профиль, лимиты",
    status: "next",
    icon: Users,
    items: [
      "Регистрация / вход (email)",
      "Личный кабинет + история",
      "Привязка моделей к аккаунту",
      "Лимиты по тарифу",
    ],
  },
  {
    id: 7,
    title: "Пулы + Онбординг",
    desc: "Готовые команды одной кнопкой",
    status: "next",
    icon: Sparkles,
    items: [
      "5 пулов: Код, Дизайн, Ресёрч, Тексты, Данные",
      "Конструктор своих пулов",
      "Визард первого запуска",
      "Демо-режим без ключей",
    ],
  },
  {
    id: 8,
    title: "Десктоп-клиент",
    desc: "Агент + Electron",
    status: "future",
    icon: Globe,
    items: [
      "NPM пакет ai-office-agent",
      "Доступ к файлам на компе",
      "Electron (Mac/Win/Linux)",
    ],
  },
  {
    id: 9,
    title: "Монетизация",
    desc: "Free / Pro / Business",
    status: "future",
    icon: CreditCard,
    items: [
      "3 тарифа (0₽ / 990₽ / 2990₽)",
      "ЮKassa / Stripe",
      "Наши ключи для PRO/BIZ",
    ],
  },
  {
    id: 10,
    title: "Масштабирование",
    desc: "Продакшн + Docker + CI/CD",
    status: "future",
    icon: Crown,
    items: [
      "PostgreSQL, шифрование, Docker",
      "CI/CD, мониторинг, домен + SSL",
    ],
  },
];

const statusColors = {
  done: "var(--accent-teal)",
  current: "var(--accent-blue)",
  next: "var(--accent-amber)",
  future: "var(--text-tertiary)",
};

const statusLabels = {
  done: "Готово",
  current: "В работе",
  next: "Следующий",
  future: "Планируется",
};

// Pricing plans
const plans = [
  {
    name: "Free",
    price: "0₽",
    color: "var(--text-secondary)",
    features: ["Свои модели (до 3)", "50 задач/мес", "Подсказки по настройке"],
  },
  {
    name: "Pro",
    price: "990₽/мес",
    color: "var(--accent-blue)",
    features: ["До 10 агентов", "Бесплатные модели (Groq, Gemini)", "Готовые пулы", "500 задач/мес"],
  },
  {
    name: "Business",
    price: "2990₽/мес",
    color: "var(--accent-amber)",
    features: ["Без лимитов", "GPT-4o, Claude, Gemini Pro", "Приоритетная поддержка", "Свой сервер"],
  },
];

// Model pools
const modelPools = [
  {
    name: "Кодинг",
    icon: Code2,
    cost: "Бесплатно",
    tier: "PRO",
    models: ["Groq Llama 3.3 70B", "Groq Llama 3.1 8B", "Gemini Flash"],
    color: "var(--accent-blue)",
  },
  {
    name: "Ресёрч",
    icon: Search,
    cost: "Бесплатно",
    tier: "PRO",
    models: ["Gemini Flash", "Groq Mixtral"],
    color: "var(--accent-teal)",
  },
  {
    name: "Дизайн",
    icon: Palette,
    cost: "Бесплатно",
    tier: "PRO",
    models: ["Gemini Pro", "Groq Llama"],
    color: "var(--accent-lavender)",
  },
  {
    name: "Премиум",
    icon: Crown,
    cost: "~$0.05/задача",
    tier: "BUSINESS",
    models: ["GPT-4o", "Claude Sonnet", "GPT-4o-mini"],
    color: "var(--accent-amber)",
  },
];

export function BusinessRoadmap() {
  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {/* Title */}
      <div>
        <h2 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
          Дорожная карта
        </h2>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          План развития ИИ Офис
        </p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Прогресс</span>
          <span className="text-[11px] font-medium" style={{ color: "var(--accent-blue)" }}>4 / 10</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent-teal)" }}
            initial={{ width: 0 }}
            animate={{ width: "40%" }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-2">
        {phases.map((phase, i) => {
          const Icon = phase.icon;
          const color = statusColors[phase.status];
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3"
              style={{
                backgroundColor: phase.status === "current" ? "color-mix(in srgb, var(--accent-blue) 8%, var(--bg-elevated))" : "var(--bg-elevated)",
                border: `1px solid ${phase.status === "current" ? "var(--accent-blue)" : "var(--border-subtle)"}`,
              }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {phase.title}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                    >
                      {statusLabels[phase.status]}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {phase.desc}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {phase.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        {phase.status === "done" ? (
                          <CheckCircle2 size={9} style={{ color: "var(--accent-teal)" }} />
                        ) : (
                          <Circle size={9} style={{ color: "var(--text-tertiary)" }} />
                        )}
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }} />

      {/* Pricing Plans */}
      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Тарифы
        </h3>
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-lg p-3"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-bold" style={{ color: plan.color }}>
                  {plan.name}
                </span>
                <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {plan.price}
                </span>
              </div>
              <div className="space-y-0.5">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={9} style={{ color: plan.color }} />
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }} />

      {/* Model Pools */}
      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Готовые пулы моделей
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {modelPools.map((pool) => {
            const PoolIcon = pool.icon;
            return (
              <div
                key={pool.name}
                className="rounded-lg p-2.5"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <PoolIcon size={12} style={{ color: pool.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {pool.name}
                  </span>
                </div>
                <div className="space-y-0.5 mb-1.5">
                  {pool.models.map((m, i) => (
                    <p key={i} className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{m}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium" style={{ color: pool.color }}>{pool.cost}</span>
                  <span
                    className="text-[8px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `color-mix(in srgb, ${pool.color} 12%, transparent)`, color: pool.color }}
                  >
                    {pool.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Server costs */}
      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Расходы на содержание
        </h3>
        <div className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <div className="space-y-1">
            {[
              { item: "Сервер Yandex Cloud", cost: "2 500₽" },
              { item: "Домен .ru", cost: "150₽" },
              { item: "SSL (Let's Encrypt)", cost: "0₽" },
              { item: "Groq API (FREE пулы)", cost: "0₽" },
              { item: "Gemini API (FREE пулы)", cost: "0₽" },
              { item: "OpenAI API (BUSINESS)", cost: "~1 500-3 500₽" },
              { item: "Anthropic API (BUSINESS)", cost: "~1 500-3 500₽" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{row.item}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>{row.cost}</span>
              </div>
            ))}
            <div className="pt-1 mt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>Итого</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--accent-amber)" }}>3 000 — 6 000₽/мес</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: "var(--accent-teal)" }}>
          Окупаемость: 4-7 PRO подписчиков
        </p>
      </div>
    </div>
  );
}
