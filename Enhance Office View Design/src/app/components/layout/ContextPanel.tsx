import { useState, useEffect } from "react";
import { Map, Eye, Activity, Rocket, Trophy } from "lucide-react";
import { TaskRoadmap } from "../context/TaskRoadmap";
import { PreviewPane } from "../context/PreviewPane";
import { ActivityFeed } from "../context/ActivityFeed";
import { ProjectPlan } from "../context/ProjectPlan";
import { LeaderboardView } from "../arena/LeaderboardView";
import type { Task, Agent, Message, Goal } from "../../lib/api";

type Tab = "plan" | "tasks" | "preview" | "log" | "leaderboard";

const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "plan", label: "План", icon: Rocket },
  { id: "tasks", label: "Задачи", icon: Map },
  { id: "preview", label: "Превью", icon: Eye },
  { id: "log", label: "Лог", icon: Activity },
];

interface ContextPanelProps {
  tasks: Task[];
  agents: Agent[];
  messages: Message[];
  activeGoal: Goal | null;
  previewCode: string | null;
  previewLanguage: string;
  arenaMode?: "battle" | "leaderboard" | null;
}

export function ContextPanel({ tasks, agents, messages, activeGoal, previewCode, previewLanguage, arenaMode }: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");

  const allTabs = arenaMode
    ? [...tabs, { id: "leaderboard" as const, label: "Рейтинг", icon: Trophy }]
    : tabs;

  useEffect(() => {
    if (arenaMode) setActiveTab("leaderboard");
  }, [arenaMode]);

  return (
    <div
      className="w-full h-full flex flex-col min-w-0"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: `blur(var(--glass-blur))`,
        borderLeft: "1px solid var(--glass-border)",
      }}
    >
      {/* Tab bar — icon + label */}
      <div
        className="flex items-center h-11 px-2 flex-shrink-0 gap-0.5"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={13} className="flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
              {/* Active indicator — colored underline */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "var(--accent-blue)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {activeTab === "plan" && <ProjectPlan tasks={tasks} agents={agents} goal={activeGoal} />}
        {activeTab === "tasks" && <TaskRoadmap tasks={tasks} agents={agents} />}
        {activeTab === "preview" && <PreviewPane code={previewCode} language={previewLanguage} />}
        {activeTab === "log" && <ActivityFeed messages={messages} />}
        {activeTab === "leaderboard" && <LeaderboardView />}
      </div>
    </div>
  );
}
