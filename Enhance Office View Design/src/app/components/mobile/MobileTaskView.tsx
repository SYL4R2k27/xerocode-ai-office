/**
 * MobileTaskView — вертикальный таймлайн задач для мобильной версии.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Zap, Clock, XCircle, ChevronDown } from "lucide-react";
import type { Task, Agent } from "../../lib/api";

interface MobileTaskViewProps {
  tasks: Task[];
  agents: Agent[];
}

function getStatusIcon(status: Task["status"]) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={18} style={{ color: "#22C55E" }} />;
    case "in_progress":
    case "assigned":
      return <Zap size={18} style={{ color: "var(--accent-amber)" }} />;
    case "pending":
      return <Clock size={18} style={{ color: "var(--text-tertiary)" }} />;
    case "failed":
      return <XCircle size={18} style={{ color: "#EF4444" }} />;
    default:
      return <Clock size={18} style={{ color: "var(--text-tertiary)" }} />;
  }
}

function getStatusLabel(status: Task["status"]) {
  switch (status) {
    case "done": return "Выполнена";
    case "in_progress": return "В работе";
    case "assigned": return "Назначена";
    case "pending": return "Ожидает";
    case "failed": return "Ошибка";
    default: return status;
  }
}

function getStatusColor(status: Task["status"]) {
  switch (status) {
    case "done": return "#22C55E";
    case "in_progress":
    case "assigned": return "var(--accent-amber)";
    case "pending": return "var(--text-tertiary)";
    case "failed": return "#EF4444";
    default: return "var(--text-tertiary)";
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function MobileTaskView({ tasks, agents }: MobileTaskViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || null;
  };

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-3"
        style={{
          backgroundColor: "var(--bg-base)",
          paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <Clock size={24} style={{ color: "var(--text-tertiary)" }} />
        </div>
        <p className="text-[15px] font-medium" style={{ color: "var(--text-secondary)" }}>
          Нет задач
        </p>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Создайте цель, чтобы увидеть задачи
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{
        backgroundColor: "var(--bg-base)",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <h2 className="text-[16px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Задачи ({tasks.length})
      </h2>

      {/* Вертикальный таймлайн */}
      <div className="relative">
        {/* Линия таймлайна */}
        <div
          className="absolute left-[8px] top-2 bottom-2 w-px"
          style={{ backgroundColor: "var(--border-default)" }}
        />

        <div className="space-y-2">
          {tasks.map((task, index) => {
            const isExpanded = expandedId === task.id;
            const agentName = getAgentName(task.assigned_agent_id);
            const statusColor = getStatusColor(task.status);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  className="w-full text-left"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div
                    className="flex items-start gap-3 pl-0 pr-2 py-2.5 rounded-2xl transition-colors active:bg-white/3"
                    style={{ backgroundColor: isExpanded ? "var(--bg-surface)" : "transparent" }}
                  >
                    {/* Иконка статуса */}
                    <div className="flex-shrink-0 relative z-10 bg-[var(--bg-base)] p-0.5">
                      {getStatusIcon(task.status)}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[14px] font-medium flex-1 truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {task.title}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        {agentName && (
                          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                            {agentName}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: statusColor }}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {formatTime(task.updated_at)}
                        </span>
                      </div>

                      {/* Прогресс-бар для in_progress */}
                      {(task.status === "in_progress" || task.status === "assigned") && (
                        <div
                          className="mt-2 h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--bg-elevated)" }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: "var(--accent-amber)" }}
                            initial={{ width: "0%" }}
                            animate={{ width: task.status === "in_progress" ? "60%" : "20%" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Развёрнутые детали */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="ml-7 pl-3 pb-3 pr-2 text-[13px] leading-relaxed space-y-2"
                        style={{
                          borderLeft: `2px solid ${statusColor}`,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {task.description && <p>{task.description}</p>}
                        {task.result && (
                          <div
                            className="rounded-xl p-3"
                            style={{ backgroundColor: "var(--bg-elevated)" }}
                          >
                            <span
                              className="text-[10px] font-medium block mb-1"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Результат
                            </span>
                            <p className="text-[12px] whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                              {task.result.length > 300
                                ? task.result.slice(0, 300) + "..."
                                : task.result}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          <span>Тип: {task.task_type}</span>
                          <span>Приоритет: {task.priority}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
