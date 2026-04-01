import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, Play, Check, RotateCcw, Eye, Loader2,
  Plus, Filter, Search, GripVertical, AlertCircle,
  Sparkles, ClipboardList, ArrowRight, X,
} from "lucide-react";
import { api, type OrgTask } from "../../lib/api";

/* ── Column definitions ── */
const COLUMNS = [
  { id: "backlog", label: "Бэклог", color: "var(--text-tertiary)", icon: ClipboardList },
  { id: "in_progress", label: "В работе", color: "var(--accent-blue)", icon: Play },
  { id: "review_operator", label: "Проверка", color: "var(--accent-amber)", icon: Eye },
  { id: "review_manager", label: "Ревью", color: "var(--accent-lavender)", icon: Check },
  { id: "done", label: "Готово", color: "var(--accent-green)", icon: Check },
] as const;

type ColumnId = typeof COLUMNS[number]["id"];

/* ── Map legacy statuses ── */
function normalizeStatus(status: string): ColumnId {
  switch (status) {
    case "pending": case "assigned": case "backlog": return "backlog";
    case "in_progress": return "in_progress";
    case "review_operator": return "review_operator";
    case "review_manager": return "review_manager";
    case "done": return "done";
    case "failed": return "backlog";
    default: return "backlog";
  }
}

/* ── Priority helpers ── */
function priorityLabel(p: number): { label: string; color: string } {
  if (p >= 9) return { label: "Крит", color: "var(--accent-rose)" };
  if (p >= 6) return { label: "Выс", color: "var(--accent-amber)" };
  if (p >= 3) return { label: "Сред", color: "var(--accent-blue)" };
  return { label: "Низ", color: "var(--text-tertiary)" };
}

/* ── Interfaces ── */
interface KanbanBoardProps {
  orgRole: "owner" | "manager" | "member";
  onReviewAction?: (taskId: string, action: string, comment?: string) => void;
}

