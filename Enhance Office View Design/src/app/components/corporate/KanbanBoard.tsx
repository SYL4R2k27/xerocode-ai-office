import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, Play, Check, RotateCcw, Eye, Loader2,
  Plus, Filter, Search, GripVertical, AlertCircle,
  Sparkles, ClipboardList, ArrowRight, X, User, Calendar,
  List, Clock, KanbanSquare,
} from "lucide-react";
import { api, type OrgTask, type OrgMember } from "../../lib/api";
import { TaskListView } from "./TaskListView";
import { TaskDeadlineView } from "./TaskDeadlineView";
import { TaskDetailPanel } from "./TaskDetailPanel";

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
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "deadlines">("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newPriority, setNewPriority] = useState(0);
  const [newDueDate, setNewDueDate] = useState("");
  const [creating, setCreating] = useState(false);
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

  useEffect(() => {
    if ((showCreate || selectedTaskId) && members.length === 0) {
      api.org.getMembers().then(setMembers).catch(console.error);
    }
  }, [showCreate, selectedTaskId, members.length]);

  const handleCreateTask = useCallback(async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
      const token = localStorage.getItem("ai_office_token");
      const resp = await fetch(`${API_BASE}/org/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          assignee_user_id: newAssignee || undefined,
          priority: newPriority,
          due_date: newDueDate || undefined,
          status: "backlog",
        }),
      });
      if (resp.ok) {
        const task = await resp.json();
        setTasks(prev => [task, ...prev]);
        setShowCreate(false);
        setNewTitle(""); setNewDesc(""); setNewAssignee(""); setNewPriority(0); setNewDueDate("");
      }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  }, [newTitle, newDesc, newAssignee, newPriority, newDueDate]);

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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Задачи</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{tasks.length} задач</p>
          </div>
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
            {([["kanban", "Канбан", KanbanSquare], ["list", "Список", List], ["deadlines", "Сроки", Clock]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setViewMode(id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === id ? "var(--bg-surface)" : "transparent",
                  color: viewMode === id ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: viewMode === id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
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
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            <Plus size={13} /> Задача
          </button>
        </div>
      </motion.div>

      {/* Views */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-hidden">
          <TaskListView tasks={tasks} onOpenTask={(id) => setSelectedTaskId(id)} />
        </div>
      )}

      {viewMode === "deadlines" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TaskDeadlineView tasks={tasks} onOpenTask={(id) => setSelectedTaskId(id)} />
        </div>
      )}

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={loadTasks}
            members={members.map(m => ({ id: m.id, name: m.name || m.email, email: m.email }))}
          />
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      {viewMode === "kanban" && <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
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
      </div>}

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[460px] rounded-2xl p-6"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Новая задача</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Название *</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Что нужно сделать?" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Описание</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Подробности..." rows={3} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Исполнитель</label>
                    <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                      <option value="">Не назначен</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Приоритет</label>
                    <select value={newPriority} onChange={e => setNewPriority(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                      <option value={0}>Низкий</option>
                      <option value={5}>Средний</option>
                      <option value={8}>Высокий</option>
                      <option value={10}>Критичный</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Срок</label>
                  <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
                  <button onClick={handleCreateTask} disabled={!newTitle.trim() || creating} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}>
                    {creating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Создать"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
