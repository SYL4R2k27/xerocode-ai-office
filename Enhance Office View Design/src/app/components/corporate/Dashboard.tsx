import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FolderOpen, ListChecks, CheckCircle2, DollarSign, ArrowRight,
  Clock, Users, Bot, TrendingUp, AlertCircle, Plus, Sparkles,
  ClipboardList, Eye, Loader2,
} from "lucide-react";
import { api, type OrgStats, type OrgActivity, type OrgMember, type Goal, type OrgTask } from "../../lib/api";

interface DashboardProps {
  orgRole: "owner" | "manager" | "member";
  onNavigate?: (page: string) => void;
}

export function Dashboard({ orgRole, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activity, setActivity] = useState<OrgActivity[]>([]);
  const [recentTasks, setRecentTasks] = useState<OrgTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isManager = orgRole === "owner" || orgRole === "manager";

  useEffect(() => {
    async function load() {
      try {
        const promises: Promise<any>[] = [
          api.goals.list(),
        ];
        if (isManager) {
          promises.push(
            api.org.getStats(),
            api.org.getMembers(),
            api.org.getActivity(20),
            api.org.getTasks(),
          );
        }
        const results = await Promise.all(promises);
        setGoals(results[0] || []);
        if (isManager) {
          setStats(results[1] || null);
          setMembers(results[2] || []);
          setActivity(results[3] || []);
          setRecentTasks((results[4] || []).slice(0, 8));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full gap-2" style={{ color: "var(--accent-rose)" }}>
        <AlertCircle size={18} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const statCards = stats ? [
    { icon: FolderOpen, label: "Проекты", value: stats.active_projects, color: "var(--accent-blue)" },
    { icon: ClipboardList, label: "Бэклог", value: stats.tasks_backlog, color: "var(--accent-amber)" },
    { icon: ListChecks, label: "В работе", value: stats.tasks_in_progress, color: "var(--accent-teal)" },
    { icon: Eye, label: "На проверке", value: stats.tasks_review_operator + stats.tasks_review_manager, color: "var(--accent-lavender)" },
    { icon: CheckCircle2, label: "Выполнено (нед.)", value: stats.completed_this_week, color: "var(--accent-green)" },
    ...(orgRole === "owner" ? [{ icon: DollarSign, label: "Расходы, $", value: stats.total_cost_usd.toFixed(2), color: "var(--accent-rose)" }] : []),
  ] : [];

  const statusColors: Record<string, string> = {
    backlog: "var(--text-tertiary)",
    in_progress: "var(--accent-blue)",
    review_operator: "var(--accent-amber)",
    review_manager: "var(--accent-lavender)",
    done: "var(--accent-green)",
    failed: "var(--accent-rose)",
    pending: "var(--text-tertiary)",
    active: "var(--accent-blue)",
    paused: "var(--accent-amber)",
    completed: "var(--accent-green)",
  };

  const statusLabels: Record<string, string> = {
    backlog: "Бэклог",
    in_progress: "В работе",
    review_operator: "Проверка",
    review_manager: "Ревью",
    done: "Готово",
    failed: "Ошибка",
    pending: "Ожидание",
    active: "Активен",
    paused: "Пауза",
    completed: "Завершён",
  };

  const actionLabels: Record<string, string> = {
    created_organization: "создал организацию",
    invited_member: "пригласил",
    changed_member_role: "изменил роль",
    removed_member: "удалил участника",
    task_status_changed: "изменил статус задачи",
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Дашборд</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            {isManager ? `${stats?.total_members || 0} участников · ${stats?.total_tasks || 0} задач` : "Ваше рабочее пространство"}
          </p>
        </motion.div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={16} style={{ color: card.color }} />
                  <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{card.label}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tasks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-xl p-5"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Последние задачи</h2>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("kanban")}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: "var(--accent-blue)" }}
                >
                  Kanban <ArrowRight size={12} />
                </button>
              )}
            </div>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--text-tertiary)" }}>
                <ClipboardList size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Задач пока нет</p>
                <p className="text-xs mt-1">Создайте цель — AI разобьёт её на задачи</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: "var(--bg-base)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColors[task.status] || "var(--text-tertiary)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{task.title}</div>
                      <div className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {task.goal_title && <span>{task.goal_title}</span>}
                        {task.created_by_ai && (
                          <span className="flex items-center gap-0.5">
                            <Bot size={10} /> AI
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        color: statusColors[task.status],
                        backgroundColor: `color-mix(in srgb, ${statusColors[task.status] || "gray"} 15%, transparent)`,
                      }}
                    >
                      {statusLabels[task.status] || task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Team */}
            {isManager && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl p-5"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Команда</h2>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate("team")}
                      className="flex items-center gap-1 text-xs transition-colors"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      Все <ArrowRight size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {members.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        {(m.name || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {m.name || m.email}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {m.org_role === "owner" ? "Руководитель" : m.org_role === "manager" ? "Менеджер" : "Сотрудник"}
                          {m.tasks_used_this_month > 0 && ` · ${m.tasks_used_this_month} задач`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Activity */}
            {isManager && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl p-5"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Активность</h2>
                {activity.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>Нет активности</p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 8).map((a) => (
                      <div key={a.id} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "var(--accent-blue)" }} />
                        <div>
                          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--text-primary)" }} className="font-medium">{a.user_name}</span>{" "}
                            {actionLabels[a.action] || a.action}
                            {a.target && <> · <span style={{ color: "var(--text-primary)" }}>{a.target}</span></>}
                          </div>
                          {a.created_at && (
                            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              {new Date(a.created_at).toLocaleString("ru")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Проекты</h2>
              {goals.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>Нет проектов</p>
              ) : (
                <div className="space-y-2">
                  {goals.slice(0, 5).map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: "var(--bg-base)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statusColors[g.status] || "var(--text-tertiary)" }}
                      />
                      <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{g.title}</span>
                      <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: statusColors[g.status] }}>
                        {statusLabels[g.status] || g.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