export function KanbanBoard({ orgRole }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const isManager = orgRole === "owner" || orgRole === "manager";

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.org.getTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  /* ── Workflow transition ── */
  const transition = useCallback(async (taskId: string, newStatus: string, comment?: string) => {
    setTransitioning(taskId);
    try {
      await api.org.transitionTask(taskId, newStatus, comment);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      console.error("Transition error:", err.message);
    } finally {
      setTransitioning(null);
    }
  }, []);

  /* ── Drag & drop ── */
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDragTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId || !dragTask) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentCol = normalizeStatus(task.status);
    if (currentCol === targetColumn) return;

    transition(taskId, targetColumn);
    setDragTask(null);
  }, [dragTask, tasks, transition]);

  /* ── Group tasks by column ── */
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter(t => normalizeStatus(t.status) === col.id)
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.priority - a.priority);
    return acc;
  }, {} as Record<ColumnId, OrgTask[]>);

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Kanban</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {tasks.length} задач · Перетаскивайте карточки между колонками
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-[180px] outline-none"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex gap-3 h-full min-w-max">
          {COLUMNS.map((col, ci) => {
            const colTasks = grouped[col.id];
            const ColIcon = col.icon;
            const isDragTarget = dragOver === col.id;

            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.05 }}
                className="w-[280px] flex-shrink-0 flex flex-col rounded-xl overflow-hidden transition-colors"
                style={{
                  backgroundColor: isDragTarget ? "color-mix(in srgb, var(--bg-surface) 90%, var(--accent-blue) 10%)" : "var(--bg-surface)",
                  border: `1px solid ${isDragTarget ? "var(--accent-blue)" : "var(--border-default)"}`,
                }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <ColIcon size={14} style={{ color: col.color }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{col.label}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colTasks.length === 0 ? (
                    <div className="flex items-center justify-center py-8" style={{ color: "var(--text-tertiary)" }}>
                      <p className="text-[11px]">Пусто</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        column={col.id}
                        orgRole={orgRole}
                        isTransitioning={transitioning === task.id}
                        onTransition={transition}
                        onDragStart={handleDragStart}
                        isDragging={dragTask === task.id}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Task Card ── */
function TaskCard({ task, column, orgRole, isTransitioning, onTransition, onDragStart, isDragging }: {
  task: OrgTask;
  column: ColumnId;
  orgRole: string;
  isTransitioning: boolean;
  onTransition: (id: string, status: string, comment?: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
}) {
  const prio = priorityLabel(task.priority);
  const isManager = orgRole === "owner" || orgRole === "manager";

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e: any) => onDragStart(e, task.id)}
      className="rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all group"
      style={{
        backgroundColor: "var(--bg-base)",
        border: "1px solid var(--border-subtle)",
        opacity: isDragging ? 0.5 : 1,
      }}
      whileHover={{ y: -1, borderColor: "var(--border-default)" }}
    >
      {/* Top row: priority + AI badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ color: prio.color, backgroundColor: `color-mix(in srgb, ${prio.color} 12%, transparent)` }}>
          {prio.label}
        </span>
        {task.created_by_ai && (
          <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ color: "var(--accent-lavender)", backgroundColor: "rgba(167,139,250,0.1)" }}>
            <Sparkles size={8} /> AI
          </span>
        )}
        {task.goal_title && (
          <span className="text-[9px] truncate ml-auto" style={{ color: "var(--text-tertiary)" }}>
            {task.goal_title}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-sm font-medium mb-2 leading-tight" style={{ color: "var(--text-primary)" }}>
        {task.title}
      </div>

      {/* Description preview */}
      {task.description && (
        <div className="text-[11px] mb-2 line-clamp-2 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          {task.description}
        </div>
      )}

      {/* Review comment */}
      {task.review_comment && (column === "review_operator" || column === "in_progress") && (
        <div className="text-[10px] p-2 rounded mb-2" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent-amber)" }}>
          Комментарий: {task.review_comment}
        </div>
      )}

      {/* Action buttons */}
      {!isTransitioning ? (
        <div className="flex gap-1.5 mt-1">
          {/* Backlog → запустить */}
          {column === "backlog" && (
            <button
              onClick={() => onTransition(task.id, "in_progress")}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
              style={{ backgroundColor: "rgba(129,140,248,0.1)", color: "var(--accent-blue)" }}
            >
              <Play size={10} /> Запустить
            </button>
          )}

          {/* review_operator → утвердить / вернуть */}
          {column === "review_operator" && (
            <>
              <button
                onClick={() => onTransition(task.id, "review_manager")}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                style={{ backgroundColor: "rgba(52,211,153,0.1)", color: "var(--accent-green)" }}
              >
                <Check size={10} /> Утвердить
              </button>
              <button
                onClick={() => onTransition(task.id, "in_progress", "Вернуть на доработку")}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                style={{ backgroundColor: "rgba(251,113,133,0.1)", color: "var(--accent-rose)" }}
              >
                <RotateCcw size={10} /> Вернуть
              </button>
            </>
          )}

          {/* review_manager → принять / вернуть (только manager/owner) */}
          {column === "review_manager" && isManager && (
            <>
              <button
                onClick={() => onTransition(task.id, "done")}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                style={{ backgroundColor: "rgba(52,211,153,0.1)", color: "var(--accent-green)" }}
              >
                <Check size={10} /> Принять
              </button>
              <button
                onClick={() => onTransition(task.id, "review_operator", "Требует доработки")}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                style={{ backgroundColor: "rgba(251,113,133,0.1)", color: "var(--accent-rose)" }}
              >
                <RotateCcw size={10} /> Вернуть
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-1" style={{ color: "var(--accent-blue)" }}>
          <Loader2 size={12} className="animate-spin" />
          <span className="text-[10px]">Обновление...</span>
        </div>
      )}
    </motion.div>
  );
}
