import { Settings, Wifi, WifiOff, LogOut, Swords } from "lucide-react";
import { GoalSelector } from "../sidebar/GoalSelector";
import { ModelList } from "../sidebar/ModelList";
import { TaskProgress } from "../sidebar/TaskProgress";
import { CostMeter } from "../sidebar/CostMeter";
import { ModelSkeleton, TaskSkeleton } from "../shared/LoadingSkeleton";
import type { Agent, Goal, Task, GoalStatus, User } from "../../lib/api";

const planConfig: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "var(--text-tertiary)" },
  pro: { label: "PRO", color: "var(--accent-teal)" },
  ultima: { label: "ULTIMA", color: "var(--accent-amber)" },
  admin: { label: "ADMIN", color: "var(--accent-rose)" },
};

const planLimits: Record<string, number> = {
  free: 50,
  pro: 500,
  ultima: 5000,
  admin: 999999,
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
}

export function Sidebar({ agents, goals, tasks, activeGoal, status, connected, onSelectGoal, onAddModel, onRemoveAgent, onNewGoal, user, onLogout, onOpenProfile, agentsLoading, arenaMode, onToggleArena }: SidebarProps) {
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            XeroCode
          </span>
          <span className="relative flex items-center">
            {connected ? (
              <Wifi size={12} style={{ color: "var(--accent-teal)" }} />
            ) : (
              <WifiOff size={12} style={{ color: "var(--accent-rose)" }} />
            )}
          </span>
        </div>
        <button
          onClick={onAddModel}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title="Настройки моделей"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Goal selector */}
      <GoalSelector goals={goals} activeGoal={activeGoal} onSelectGoal={onSelectGoal} onNewGoal={onNewGoal} />

      {/* Эволюция */}
      <div className="px-3 py-1">
        <button
          onClick={onToggleArena}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: arenaMode ? "color-mix(in srgb, var(--accent-arena) 12%, transparent)" : "transparent",
            color: arenaMode ? "var(--accent-arena)" : "var(--text-secondary)",
          }}
          onMouseEnter={e => { if (!arenaMode) (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"); }}
          onMouseLeave={e => { if (!arenaMode) (e.currentTarget.style.backgroundColor = "transparent"); }}
        >
          <Swords size={14} />
          Эволюция
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3" style={{ borderBottom: "1px solid var(--border-subtle)" }} />

      {/* Models */}
      <div className="flex-1 overflow-y-auto">
        {agentsLoading ? (
          <div className="py-2">
            <ModelSkeleton />
            <ModelSkeleton />
            <ModelSkeleton />
          </div>
        ) : (
          <ModelList agents={agents} onAddModel={onAddModel} onRemoveAgent={onRemoveAgent} isAdmin={user?.is_admin} />
        )}

        {/* Divider */}
        <div className="mx-3 my-1" style={{ borderBottom: "1px solid var(--border-subtle)" }} />

        {/* Tasks */}
        {agentsLoading ? (
          <div className="py-2">
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        ) : (
          tasks.length > 0 && <TaskProgress tasks={tasks} agents={agents} />
        )}
      </div>

      {/* Cost meter — only for admin */}
      {user?.is_admin && <CostMeter status={status} />}

      {/* User info */}
      {user && (
        <div
          className="px-3 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            {/* Clickable avatar + info area */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 flex-1 min-w-0 rounded-lg p-1 -m-1 transition-colors hover:bg-white/5"
              title="Настройки профиля"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent-blue) 15%, var(--bg-elevated))",
                  color: "var(--accent-blue)",
                }}
              >
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {user.email}
                  </span>
                  {(() => {
                    const cfg = planConfig[user.plan] || planConfig.free;
                    return (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          color: cfg.color,
                          backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                        }}
                      >
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-[10px] block" style={{ color: "var(--text-tertiary)" }}>
                  {user.tasks_used_this_month} / {planLimits[user.plan] || 10} задач
                </span>
              </div>
            </button>

            {/* Gear icon for profile settings */}
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
              style={{ color: "var(--text-tertiary)" }}
              title="Настройки профиля"
            >
              <Settings size={14} />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
                title="Выйти"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
