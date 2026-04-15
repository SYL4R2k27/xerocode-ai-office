/**
 * TeamPicker — compact dropdown для управления моделями команды в header.
 * Показывает количество активных моделей, раскрывается в список с карточками.
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, X, ChevronDown, BookOpen } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role?: string;
  provider?: string;
  model_name?: string;
  status?: string;
  avatar?: string;
}

interface TeamPickerProps {
  agents: Agent[];
  onAddAgent?: () => void;
  onRemoveAgent?: (id: string) => void;
  useKnowledgeBase?: boolean;
  onToggleKB?: () => void;
}

const providerColor: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#cc785c",
  google: "#4285f4",
  groq: "#f55036",
  deepseek: "#4d6bfe",
  openrouter: "#a855f7",
};

export function TeamPicker({ agents, onAddAgent, onRemoveAgent, useKnowledgeBase, onToggleKB }: TeamPickerProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 320;
    setAlignRight(rect.left + menuWidth > window.innerWidth - 16);
  }, [open]);

  const count = agents.length;
  const label = count === 0 ? "Без моделей" : count === 1 ? agents[0].name : `${count} модели`;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
        title="Модели команды"
      >
        <Users size={14} style={{ color: "var(--text-secondary)" }} />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown size={12} style={{ color: "var(--text-tertiary)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1 z-50 w-[min(320px,calc(100vw-32px))] rounded-xl overflow-hidden"
              style={{
                ...(alignRight ? { right: 0 } : { left: 0 }),
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Header */}
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)" }}>
                  Команда
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  {count} {count === 1 ? "модель" : count < 5 && count > 1 ? "модели" : "моделей"}
                </span>
              </div>

              {/* Agents list */}
              <div className="max-h-[280px] overflow-y-auto">
                {agents.length === 0 ? (
                  <div className="px-4 py-6 text-center" style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Моделей пока нет.<br />XeroCode AI работает автоматически.
                  </div>
                ) : (
                  agents.map(a => {
                    const color = providerColor[a.provider || "openrouter"] || "#a855f7";
                    return (
                      <div
                        key={a.id}
                        className="px-3 py-2 flex items-center gap-2 transition-colors hover:bg-[var(--bg-elevated)]"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: a.status === "active" || a.status === "thinking" ? "var(--accent-green)" : "var(--text-tertiary)",
                            boxShadow: a.status === "thinking" ? `0 0 8px var(--accent-green)` : "none",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                              {a.name}
                            </span>
                            <span style={{ fontSize: "10px", color, fontFamily: "monospace" }}>
                              {a.provider}
                            </span>
                          </div>
                          {a.model_name && (
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "monospace" }} className="truncate">
                              {a.model_name}
                            </div>
                          )}
                        </div>
                        {onRemoveAgent && (
                          <button
                            onClick={() => onRemoveAgent(a.id)}
                            className="p-1 rounded transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                            style={{ color: "var(--text-tertiary)" }}
                            title="Удалить"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer actions */}
              <div
                className="px-2 py-2 flex items-center gap-1"
                style={{ borderTop: "1px solid var(--border-default)" }}
              >
                {onAddAgent && (
                  <button
                    onClick={() => { onAddAgent(); setOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ color: "var(--accent-blue)", backgroundColor: "color-mix(in srgb, var(--accent-blue) 10%, transparent)" }}
                  >
                    <Plus size={12} /> Добавить
                  </button>
                )}
                {onToggleKB && (
                  <button
                    onClick={onToggleKB}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      color: useKnowledgeBase ? "var(--accent-blue)" : "var(--text-tertiary)",
                      backgroundColor: useKnowledgeBase ? "color-mix(in srgb, var(--accent-blue) 10%, transparent)" : "transparent",
                    }}
                    title="База знаний"
                  >
                    <BookOpen size={12} /> КБ
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
