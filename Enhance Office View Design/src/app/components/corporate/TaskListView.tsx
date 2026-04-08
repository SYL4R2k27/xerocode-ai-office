import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowUp, ArrowDown, Flag, CheckSquare, Tag,
  User, Calendar, AlertCircle, Clock,
} from "lucide-react";

/* ── Priority helpers ── */
function priorityMeta(p: number) {
  if (p >= 9) return { label: "Крит", color: "var(--accent-rose)", icon: "🔴" };
  if (p >= 6) return { label: "Выс", color: "var(--accent-amber)", icon: "🟠" };
  if (p >= 3) return { label: "Сред", color: "var(--accent-blue)", icon: "🔵" };
  return { label: "Низ", color: "var(--text-tertiary)", icon: "⚪" };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  backlog:         { label: "Бэклог",   color: "var(--text-tertiary)", bg: "rgba(148,163,184,0.12)" },
  pending:         { label: "Ожидает",   color: "var(--text-tertiary)", bg: "rgba(148,163,184,0.12)" },
  assigned:        { label: "Назначено", color: "var(--accent-blue)",  bg: "rgba(59,130,246,0.12)" },
  in_progress:     { label: "В работе",  color: "var(--accent-blue)",  bg: "rgba(59,130,246,0.12)" },
  review_operator: { label: "Проверка",  color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" },
  review_manager:  { label: "Ревью",     color: "var(--accent-lavender)", bg: "rgba(167,139,250,0.12)" },
  done:            { label: "Готово",     color: "var(--accent-green)", bg: "rgba(34,197,94,0.12)" },
  failed:          { label: "Ошибка",    color: "var(--accent-rose)",  bg: "rgba(239,68,68,0.12)" },
};

function statusInfo(s: string) {
  return STATUS_MAP[s] || { label: s, color: "var(--text-tertiary)", bg: "rgba(148,163,184,0.12)" };
}

/* ── Types ── */
interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
  assignee_name?: string | null;
  operator_name?: string | null;
  due_date?: string | null;
  checklist?: { id: string; done: boolean }[];
  tags?: string[];
  [key: string]: any;
}

interface TaskListViewProps {
  tasks: Task[];
  onOpenTask: (id: string) => void;
}

type SortKey = "title" | "status" | "priority" | "assignee" | "due_date";
type SortDir = "asc" | "desc";

/* ── Columns definition ── */
const COLUMNS: { key: SortKey; label: string; width?: string; icon: React.ElementType }[] = [
  { key: "title",     label: "Название",      icon: CheckSquare },
  { key: "status",    label: "Статус",         width: "120px", icon: Flag },
  { key: "priority",  label: "Приоритет",      width: "110px", icon: Flag },
  { key: "assignee",  label: "Исполнитель",    width: "150px", icon: User },
  { key: "due_date",  label: "Крайний срок",   width: "130px", icon: Calendar },
];

