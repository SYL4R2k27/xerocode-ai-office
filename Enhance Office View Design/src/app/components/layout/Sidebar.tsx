import { useState } from "react";
import { Settings, Wifi, WifiOff, LogOut, Swords, Sun, Moon, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { GoalSelector } from "../sidebar/GoalSelector";
import { ModelList } from "../sidebar/ModelList";
import { TaskProgress } from "../sidebar/TaskProgress";
import { CostMeter } from "../sidebar/CostMeter";
import { ModelSkeleton, TaskSkeleton } from "../shared/LoadingSkeleton";
import { LogoIcon } from "../shared/Logo";
import type { Agent, Goal, Task, GoalStatus, User } from "../../lib/api";

const planConfig: Record<string, { label: string; color: string }> = {
  free: { label: "FREE", color: "var(--text-tertiary)" },
  start: { label: "START", color: "var(--text-secondary)" },
  pro: { label: "PRO", color: "var(--accent-teal)" },
  pro_plus: { label: "PRO+", color: "var(--accent-lavender)" },
  ultima: { label: "ULTIMA", color: "var(--accent-amber)" },
  admin: { label: "ADMIN", color: "var(--accent-rose)" },
};

const planLimits: Record<string, number> = {
  free: 50, start: 50, pro: 500, pro_plus: 2000, ultima: 99999, admin: 999999,
};

interface SidebarProps {
  agents: Agent[];
  goals: Goal[];
  tasks: Task[];
  activeGoal: Goal | null;
  status: GoalStatus | null;
  connected: boolean;
  onSelectGoal: (goal: Goal) => void;
  onAddModel: () => void;
  onRemoveAgent?: (agentId: string) => void;
  onNewGoal?: () => void;
  user?: User | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  agentsLoading?: boolean;
  arenaMode?: "battle" | "leaderboard" | null;
  onToggleArena?: () => void;
  toggleTheme?: () => void;
  resolvedTheme?: string;
}

export function Sidebar({ agents, goals, tasks, activeGoal, status, connected, onSelectGoal, onAddModel, onRemoveAgent, onNewGoal, user, onLogout, onOpenProfile, agentsLoading, arenaMode, onToggleArena, toggleTheme, resolvedTheme }: SidebarProps) {
  const [modelsOpen, setModelsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);

  const tasksDone = tasks.filter(t => t.status === "completed").length;
  const tasksTotal = tasks.length;
  const userPlan = user?.plan || "free";
  const cfg = planConfig[userPlan] || planConfig.free;
  const limit = planLimits[userPlan] || 50;
  const used = user?.tasks_used_this_month || 0;
  const usagePercent = Math.min((used / limit) * 100, 100);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: `blur(var(--glass-blur))`,
        borderRight: "1px solid var(--glass-border)",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <LogoIcon size={20} />
          <span className="text-[13px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            XeroCode
          </span>
          <span className="relative flex items-center ml-1">
            {connected ? (
              <Wifi size={11} style={{ color: "var(--accent-teal)" }} />
            ) : (
              <WifiOff size={11} style={{ color: "var(--accent-rose)" }} />
            )}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title={resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
          <button
            onClick={onAddModel}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Настройки моделей"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ── Goals ── */}
      <GoalSelector goals={goals} activeGoal={activeGoal} onSelectGoal={onSelectGoal} onNewGoal={onNewGoal} />

      {/* ── Эволюция ── */}
      <div className="px-3 py-0.5">
        <button
          onClick={onToggleArena}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{
            backgroundColor: arenaMode ? "color-mix(in srgb, var(--accent-arena) 12%, transparent)" : "transparent",
            color: arenaMode ? "var(--accent-arena)" : "var(--text-secondary)",
          }}
          onMouseEnter={e => { if (!arenaMode) e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
          onMouseLeave={e => { if (!arenaMode) e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Swords size={14} />
          Эволюция
        </button>
      </div>

      {/* ── Models section (collapsible) ── */}
      <div className="px-3 pt-2">
        <button
          onClick={() => setModelsOpen(!modelsOpen)}
          className="w-full flex items-center justify-between px-1 py-1"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
            Модели ({agents.length})
          </span>
          {modelsOpen ? <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} /> : <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {modelsOpen && (
          agentsLoading ? (
            <div className="py-1"><ModelSkeleton /><ModelSkeleton /><ModelSkeleton /></div>
          ) : (
            <ModelList agents={agents} onAddModel={onAddModel} onRemoveAgent={onRemoveAgent} isAdmin={user?.is_admin} />
          )
        )}

        {/* ── Tasks section (collapsible) ── */}
        {tasksTotal > 0 && (
          <>
            <div className="px-3 pt-2">
              <button
                onClick={() => setTasksOpen(!tasksOpen)}
                className="w-full flex items-center justify-between px-1 py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                    Задачи
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: tasksDone === tasksTotal ? "var(--accent-teal)" : "var(--accent-blue)" }}>
                    {tasksDone}/{tasksTotal}
                  </span>
                </div>
                {tasksOpen ? <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} /> : <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />}
              </button>
              {/* Mini progress bar */}
              <div className="mt-1 mx-1 h-[3px] rounded-full" style={{ background: "var(--border-default)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0}%`,
                    background: tasksDone === tasksTotal ? "var(--accent-teal)" : "var(--accent-blue)",
                  }}
                />
              </div>
            </div>
            {tasksOpen && (
              agentsLoading ? (
                <div className="py-1"><TaskSkeleton /><TaskSkeleton /></div>
              ) : (
                <TaskProgress tasks={tasks} agents={agents} />
              )
            )}
          </>
        )}
      </div>

      {/* ── Cost meter (admin) ── */}
      {user?.is_admin && <CostMeter status={status} />}

      {/* ── User section ── */}
      {user && (
        <div
          className="px-3 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {/* Avatar + Name + Plan */}
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center gap-2.5 rounded-lg p-1.5 -m-1 transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Настройки профиля"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, var(--accent-blue), var(--accent-lavender))`,
                color: "#fff",
              }}
            >
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {user.name || user.email}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{
                    color: cfg.color,
                    backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              {/* Usage bar */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-[3px] rounded-full" style={{ background: "var(--border-default)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${usagePercent}%`,
                      background: usagePercent > 90 ? "var(--accent-rose)" : usagePercent > 70 ? "var(--accent-amber)" : "var(--accent-teal)",
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                  {used}/{limit > 99000 ? "∞" : limit}
                </span>
              </div>
            </div>
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-2 pl-1">
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title="Настройки"
            >
              <Settings size={13} />
            </button>
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              title="Тарифы"
            >
              <DollarSign size={13} />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg transition-colors ml-auto"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--accent-rose)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                title="Выйти"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
