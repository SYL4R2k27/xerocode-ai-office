import { useState } from "react";
import { Map, Eye, Activity, Rocket } from "lucide-react";
import { TaskRoadmap } from "../context/TaskRoadmap";
import { PreviewPane } from "../context/PreviewPane";
import { ActivityFeed } from "../context/ActivityFeed";
import { ProjectPlan } from "../context/ProjectPlan";
import type { Task, Agent, Message, Goal } from "../../lib/api";

type Tab = "plan" | "tasks" | "preview" | "log";

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
}

export function ContextPanel({ tasks, agents, messages, activeGoal, previewCode, previewLanguage }: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div
      className="w-full h-full flex flex-col min-w-0"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-default)",
      }}
    >
      {/* Tab bar — адаптивный */}
      <div
        className="flex items-center h-12 px-1 flex-shrink-0 gap-0.5 overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className="relative flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all min-w-[36px]"
              style={{
                backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                flex: isActive ? "1 1 auto" : "0 0 auto",
              }}
              title={tab.label}
            >
              <Icon size={13} className="flex-shrink-0" />
              <span className="truncate hidden sm:inline">{tab.label}</span>
              {/* Tooltip при наведении на свёрнутый таб */}
              {isHovered && !isActive && (
                <span
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] whitespace-nowrap z-50 pointer-events-none"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {tab.label}
                </span>
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
      </div>
    </div>
  );
}