/* ── Component ── */
export function TaskListView({ tasks, onOpenTask }: TaskListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "priority" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "", "ru");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "priority":
          cmp = (a.priority || 0) - (b.priority || 0);
          break;
        case "assignee":
          cmp = (a.assignee_name || a.operator_name || "").localeCompare(
            b.assignee_name || b.operator_name || "", "ru"
          );
          break;
        case "due_date": {
          const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          cmp = da - db;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortKey, sortDir]);

  const isOverdue = (d: string | null | undefined) => {
    if (!d) return false;
    return new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();
  };

  /* ── Styles ── */
  const s = {
    container: {
      borderRadius: 12, overflow: "hidden",
      border: "1px solid var(--border-primary)",
      background: "var(--bg-surface)",
    },
    headerRow: {
      display: "grid",
      gridTemplateColumns: "40px 1fr 120px 110px 150px 130px 80px 100px",
      padding: "0 12px", borderBottom: "1px solid var(--border-primary)",
      background: "var(--bg-elevated)",
    },
    headerCell: (active: boolean) => ({
      padding: "10px 8px", fontSize: 12, fontWeight: 600,
      color: active ? "var(--accent-blue)" : "var(--text-tertiary)",
      cursor: "pointer", userSelect: "none" as const,
      display: "flex", alignItems: "center", gap: 4,
      transition: "color 0.15s",
    }),
    row: (idx: number) => ({
      display: "grid",
      gridTemplateColumns: "40px 1fr 120px 110px 150px 130px 80px 100px",
      padding: "0 12px", cursor: "pointer",
      background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
      borderBottom: "1px solid var(--border-primary)",
      transition: "background 0.15s",
    }),
    cell: {
      padding: "10px 8px", fontSize: 14, color: "var(--text-primary)",
      display: "flex", alignItems: "center", gap: 6, overflow: "hidden",
    },
    badge: (color: string, bg: string) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500,
      color, background: bg, whiteSpace: "nowrap" as const,
    }),
    overdueBadge: {
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: "var(--accent-rose)", background: "rgba(239,68,68,0.12)",
    },
    avatar: {
      width: 24, height: 24, borderRadius: "50%",
      background: "var(--accent-blue)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 600, flexShrink: 0,
    },
  };

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc"
      ? <ArrowUp size={12} style={{ opacity: 0.7 }} />
      : <ArrowDown size={12} style={{ opacity: 0.7 }} />;
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.headerRow}>
        <div style={{ ...s.headerCell(false), cursor: "default" }}>
          <CheckSquare size={14} style={{ color: "var(--text-tertiary)" }} />
        </div>
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            style={s.headerCell(sortKey === col.key)}
            onClick={() => handleSort(col.key)}
          >
            {col.label} <SortArrow col={col.key} />
          </div>
        ))}
        {/* Checklist + Tags columns (not sortable) */}
        <div style={{ ...s.headerCell(false), cursor: "default" }}>Чек-лист</div>
        <div style={{ ...s.headerCell(false), cursor: "default" }}>Теги</div>
      </div>

      {/* Rows */}
      {sorted.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
          Задачи не найдены
        </div>
      )}
      {sorted.map((task, idx) => {
        const st = statusInfo(task.status);
        const pri = priorityMeta(task.priority);
        const assignee = task.assignee_name || task.operator_name || null;
        const overdue = isOverdue(task.due_date);
        const checklist = task.checklist || [];
        const checkDone = checklist.filter((c: any) => c.done).length;
        const tags = task.tags || [];

        return (
          <motion.div
            key={task.id}
            style={s.row(idx)}
            onClick={() => onOpenTask(task.id)}
            whileHover={{ background: "var(--bg-elevated)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            {/* Checkbox placeholder */}
            <div style={s.cell}>
              <div
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: task.status === "done" ? "none" : "2px solid var(--border-primary)",
                  background: task.status === "done" ? "var(--accent-green)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {task.status === "done" && <CheckSquare size={14} style={{ color: "#fff" }} />}
              </div>
            </div>

            {/* Title */}
            <div style={{ ...s.cell, fontWeight: 500 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {task.title}
              </span>
            </div>

            {/* Status */}
            <div style={s.cell}>
              <span style={s.badge(st.color, st.bg)}>{st.label}</span>
            </div>

            {/* Priority */}
            <div style={s.cell}>
              <Flag size={14} style={{ color: pri.color }} />
              <span style={{ color: pri.color, fontSize: 13 }}>{pri.label}</span>
            </div>

            {/* Assignee */}
            <div style={s.cell}>
              {assignee ? (
                <>
                  <div style={s.avatar}>{assignee[0]}</div>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>
                    {assignee}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>—</span>
              )}
            </div>

            {/* Due date */}
            <div style={s.cell}>
              {task.due_date ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {overdue && (
                    <span style={s.overdueBadge}>
                      <AlertCircle size={10} /> просрочено
                    </span>
                  )}
                  {!overdue && (
                    <span style={{ fontSize: 13 }}>
                      {new Date(task.due_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>—</span>
              )}
            </div>

            {/* Checklist */}
            <div style={s.cell}>
              {checklist.length > 0 ? (
                <span style={{ fontSize: 12, color: checkDone === checklist.length ? "var(--accent-green)" : "var(--text-secondary)" }}>
                  {checkDone}/{checklist.length}
                </span>
              ) : (
                <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>
              )}
            </div>

            {/* Tags */}
            <div style={{ ...s.cell, gap: 4, overflow: "hidden" }}>
              {tags.length > 0 ? (
                <div style={{ display: "flex", gap: 4, overflow: "hidden" }}>
                  {tags.slice(0, 2).map((t: string) => (
                    <span key={t} style={{
                      padding: "1px 6px", borderRadius: 4, fontSize: 11,
                      background: "var(--bg-elevated)", color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                    }}>
                      {t}
                    </span>
                  ))}
                  {tags.length > 2 && (
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>+{tags.length - 2}</span>
                  )}
                </div>
              ) : (
                <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
