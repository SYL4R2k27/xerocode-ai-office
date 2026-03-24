import { motion } from "motion/react";
import { ChevronDown, CheckCircle2, Circle, Loader2, AlertCircle, User } from "lucide-react";
import { useState, useMemo } from "react";
import type { Task, Agent } from "../lib/api";

interface TaskGraphProps {
  tasks: Task[];
  agents: Agent[];
}

function TaskNode({ task, agentName }: { task: Task; agentName: string | null }) {
  const getStatusColor = () => {
    switch (task.status) {
      case "done": return "text-green-400 border-green-400/30 bg-green-400/10";
      case "in_progress": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
      case "assigned": return "text-purple-400 border-purple-400/30 bg-purple-400/10";
      case "failed": return "text-red-400 border-red-400/30 bg-red-400/10";
      default: return "text-gray-500 border-gray-500/30 bg-gray-500/5";
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case "done": return <CheckCircle2 className="w-4 h-4" />;
      case "in_progress": return <Loader2 className="w-4 h-4 animate-spin" />;
      case "failed": return <AlertCircle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className={`rounded-xl border p-3 mb-2 ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white block truncate">{task.title}</span>
            {agentName && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3" /> {agentName}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-500 uppercase flex-shrink-0">{task.task_type}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function TaskGraph({ tasks, agents }: TaskGraphProps) {
  const agentMap = useMemo(() => {
    const map: Record<string, string> = {};
    agents.forEach((a) => { map[a.id] = a.name; });
    return map;
  }, [agents]);

  const stats = useMemo(() => {
    const s = { done: 0, in_progress: 0, pending: 0, assigned: 0, failed: 0 };
    tasks.forEach((t) => {
      if (t.status in s) s[t.status as keyof typeof s]++;
    });
    return s;
  }, [tasks]);

  return (
    <div className="h-full bg-[#1A1A1F] border-l border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <h2 className="text-white font-medium mb-1">Граф задач</h2>
        <p className="text-gray-400 text-sm">
          {tasks.length > 0 ? `${tasks.length} задач${tasks.length === 1 ? "а" : ""}` : "Задач пока нет"}
        </p>
      </div>

      {/* Task list */}
      <div className="flex-1 p-6 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Задачи появятся здесь,</p>
            <p>когда запустишь цель</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskNode
                key={task.id}
                task={task}
                agentName={task.assigned_agent_id ? agentMap[task.assigned_agent_id] || null : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats footer */}
      {tasks.length > 0 && (
        <div className="p-6 border-t border-white/5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-400">{stats.done}</div>
              <div className="text-xs text-gray-500 mt-1">Готово</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-400">{stats.in_progress + stats.assigned}</div>
              <div className="text-xs text-gray-500 mt-1">В работе</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-gray-400">{stats.pending}</div>
              <div className="text-xs text-gray-500 mt-1">Ожидают</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
