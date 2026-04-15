/**
 * ModeSelector — dropdown with 5 orchestration modes.
 * Default: xerocode_ai (our flagship).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, User, Users, Waves, Gavel, ChevronDown } from "lucide-react";

export type OrchMode = "manager" | "team" | "swarm" | "auction" | "xerocode_ai";

interface ModeSelectorProps {
  value: OrchMode;
  onChange: (m: OrchMode) => void;
}

const MODES: { id: OrchMode; label: string; tagline: string; icon: any; color: string }[] = [
  { id: "xerocode_ai", label: "XeroCode AI", tagline: "Наша модель. Просто пиши — она разберётся.", icon: Sparkles, color: "#9333ea" },
  { id: "manager",     label: "Менеджер",    tagline: "Одна главная модель, остальные — её инструменты.", icon: User, color: "#3b82f6" },
  { id: "team",        label: "Команда",     tagline: "Роли с pipeline: архитектор → исполнитель → ревьюер.", icon: Users, color: "#10b981" },
  { id: "swarm",       label: "Рой",         tagline: "Параллельно N моделей, судья выбирает лучший.", icon: Waves, color: "#06b6d4" },
  { id: "auction",     label: "Аукцион",     tagline: "Модели оценивают себя, побеждает самый подходящий.", icon: Gavel, color: "#f59e0b" },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = MODES.find(m => m.id === value) || MODES[0];
  const ActiveIcon = active.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: `1px solid color-mix(in srgb, ${active.color} 30%, var(--border-default))`,
          color: "var(--text-primary)",
        }}
        title={active.tagline}
      >
        <ActiveIcon size={14} style={{ color: active.color }} />
        <span>{active.label}</span>
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
              className="absolute left-0 top-full mt-1 z-50 w-[320px] rounded-xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {MODES.map(m => {
                const Icon = m.icon;
                const isActive = m.id === value;
                return (
                  <button
                    key={m.id}
                    onClick={() => { onChange(m.id); setOpen(false); }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{
                      backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                      borderLeft: isActive ? `3px solid ${m.color}` : "3px solid transparent",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `color-mix(in srgb, ${m.color} 15%, transparent)` }}
                    >
                      <Icon size={14} style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: 2 }}>
                        {m.tagline}
                      </div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
