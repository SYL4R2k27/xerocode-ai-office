import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart3, DollarSign, Users, CheckCircle2, Clock, Loader2, AlertCircle, TrendingUp,
} from "lucide-react";
import { api, type OrgStats, type OrgMember, type OrgTask } from "../../lib/api";

interface ReportsPageProps {
  orgRole: "owner" | "manager" | "member";
}

export function ReportsPage({ orgRole }: ReportsPageProps) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [loading, setLoading] = useState(true);
  const isManager = orgRole === "owner" || orgRole === "manager";

  useEffect(() => {
    if (!isManager) { setLoading(false); return; }
    async function load() {
      try {
        const [s, m, t] = await Promise.all([
          api.org.getStats(),
          api.org.getMembers(),
          api.org.getTasks(),
        ]);
        setStats(s);
        setMembers(m);
        setTasks(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isManager]);

  if (!isManager) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
        <p className="text-sm">Отчёты доступны руководителям и менеджерам</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  // Compute report data
  const tasksByStatus = {
    backlog: tasks.filter(t => ["backlog", "pending", "assigned"].includes(t.status)).length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => ["review_operator", "review_manager"].includes(t.status)).length,
    done: tasks.filter(t => t.status === "done").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;
  const aiTasks = tasks.filter(t => t.created_by_ai).length;
  const aiRatio = totalTasks > 0 ? Math.round((aiTasks / totalTasks) * 100) : 0;

  // Tasks per member (approximate — by goal ownership)
  const memberTaskCounts = members.map(m => ({
    name: m.name || m.email,
    role: m.org_role,
    tasks: m.tasks_used_this_month,
  })).sort((a, b) => b.tasks - a.tasks);

  const maxMemberTasks = Math.max(1, ...memberTaskCounts.map(m => m.tasks));

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Отчёты</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Аналитика команды и задач</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: BarChart3, label: "Всего задач", value: totalTasks, color: "var(--accent-blue)" },
            { icon: CheckCircle2, label: "Выполнение", value: `${completionRate}%`, color: "var(--accent-green)" },
            { icon: TrendingUp, label: "AI-задачи", value: `${aiRatio}%`, color: "var(--accent-lavender)" },
            ...(orgRole === "owner" ? [{ icon: DollarSign, label: "Расходы", value: `$${stats?.total_cost_usd.toFixed(2) || "0"}`, color: "var(--accent-amber)" }] : []),
            ...(orgRole !== "owner" ? [{ icon: Users, label: "Команда", value: stats?.total_members || 0, color: "var(--accent-teal)" }] : []),
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <c.icon size={16} style={{ color: c.color }} className="mb-2" />
              <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{c.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{c.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Задачи по статусам</h2>
            <div className="space-y-3">
              {[
                { label: "Бэклог", value: tasksByStatus.backlog, color: "var(--text-tertiary)" },
                { label: "В работе", value: tasksByStatus.in_progress, color: "var(--accent-blue)" },
                { label: "На проверке", value: tasksByStatus.review, color: "var(--accent-amber)" },
                { label: "Готово", value: tasksByStatus.done, color: "var(--accent-green)" },
                { label: "Ошибки", value: tasksByStatus.failed, color: "var(--accent-rose)" },
              ].map(s => {
                const pct = totalTasks > 0 ? (s.value / totalTasks) * 100 : 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                      <span style={{ color: s.color }} className="font-medium">{s.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Tasks per member */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Активность участников</h2>
            {memberTaskCounts.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>Нет данных</p>
            ) : (
              <div className="space-y-3">
                {memberTaskCounts.map((m, i) => {
                  const pct = (m.tasks / maxMemberTasks) * 100;
                  const roleColors: Record<string, string> = { owner: "var(--accent-amber)", manager: "var(--accent-blue)", member: "var(--accent-teal)" };
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-secondary)" }}>{m.name}</span>
                        <span style={{ color: "var(--text-primary)" }} className="font-medium">{m.tasks} задач</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: roleColors[m.role || "member"] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Workflow funnel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Воронка Workflow</h2>
          <div className="flex items-end gap-2 h-[120px]">
            {[
              { label: "Бэклог", value: tasksByStatus.backlog, color: "var(--text-tertiary)" },
              { label: "В работе", value: tasksByStatus.in_progress, color: "var(--accent-blue)" },
              { label: "Проверка", value: tasksByStatus.review, color: "var(--accent-amber)" },
              { label: "Готово", value: tasksByStatus.done, color: "var(--accent-green)" },
            ].map((s, i) => {
              const maxVal = Math.max(1, tasksByStatus.backlog, tasksByStatus.in_progress, tasksByStatus.review, tasksByStatus.done);
              const h = Math.max(8, (s.value / maxVal) * 100);
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                    className="w-full rounded-t-lg"
                    style={{ backgroundColor: s.color, minHeight: 4 }}
                  />
                  <span className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
