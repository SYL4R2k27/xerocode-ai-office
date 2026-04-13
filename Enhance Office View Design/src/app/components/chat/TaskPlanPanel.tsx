import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, Circle, Play, Clock, AlertCircle, Bot,
  ChevronRight, Loader2, X, Send,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  task_type?: string;
  assigned_agent_id?: string;
  result?: string;
}

interface TaskPlanPanelProps {
  tasks: Task[];
  agents: any[];
  onExecuteTask?: (taskId: string, prompt: string) => void;
  onClose?: () => void;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  backlog: { icon: Circle, color: "var(--text-tertiary)", label: "Бэклог" },
  pending: { icon: Circle, color: "var(--text-tertiary)", label: "Ожидание" },
  assigned: { icon: Clock, color: "var(--accent-amber)", label: "Назначена" },
  in_progress: { icon: Loader2, color: "var(--accent-blue)", label: "В работе" },
  review_operator: { icon: AlertCircle, color: "var(--accent-amber)", label: "Проверка" },
  review_manager: { icon: AlertCircle, color: "var(--accent-lavender)", label: "Ревью" },
  done: { icon: CheckCircle2, color: "var(--accent-green)", label: "Готово" },
  failed: { icon: AlertCircle, color: "var(--accent-rose)", label: "Ошибка" },
};

export function TaskPlanPanel({ tasks, agents, onExecuteTask, onClose }: TaskPlanPanelProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [executePrompt, setExecutePrompt] = useState("");

  const handleExecute = useCallback((taskId: string) => {
    if (!executePrompt.trim()) return;
    onExecuteTask?.(taskId, executePrompt);
    setExecutePrompt("");
    setSelectedTask(null);
  }, [executePrompt, onExecuteTask]);

  const completedCount = tasks.filter(t => t.status === "done").length;
  const totalCount = tasks.length;

  if (tasks.length === 0) return null;

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-default)",
        width: "320px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            План задач
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {completedCount}/{totalCount} выполнено
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded" style={{ color: "var(--text-tertiary)" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              backgroundColor: "var(--accent-green)",
            }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {tasks.map((task, i) => {
          const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog;
          const StatusIcon = config.icon;
          const isSelected = selectedTask === task.id;
          const agent = agents.find((a: any) => a.id === task.assigned_agent_id);
          const canExecute = task.status !== "done" && task.status !== "in_progress";

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className="flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors group"
                style={{
                  backgroundColor: isSelected ? "var(--bg-elevated)" : "transparent",
                }}
                onClick={() => canExecute ? setSelectedTask(isSelected ? null : task.id) : null}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-base)"; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                {/* Status icon */}
                <StatusIcon
                  size={14}
                  className={`flex-shrink-0 mt-0.5 ${task.status === "in_progress" ? "animate-spin" : ""}`}
                  style={{ color: config.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-tight" style={{ color: task.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: task.status === "done" ? "line-through" : "none" }}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: config.color }}>{config.label}</span>
                    {agent && (
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                        <Bot size={8} /> {agent.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Execute button */}
                {canExecute && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTask(task.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: "var(--accent-blue)" }}
                    title="Выполнить эту задачу"
                  >
                    <Play size={12} />
                  </button>
                )}
              </div>

              {/* Execute inline form */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-2 pt-1">
                      <p className="text-[10px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                        Уточните запрос или нажмите Enter для запуска:
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          value={executePrompt}
                          onChange={e => setExecutePrompt(e.target.value)}
                          placeholder={`Выполни: ${task.title}`}
                          className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                          style={{
                            backgroundColor: "var(--bg-base)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleExecute(task.id);
                            if (e.key === "Escape") setSelectedTask(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleExecute(task.id)}
                          className="px-2 py-1.5 rounded"
                          style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                        >
                          <Send size={11} />
                        </button>
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
  );
}
