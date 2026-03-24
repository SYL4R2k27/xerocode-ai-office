import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FolderOpen,
  ListChecks,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Clock,
  User,
  Bot,
  TrendingUp,
} from "lucide-react";

// ====== Types ======

interface OrgStats {
  active_projects: number;
  tasks_in_progress: number;
  completed_this_week: number;
  total_cost_usd: number;
}

interface ProjectSummary {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  agent_count: number;
  progress: number; // 0-100
}

interface TeamMemberSummary {
  id: string;
  name: string;
  avatar?: string;
  tasks_count: number;
}

interface ActivityItem {
  id: string;
  user_name: string;
  action: string;
  target: string;
  created_at: string;
}

// ====== Helpers ======

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "только что";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  return `${days} дн назад`;
}

function statusColor(status: string): string {
  switch (status) {
    case "active": return "var(--accent-teal)";
    case "paused": return "var(--accent-amber)";
    case "completed": return "var(--accent-blue)";
    default: return "var(--text-tertiary)";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "active": return "Активный";
    case "paused": return "Пауза";
    case "completed": return "Завершён";
    default: return status;
  }
}

// ====== Component ======

interface DashboardProps {
  orgRole: "owner" | "manager" | "member";
  onNavigate: (page: string) => void;
}

export function Dashboard({ orgRole, onNavigate }: DashboardProps) {
  const isOwner = orgRole === "owner";

  // Mock data — replace with API calls
  const [stats] = useState<OrgStats>({
    active_projects: 12,
    tasks_in_progress: 34,
    completed_this_week: 18,
    total_cost_usd: 247.5,
  });

  const [projects] = useState<ProjectSummary[]>([
    { id: "1", name: "Редизайн лендинга", status: "active", agent_count: 3, progress: 72 },
    { id: "2", name: "API интеграция CRM", status: "active", agent_count: 2, progress: 45 },
    { id: "3", name: "Мобильное приложение v2", status: "paused", agent_count: 4, progress: 30 },
    { id: "4", name: "Аналитика пользователей", status: "active", agent_count: 1, progress: 88 },
    { id: "5", name: "Чат-бот поддержки", status: "completed", agent_count: 2, progress: 100 },
  ]);

  const [team] = useState<TeamMemberSummary[]>([
    { id: "1", name: "Алексей К.", tasks_count: 8 },
    { id: "2", name: "Мария П.", tasks_count: 5 },
    { id: "3", name: "Дмитрий С.", tasks_count: 12 },
    { id: "4", name: "Елена В.", tasks_count: 3 },
    { id: "5", name: "Сергей Н.", tasks_count: 7 },
  ]);

  const [activity] = useState<ActivityItem[]>([
    { id: "1", user_name: "Алексей К.", action: "завершил задачу", target: "Верстка главной страницы", created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: "2", user_name: "ИИ Агент", action: "создал отчёт", target: "Анализ конкурентов", created_at: new Date(Date.now() - 32 * 60000).toISOString() },
    { id: "3", user_name: "Мария П.", action: "добавила комментарий", target: "API интеграция", created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: "4", user_name: "Дмитрий С.", action: "переместил задачу в", target: "Ревью", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: "5", user_name: "Елена В.", action: "одобрила задачу", target: "Дизайн карточек", created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: "6", user_name: "ИИ Агент", action: "начал работу над", target: "Оптимизация запросов", created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: "7", user_name: "Сергей Н.", action: "создал проект", target: "Новый дашборд", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: "8", user_name: "Алексей К.", action: "назначил задачу", target: "Мария П.", created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
    { id: "9", user_name: "ИИ Агент", action: "завершил анализ", target: "Воронка продаж", created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
    { id: "10", user_name: "Мария П.", action: "обновила статус", target: "Мобильное приложение v2", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  ]);

  const statCards = [
    {
      label: "Активных проектов",
      value: stats.active_projects,
      icon: FolderOpen,
      color: "var(--accent-blue)",
    },
    {
      label: "Задач в работе",
      value: stats.tasks_in_progress,
      icon: ListChecks,
      color: "var(--accent-amber)",
    },
    {
      label: "Завершено за неделю",
      value: stats.completed_this_week,
      icon: CheckCircle2,
      color: "var(--accent-teal)",
    },
    ...(isOwner
      ? [
          {
            label: "Расходы",
            value: `$${stats.total_cost_usd.toFixed(2)}`,
            icon: DollarSign,
            color: "var(--accent-rose)",
          },
        ]
      : []),
  ];

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: "transparent" }}
    >
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1
            className="text-[22px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Главная
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
            Обзор активности организации
          </p>
        </div>

        {/* Stats Cards */}
        <div
          className="grid gap-4 mb-6"
          style={{
            gridTemplateColumns: `repeat(${statCards.length}, 1fr)`,
          }}
        >
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl p-5"
                style={{
                  backgroundColor: "rgba(36, 36, 38, 0.85)", backdropFilter: "blur(8px)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${card.color} 15%, transparent)`,
                      color: card.color,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <TrendingUp size={14} style={{ color: "var(--accent-teal)" }} />
                </div>
                <div
                  className="text-[24px] font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {card.value}
                </div>
                <div
                  className="text-[12px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Grid: Projects + Team + Activity */}
        <div className="grid grid-cols-3 gap-4">
          {/* Recent Projects — spans 2 cols */}
          <motion.div
            className="col-span-2 rounded-xl p-5"
            style={{
              backgroundColor: "rgba(36, 36, 38, 0.85)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border-default)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Последние проекты
              </h2>
              <button
                onClick={() => onNavigate("chat")}
                className="text-[12px] flex items-center gap-1 transition-colors"
                style={{ color: "var(--accent-blue)" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Все проекты <ArrowRight size={12} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onNavigate("chat")}
                  className="flex items-center gap-4 p-3 rounded-lg transition-colors text-left w-full"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {project.name}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${statusColor(project.status)} 15%, transparent)`,
                          color: statusColor(project.status),
                        }}
                      >
                        {statusLabel(project.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[11px] flex items-center gap-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Bot size={11} /> {project.agent_count} агентов
                      </span>
                      <div className="flex-1 max-w-[200px]">
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--bg-elevated)" }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: statusColor(project.status) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-[11px] flex-shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--text-tertiary)" }} />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Team Summary */}
          <motion.div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "rgba(36, 36, 38, 0.85)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border-default)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Команда
              </h2>
              <button
                onClick={() => onNavigate("team")}
                className="text-[12px] flex items-center gap-1 transition-colors"
                style={{ color: "var(--accent-blue)" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Подробнее <ArrowRight size={12} />
              </button>
            </div>

            {/* Avatars row */}
            <div className="flex items-center mb-4">
              <div className="flex -space-x-2">
                {team.slice(0, 5).map((member, i) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{
                      backgroundColor: `hsl(${i * 60 + 200}, 40%, 35%)`,
                      color: "#fff",
                      border: "2px solid var(--bg-surface)",
                      zIndex: 5 - i,
                    }}
                    title={member.name}
                  >
                    {member.name.charAt(0)}
                  </div>
                ))}
              </div>
              {team.length > 5 && (
                <span
                  className="text-[11px] ml-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  +{team.length - 5}
                </span>
              )}
            </div>

            {/* Member list */}
            <div className="flex flex-col gap-2">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {member.name}
                    </span>
                  </div>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {member.tasks_count} задач
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed — full width */}
          <motion.div
            className="col-span-3 rounded-xl p-5"
            style={{
              backgroundColor: "rgba(36, 36, 38, 0.85)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border-default)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2
              className="text-[15px] font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Лента активности
            </h2>

            <div className="flex flex-col gap-0">
              {activity.map((item, i) => {
                const isAI = item.user_name.includes("ИИ");
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{
                      borderBottom:
                        i < activity.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isAI
                          ? "color-mix(in srgb, var(--accent-lavender) 20%, transparent)"
                          : "var(--bg-elevated)",
                        color: isAI ? "var(--accent-lavender)" : "var(--text-secondary)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {isAI ? <Bot size={13} /> : <User size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px]">
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {item.user_name}
                        </span>{" "}
                        <span style={{ color: "var(--text-secondary)" }}>
                          {item.action}
                        </span>{" "}
                        <span style={{ color: "var(--accent-blue)", fontWeight: 500 }}>
                          {item.target}
                        </span>
                      </span>
                    </div>
                    <span
                      className="text-[11px] flex items-center gap-1 flex-shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Clock size={11} />
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
