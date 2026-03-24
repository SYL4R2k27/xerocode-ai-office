import { CheckCircle2, Circle, Loader2, AlertCircle, Clock } from "lucide-react";
import type { Task, Agent } from "../../lib/api";

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "var(--accent-teal)", label: "Готово" },
  in_progress: { icon: Loader2, color: "var(--accent-blue)", label: "В работе" },
  assigned: { icon: Clock, color: "var(--accent-amber)", label: "Назначена" },
  pending: { icon: Circle, color: "var(--text-tertiary)", label: "Ожидает" },
  failed: { icon: AlertCircle, color: "var(--accent-rose)", label: "Ошибка" },
};

interface TaskRoadmapProps {
  tasks: Task[];
  agents: Agent[];
}

export function TaskRoadmap({ tasks, agents }: TaskRoadmapProps) {
  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name || null;
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <Circle size={24} style={{ color: "var(--text-tertiary)" }} />
        <p className="text-[12px] text-center" style={{ color: "var(--text-tertiary)" }}>
          Задачи появятся здесь после запуска цели
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-0">
      {tasks.map((task, i) => {
        const config = statusConfig[task.status] || statusConfig.pending;
        const Icon = config.icon;
        const agentName = getAgentName(task.assigned_agent_id || null);
        const isLast = i === tasks.length - 1;

        return (
          <div key={task.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
              >
                <Icon
                  size={12}
                  style={{ color: config.color }}
                  className={task.status === "in_progress" ? "animate-spin" : ""}
                />
              </div>
              {!isLast && (
                <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--border-subtle)" }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px]" style={{ color: config.color }}>
                  {config.label}
                </span>
                {agentName && (
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {agentName}
                  </span>
                )}
                {task.task_type && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {task.task_type}
                  </span>
                )}
              </div>
              {task.result && (
                <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                  {task.result}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
