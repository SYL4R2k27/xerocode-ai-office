import { motion } from "motion/react";
import { CheckCircle2, Circle, Loader2, AlertCircle, Target, Clock, Zap } from "lucide-react";
import type { Task, Agent, Goal } from "../../lib/api";

interface ProjectPlanProps {
  tasks: Task[];
  agents: Agent[];
  goal: Goal | null;
}

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "#22c55e", label: "Готово" },
  in_progress: { icon: Loader2, color: "#3b82f6", label: "В работе" },
  assigned: { icon: Clock, color: "#f59e0b", label: "Назначена" },
  pending: { icon: Circle, color: "#6b7280", label: "Ожидает" },
  failed: { icon: AlertCircle, color: "#ef4444", label: "Ошибка" },
};

export function ProjectPlan({ tasks, agents, goal }: ProjectPlanProps) {
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-elevated)" }}
        >
          <Target size={20} style={{ color: "var(--text-tertiary)" }} />
        </div>
        <p className="text-[13px] text-center" style={{ color: "var(--text-secondary)" }}>
          Создай цель — и здесь появится план проекта
        </p>
        <p className="text-[11px] text-center" style={{ color: "var(--text-tertiary)" }}>
          Модели разобьют задачу на шаги и покажут прогресс
        </p>
      </div>
    );
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || null;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Goal header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} style={{ color: "var(--accent-blue)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            План проекта
          </span>
        </div>
        <h3
          className="text-[14px] font-semibold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {goal.title.replace(/^\[(Код|Дизайн|Ресёрч|Текст)\]\s*/u, "")}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-secondary)",
            }}
          >
            {goal.distribution_mode === "manager" ? "Менеджер" : goal.distribution_mode === "discussion" ? "Обсуждение" : "Авто"}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {goal.status === "active" ? "В работе" : goal.status === "completed" ? "Завершён" : goal.status}
          </span>
        </div>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Прогресс</span>
            <span className="text-[11px] font-medium" style={{ color: "var(--accent-blue)" }}>
              {done} / {total} ({progress}%)
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--accent-blue)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Task list as roadmap */}
      {tasks.length > 0 ? (
        <div className="space-y-0.5">
          {tasks.map((task, i) => {
            const config = statusConfig[task.status] || statusConfig.pending;
            const Icon = config.icon;
            const agentName = getAgentName(task.assigned_agent_id);
            const isLast = i === tasks.length - 1;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex gap-3"
              >
                {/* Timeline line + icon */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                  <div className="flex items-center justify-center w-5 h-5">
                    <Icon
                      size={14}
                      style={{ color: config.color }}
                      className={task.status === "in_progress" ? "animate-spin" : ""}
                    />
                  </div>
                  {!isLast && (
                    <div
                      className="flex-1 w-px my-0.5"
                      style={{
                        backgroundColor: task.status === "done" ? "#22c55e" : "var(--border-subtle)",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="text-[12px] font-medium leading-tight"
                      style={{
                        color: task.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)",
                        textDecoration: task.status === "done" ? "line-through" : "none",
                        opacity: task.status === "done" ? 0.7 : 1,
                      }}
                    >
                      {task.title}
                    </span>
                    {task.task_type && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {task.task_type}
                      </span>
                    )}
                  </div>
                  {agentName && (
                    <span className="text-[10px] mt-0.5 block" style={{ color: "var(--text-tertiary)" }}>
                      → {agentName}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <Loader2 size={16} className="animate-spin mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
          <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Модели формируют план...
          </p>
        </div>
      )}

      {/* Stats footer */}
      {tasks.length > 0 && (
        <div
          className="flex items-center justify-between pt-3 text-[10px]"
          style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
        >
          <span>Агентов: {agents.length}</span>
          <span>{tasks.filter((t) => t.status === "failed").length > 0
            ? `⚠️ ${tasks.filter((t) => t.status === "failed").length} ошибок`
            : `✅ Без ошибок`}
          </span>
        </div>
      )}
    </div>
  );
}
