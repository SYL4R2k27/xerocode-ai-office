import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flag, User, Clock, AlertCircle, CalendarDays,
  ChevronRight,
} from "lucide-react";

/* ── Priority helpers ── */
function priorityMeta(p: number) {
  if (p >= 9) return { label: "Крит", color: "var(--accent-rose)", bg: "rgba(239,68,68,0.12)" };
  if (p >= 6) return { label: "Выс", color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" };
  if (p >= 3) return { label: "Сред", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" };
  return { label: "Низ", color: "var(--text-tertiary)", bg: "rgba(148,163,184,0.12)" };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  backlog:         { label: "Бэклог",   color: "var(--text-tertiary)" },
  pending:         { label: "Ожидает",   color: "var(--text-tertiary)" },
  assigned:        { label: "Назначено", color: "var(--accent-blue)" },
  in_progress:     { label: "В работе",  color: "var(--accent-blue)" },
  review_operator: { label: "Проверка",  color: "var(--accent-amber)" },
  review_manager:  { label: "Ревью",     color: "var(--accent-lavender)" },
  done:            { label: "Готово",     color: "var(--accent-green)" },
  failed:          { label: "Ошибка",    color: "var(--accent-rose)" },
};

/* ── Types ── */
interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  assignee_name?: string | null;
  operator_name?: string | null;
  due_date?: string | null;
  [key: string]: any;
}

interface TaskDeadlineViewProps {
  tasks: Task[];
  onOpenTask: (id: string) => void;
}

/* ── Group definitions ── */
interface DeadlineGroup {
  id: string;
  label: string;
  emoji: string;
  headerColor: string;
  headerBg: string;
}

const GROUPS: DeadlineGroup[] = [
  { id: "overdue",    label: "Просрочено",     emoji: "\uD83D\uDD34", headerColor: "var(--accent-rose)",     headerBg: "rgba(239,68,68,0.10)" },
  { id: "today",      label: "Сегодня",        emoji: "\uD83D\uDFE1", headerColor: "var(--accent-amber)",    headerBg: "rgba(245,158,11,0.10)" },
  { id: "tomorrow",   label: "Завтра",         emoji: "\uD83D\uDD35", headerColor: "var(--accent-blue)",     headerBg: "rgba(59,130,246,0.10)" },
  { id: "this_week",  label: "На этой неделе", emoji: "\u26AA",       headerColor: "var(--text-secondary)",  headerBg: "rgba(148,163,184,0.08)" },
  { id: "later",      label: "Позже",          emoji: "\u2B1C",       headerColor: "var(--text-tertiary)",   headerBg: "rgba(148,163,184,0.05)" },
  { id: "no_date",    label: "Без срока",      emoji: "\u2B1C",       headerColor: "var(--text-tertiary)",   headerBg: "rgba(148,163,184,0.05)" },
];

/* ── Date helpers ── */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const end = new Date(d);
  end.setDate(end.getDate() + diff);
  return startOfDay(end);
}

function classifyTask(task: Task): string {
  if (!task.due_date) return "no_date";
  const now = new Date();
  const today = startOfDay(now);
  const due = startOfDay(new Date(task.due_date));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = endOfWeek(today);

  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  if (due.getTime() === tomorrow.getTime()) return "tomorrow";
  if (due <= weekEnd) return "this_week";
  return "later";
}

/* ── Component ── */
export function TaskDeadlineView({ tasks, onOpenTask }: TaskDeadlineViewProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    GROUPS.forEach((g) => { map[g.id] = []; });
    tasks.forEach((t) => {
      const groupId = classifyTask(t);
      map[groupId].push(t);
    });
    // Sort within groups: overdue by oldest first, others by due date asc
    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      });
    });
    return map;
  }, [tasks]);

  /* ── Styles ── */
  const s = {
    container: {
      display: "flex", flexDirection: "column" as const, gap: 16,
    },
    groupHeader: (g: DeadlineGroup) => ({
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px", borderRadius: 10,
      background: g.headerBg,
    }),
    groupLabel: (g: DeadlineGroup) => ({
      fontSize: 15, fontWeight: 700, color: g.headerColor, flex: 1,
      display: "flex", alignItems: "center", gap: 8,
    }),
    countBadge: (g: DeadlineGroup) => ({
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 24, height: 24, borderRadius: 12,
      background: g.headerColor, color: "#fff",
      fontSize: 12, fontWeight: 700, padding: "0 6px",
    }),
    card: {
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderRadius: 8, cursor: "pointer",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-primary)",
      transition: "border-color 0.15s, box-shadow 0.15s",
    },
    avatar: {
      width: 28, height: 28, borderRadius: "50%",
      background: "var(--accent-blue)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 600, flexShrink: 0,
    },
    badge: (color: string, bg: string) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
      color, background: bg, whiteSpace: "nowrap" as const,
    }),
  };

  return (
    <div style={s.container}>
      {GROUPS.map((group) => {
        const items = grouped[group.id];
        if (items.length === 0) return null;

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Group header */}
            <div style={s.groupHeader(group)}>
              <div style={s.groupLabel(group)}>
                <span style={{ fontSize: 18 }}>{group.emoji}</span>
                {group.label}
              </div>
              <div style={s.countBadge(group)}>{items.length}</div>
            </div>

            {/* Task cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, paddingLeft: 8 }}>
              {items.map((task, idx) => {
                const pri = priorityMeta(task.priority);
                const st = STATUS_MAP[task.status] || { label: task.status, color: "var(--text-tertiary)" };
                const assignee = task.assignee_name || task.operator_name || null;

                return (
                  <motion.div
                    key={task.id}
                    style={s.card}
                    onClick={() => onOpenTask(task.id)}
                    whileHover={{
                      borderColor: "var(--accent-blue)",
                      boxShadow: "0 2px 8px rgba(59,130,246,0.10)",
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    {/* Priority flag */}
                    <Flag size={16} style={{ color: pri.color, flexShrink: 0 }} />

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 500, color: "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {task.title}
                      </div>
                      {task.due_date && group.id !== "no_date" && (
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={11} />
                          {new Date(task.due_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                          {group.id === "overdue" && (
                            <span style={{ color: "var(--accent-rose)", fontWeight: 600, marginLeft: 4 }}>
                              просрочено
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    {assignee && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <div style={s.avatar}>{assignee[0]}</div>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {assignee}
                        </span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span style={s.badge(st.color, `${st.color}18`)}>{st.label}</span>

                    {/* Arrow */}
                    <ChevronRight size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{
          padding: "48px 0", textAlign: "center",
          color: "var(--text-tertiary)", fontSize: 14,
        }}>
          <Clock size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>Задачи не найдены</div>
        </div>
      )}
    </div>
  );
}
