import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, Eye, Activity, X, Code, FileText } from "lucide-react";

type Tab = "plan" | "preview" | "log";

interface ContextPanelV2Props {
  open: boolean;
  onClose: () => void;
  tasks: any[];
  messages: any[];
  activeGoal: any | null;
  previewCode: string | null;
  previewLanguage: string;
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "plan", label: "План", icon: Rocket },
  { id: "preview", label: "Превью", icon: Eye },
  { id: "log", label: "Лог", icon: Activity },
];

export function ContextPanelV2({
  open,
  onClose,
  tasks,
  messages,
  activeGoal,
  previewCode,
  previewLanguage,
}: ContextPanelV2Props) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");

  // Auto-switch to preview when code appears
  useEffect(() => {
    if (previewCode) setActiveTab("preview");
  }, [previewCode]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 h-full flex flex-col overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderLeft: "1px solid var(--border-default)",
          }}
        >
          {/* Header with tabs */}
          <div
            className="flex items-center h-11 px-2 flex-shrink-0 gap-0.5"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors relative"
                  style={{
                    color: isActive ? "var(--accent-blue)" : "var(--text-tertiary)",
                    backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                  {tab.id === "preview" && previewCode && (
                    <span className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5" style={{ backgroundColor: "var(--accent-blue)" }} />
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Plan tab */}
            {activeTab === "plan" && (
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  {activeGoal?.title || "Нет активного проекта"}
                </h4>
                {tasks.length === 0 ? (
                  <p className="text-xs py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                    Задачи появятся после запуска
                  </p>
                ) : (
                  tasks.map((task: any, i: number) => {
                    const statusColors: Record<string, string> = {
                      done: "var(--accent-green)",
                      in_progress: "var(--accent-blue)",
                      review_operator: "var(--accent-amber)",
                      review_manager: "var(--accent-lavender)",
                      backlog: "var(--text-tertiary)",
                      failed: "var(--accent-rose)",
                    };
                    const color = statusColors[task.status] || "var(--text-tertiary)";
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: "var(--bg-base)" }}
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{
                            color: task.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)",
                            textDecoration: task.status === "done" ? "line-through" : "none",
                          }}>
                            {task.title}
                          </div>
                          {task.goal_title && (
                            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              {task.goal_title}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* Preview tab */}
            {activeTab === "preview" && (
              <div className="p-4">
                {previewCode ? (
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
                    <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-default)" }}>
                      <div className="flex items-center gap-1.5">
                        <Code size={12} style={{ color: "var(--text-tertiary)" }} />
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>{previewLanguage}</span>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(previewCode)}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 overflow-x-auto text-xs leading-relaxed" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-base)" }}>
                      <code>{previewCode}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                    Код для превью появится при генерации
                  </p>
                )}
              </div>
            )}

            {/* Log tab */}
            {activeTab === "log" && (
              <div className="p-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-xs py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                    Нет активности
                  </p>
                ) : (
                  messages.slice(-30).map((msg: any, i: number) => (
                    <div key={msg.id || i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{
                        backgroundColor: msg.sender_type === "user" ? "var(--accent-blue)" : msg.sender_type === "system" ? "var(--accent-amber)" : "var(--accent-teal)",
                      }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>{msg.sender_name}</span>
                        <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                          {(msg.content || "").substring(0, 80)}{(msg.content || "").length > 80 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
