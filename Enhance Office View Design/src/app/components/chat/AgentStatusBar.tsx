import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import type { Agent } from "../../lib/api";

interface AgentStatusBarProps {
  agents: Agent[];
}

function getStatusIcon(status: Agent["status"]) {
  switch (status) {
    case "thinking":
      return "💭";
    case "working":
      return "⚡";
    case "completed":
      return "✅";
    case "error":
      return "❌";
    default:
      return null;
  }
}

function getStatusText(status: Agent["status"]) {
  switch (status) {
    case "thinking":
      return "думает...";
    case "working":
      return "работает...";
    case "completed":
      return "завершил задачу";
    case "error":
      return "ошибка";
    default:
      return "";
  }
}

export function AgentStatusBar({ agents }: AgentStatusBarProps) {
  const activeAgents = agents.filter(
    (a) => a.status === "thinking" || a.status === "working" || a.status === "error" || a.status === "completed"
  );

  if (activeAgents.length === 0) return null;

  const hasWorking = activeAgents.some(
    (a) => a.status === "thinking" || a.status === "working"
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="px-4 py-2 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div
          className="rounded-xl px-3 py-2 space-y-1"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {activeAgents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2 text-[12px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {agent.status === "thinking" ? (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {getStatusIcon(agent.status)}
                </motion.span>
              ) : agent.status === "working" ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                  style={{ color: "var(--accent-amber)" }}
                />
              ) : (
                <span>{getStatusIcon(agent.status)}</span>
              )}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {agent.name}
              </span>
              <span>{getStatusText(agent.status)}</span>
            </motion.div>
          ))}

          {hasWorking && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] mt-1 pt-1"
              style={{
                color: "var(--text-tertiary)",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              Ты можешь вмешаться — напиши в чат
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
