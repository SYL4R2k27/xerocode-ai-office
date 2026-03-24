import { CheckCircle2, Circle, Loader2, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import type { Task, Agent } from "../../lib/api";

const statusConfig: Record<string, { icon: typeof Circle; color: string }> = {
  done: { icon: CheckCircle2, color: "var(--accent-teal)" },
  in_progress: { icon: Loader2, color: "var(--accent-blue)" },
  assigned: { icon: Clock, color: "var(--accent-amber)" },
  pending: { icon: Circle, color: "var(--text-tertiary)" },
  failed: { icon: AlertCircle, color: "var(--accent-rose)" },
};

interface TaskProgressProps {
  tasks: Task[];
  agents: Agent[];
}

export function TaskProgress({ tasks, agents }: TaskProgressProps) {
  const [collapsed, setCollapsed] = useState(false);

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name || null;
  };

  return (
    <div className="px-3 py-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Задачи
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {done}/{total}
        </span>
      </button>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "var(--accent-teal)" }}
          />
        </div>
      )}

      {/* Task list */}
      {!collapsed && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {tasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.pending;
            const Icon = config.icon;
            const agentName = getAgentName(task.assigned_agent_id || null);

            return (
              <div
                key={task.id}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
              >
                <Icon
                  size={13}
                  style={{ color: config.color }}
                  className={task.status === "in_progress" ? "animate-spin" : ""}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] truncate block" style={{ color: "var(--text-primary)" }}>
                    {task.title}
                  </span>
                  {agentName && (
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {agentName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
