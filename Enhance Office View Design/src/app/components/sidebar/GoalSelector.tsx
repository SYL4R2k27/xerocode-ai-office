import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import type { Goal } from "../../lib/api";

const categoryBadges: Record<string, { label: string; color: string }> = {
  "[Код]": { label: "Код", color: "var(--accent-blue)" },
  "[Дизайн]": { label: "Дизайн", color: "var(--accent-lavender)" },
  "[Ресёрч]": { label: "Ресёрч", color: "var(--accent-teal)" },
  "[Текст]": { label: "Текст", color: "var(--accent-amber)" },
};

function getGoalCategory(title: string): { label: string; color: string } | null {
  for (const [prefix, badge] of Object.entries(categoryBadges)) {
    if (title.startsWith(prefix)) return badge;
  }
  return null;
}

function getGoalDisplayTitle(title: string): string {
  return title.replace(/^\[(Код|Дизайн|Ресёрч|Текст)\]\s*/u, "");
}

interface GoalSelectorProps {
  goals: Goal[];
  activeGoal: Goal | null;
  onSelectGoal: (goal: Goal) => void;
  onNewGoal?: () => void;
}

export function GoalSelector({ goals, activeGoal, onSelectGoal, onNewGoal }: GoalSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative px-3 py-2">
      <div className="flex gap-1.5 mb-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-white/5 min-w-0 overflow-hidden"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: activeGoal ? "var(--text-primary)" : "var(--text-tertiary)",
          }}
        >
          <span className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
            {activeGoal && getGoalCategory(activeGoal.title) && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  color: getGoalCategory(activeGoal.title)!.color,
                  backgroundColor: `color-mix(in srgb, ${getGoalCategory(activeGoal.title)!.color} 15%, transparent)`,
                }}
              >
                {getGoalCategory(activeGoal.title)!.label}
              </span>
            )}
            <span className="truncate">{activeGoal ? getGoalDisplayTitle(activeGoal.title) : "Выбери цель..."}</span>
          </span>
          <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {onNewGoal && (
          <button
            onClick={onNewGoal}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/5"
            style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)" }}
            title="Новая цель"
          >
            <Plus size={16} style={{ color: "var(--accent-blue)" }} />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute left-3 right-3 top-full mt-1 rounded-lg py-1 z-50 max-h-48 overflow-y-auto"
          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          {goals.map((goal) => {
            const cat = getGoalCategory(goal.title);
            return (
              <button
                key={goal.id}
                onClick={() => { onSelectGoal(goal); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors flex items-center gap-1.5 ${
                  goal.id === activeGoal?.id ? "font-medium" : ""
                }`}
                style={{
                  color: goal.id === activeGoal?.id ? "var(--accent-blue)" : "var(--text-secondary)",
                }}
              >
                {cat && (
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                    style={{
                      color: cat.color,
                      backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                    }}
                  >
                    {cat.label}
                  </span>
                )}
                <span className="truncate">{getGoalDisplayTitle(goal.title)}</span>
              </button>
            );
          })}
          {goals.length === 0 && (
            <p className="px-3 py-2 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Нет целей
            </p>
          )}
        </div>
      )}
    </div>
  );
}
