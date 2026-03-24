import { motion } from "motion/react";
import { AgentCard } from "./AgentCard";
import { useMemo } from "react";
import type { Agent } from "../lib/api";

interface OfficeViewProps {
  agents: Agent[];
}

export function OfficeView({ agents }: OfficeViewProps) {
  // Auto-position agents in a grid
  const positionedAgents = useMemo(() => {
    const cols = Math.min(3, agents.length);
    return agents.map((agent, i) => ({
      ...agent,
      position: {
        x: (i % cols) * 330 + 50,
        y: Math.floor(i / cols) * 260 + 80,
      },
    }));
  }, [agents]);

  // Connection lines between active agents
  const connections = useMemo(() => {
    const active = positionedAgents.filter(
      (a) => a.status === "thinking" || a.status === "working"
    );
    const conns: Array<{ from: string; to: string }> = [];
    for (let i = 0; i < active.length - 1; i++) {
      conns.push({ from: active[i].id, to: active[i + 1].id });
    }
    return conns;
  }, [positionedAgents]);

  const getAgentCenter = (agentId: string) => {
    const agent = positionedAgents.find((a) => a.id === agentId);
    if (!agent) return { x: 0, y: 0 };
    return {
      x: agent.position.x + 140,
      y: agent.position.y + 80,
    };
  };

  const roadmap = [
    {
      stage: 1,
      title: "Архитектура и база данных",
      desc: "Модели, миграции, PostgreSQL / SQLite",
      status: "done" as const,
    },
    {
      stage: 2,
      title: "API и адаптеры моделей",
      desc: "REST API, OpenAI, Anthropic, Ollama, Custom",
      status: "done" as const,
    },
    {
      stage: 3,
      title: "Движок оркестрации",
      desc: "Communication Bus, Supervisor, LoopGuard, CostTracker",
      status: "done" as const,
    },
    {
      stage: 4,
      title: "Фронтенд и интерфейс",
      desc: "React UI, WebSocket, Store, все компоненты",
      status: "done" as const,
    },
    {
      stage: 5,
      title: "Тест полной связки",
      desc: "Бэкенд + фронтенд вместе, E2E проверка",
      status: "next" as const,
    },
    {
      stage: 6,
      title: "Сборщик результатов",
      desc: "Сохранение файлов и отчётов в папку",
      status: "pending" as const,
    },
    {
      stage: 7,
      title: "Desktop-обёртка",
      desc: "Electron или Tauri для десктоп-версии",
      status: "pending" as const,
    },
    {
      stage: 8,
      title: "Продакшн",
      desc: "Alembic миграции, шифрование ключей, деплой",
      status: "pending" as const,
    },
  ];

  if (agents.length === 0) {
    return (
      <div className="relative w-full h-full bg-[#0F0F12] rounded-3xl p-6 overflow-hidden flex flex-col">
        {/* Background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative text-center mb-6">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="text-3xl">🏢</span>
          </motion.div>
          <h3 className="text-white text-lg font-semibold">ИИ Офис — Дорожная карта</h3>
          <p className="text-gray-500 text-xs mt-1">Прогресс разработки платформы</p>
        </div>

        {/* Progress bar */}
        <div className="relative mb-5 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Общий прогресс</span>
            <span className="text-xs text-purple-400 font-medium">4 / 8 этапов</span>
          </div>
          <div className="h-2 bg-[#1A1A1F] rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "50%" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* Roadmap grid */}
        <div className="relative flex-1 overflow-y-auto px-2">
          <div className="grid grid-cols-2 gap-3">
            {roadmap.map((item, i) => (
              <motion.div
                key={item.stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative rounded-xl p-4 border transition-all ${
                  item.status === "done"
                    ? "bg-green-500/5 border-green-500/20"
                    : item.status === "next"
                    ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5"
                    : "bg-[#1A1A1F] border-white/5"
                }`}
              >
                {/* Stage number badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      item.status === "done"
                        ? "bg-green-500/20 text-green-400"
                        : item.status === "next"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {item.status === "done" ? "✓" : item.stage}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`text-sm font-medium truncate ${
                          item.status === "done"
                            ? "text-green-300"
                            : item.status === "next"
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.status === "next" && (
                        <motion.span
                          className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/30 flex-shrink-0"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ДАЛЕЕ
                        </motion.span>
                      )}
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        item.status === "done"
                          ? "text-green-400/60"
                          : item.status === "next"
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Pulse ring for "next" */}
                {item.status === "next" && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border border-purple-500/20"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <motion.div
          className="relative text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-gray-500 text-xs">
            Нажми ⚙️ чтобы подключить модель, или выбери следующий этап
          </p>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/15 rounded-full"
            style={{ left: `${15 + Math.random() * 70}%`, top: `${15 + Math.random() * 70}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0F0F12] rounded-3xl p-8 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map((conn, idx) => {
          const from = getAgentCenter(conn.from);
          const to = getAgentCenter(conn.to);
          return (
            <motion.g key={idx}>
              <motion.line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(139, 92, 246, 0.2)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              <motion.circle
                r="3"
                fill="rgba(139, 92, 246, 0.6)"
                initial={{ opacity: 0 }}
                animate={{
                  cx: [from.x, to.x],
                  cy: [from.y, to.y],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: idx * 0.5 }}
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Agent cards */}
      <div className="relative w-full h-full" style={{ zIndex: 2 }}>
        {positionedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            name={agent.name}
            role={agent.role}
            avatar={agent.avatar}
            provider={agent.provider}
            modelName={agent.model_name}
            status={agent.status}
            totalCost={agent.total_cost_usd}
            position={agent.position}
          />
        ))}
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
          style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}
