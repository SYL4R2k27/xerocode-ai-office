import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Edit3, Save, User, Calendar, Flag, Tag, Users,
  Eye, CheckSquare, Square, Plus, Trash2, Paperclip,
  Send, Clock, Loader2, AlertCircle, ChevronDown,
  ListChecks, GitBranch, MessageSquare, FileText,
  Upload, Timer, CheckCircle2,
} from "lucide-react";

/* ── API helpers (matches project pattern) ── */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

/* ── Priority helpers ── */
function priorityMeta(p: number) {
  if (p >= 9) return { label: "Критичный", color: "var(--accent-rose)", bg: "rgba(239,68,68,0.12)" };
  if (p >= 6) return { label: "Высокий", color: "var(--accent-amber)", bg: "rgba(245,158,11,0.12)" };
  if (p >= 3) return { label: "Средний", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" };
  return { label: "Низкий", color: "var(--text-tertiary)", bg: "rgba(148,163,184,0.12)" };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  backlog:           { label: "Бэклог",   color: "var(--text-tertiary)" },
  pending:           { label: "Ожидает",   color: "var(--text-tertiary)" },
  assigned:          { label: "Назначено", color: "var(--accent-blue)" },
  in_progress:       { label: "В работе",  color: "var(--accent-blue)" },
  review_operator:   { label: "Проверка",  color: "var(--accent-amber)" },
  review_manager:    { label: "Ревью",     color: "var(--accent-lavender)" },
  done:              { label: "Готово",     color: "var(--accent-green)" },
  failed:            { label: "Ошибка",    color: "var(--accent-rose)" },
};

function statusBadge(s: string) {
  const m = STATUS_MAP[s] || { label: s, color: "var(--text-tertiary)" };
  return m;
}

/* ── Types ── */
interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  user_name: string;
  hours: number;
  comment: string;
  created_at: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  url?: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  created_by: string;
  created_by_name: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  tags: string[];
  co_executors: { id: string; name: string }[];
  observers: { id: string; name: string }[];
  checklist: ChecklistItem[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  time_entries: TimeEntry[];
  planned_hours: number;
  actual_hours: number;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
  members: Member[];
}

/* ── Component ── */
export function TaskDetailPanel({ taskId, onClose, onUpdate, members }: TaskDetailPanelProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* Editable state */
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);

  /* New items */
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeComment, setTimeComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingTime, setSendingTime] = useState(false);
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  /* People pickers */
  const [showCoExPicker, setShowCoExPicker] = useState(false);
  const [showObsPicker, setShowObsPicker] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  /* ── Load task detail ── */
  const loadTask = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/org/tasks/${taskId}/detail`, { headers: authHeaders() });
      if (!res.ok) {
        // Fallback: use basic task endpoint
        const res2 = await fetch(`${API_BASE}/org/tasks`, { headers: authHeaders() });
        if (!res2.ok) throw new Error("Не удалось загрузить задачу");
        const tasks = await res2.json();
        const found = tasks.find((t: any) => t.id === taskId);
        if (!found) throw new Error("Задача не найдена");
        setTask({
          ...found,
          tags: found.tags || [],
          co_executors: found.co_executors || [],
          observers: found.observers || [],
          checklist: found.checklist || [],
          subtasks: found.subtasks || [],
          attachments: found.attachments || [],
          comments: found.comments || [],
          time_entries: found.time_entries || [],
          planned_hours: found.planned_hours || 0,
          actual_hours: found.actual_hours || 0,
          created_by: found.created_by || found.operator_id || "",
          created_by_name: found.created_by_name || found.operator_name || "—",
          assignee_id: found.assignee_id || found.operator_id || null,
          assignee_name: found.assignee_name || found.operator_name || null,
          due_date: found.due_date || null,
        });
        return;
      }
      const data = await res.json();
      setTask({
        ...data,
        tags: data.tags || [],
        co_executors: data.co_executors || [],
        observers: data.observers || [],
        checklist: data.checklist || [],
        subtasks: data.subtasks || [],
        attachments: data.attachments || [],
        comments: data.comments || [],
        time_entries: data.time_entries || [],
        planned_hours: data.planned_hours || 0,
        actual_hours: data.actual_hours || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { loadTask(); }, [loadTask]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [editingTitle]);

  /* ── Patch helper ── */
  const patchTask = async (updates: Record<string, any>) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/org/tasks/${taskId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      await loadTask();
      onUpdate();
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  /* ── Handlers ── */
  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== task?.title) patchTask({ title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const toggleCheckItem = (itemId: string) => {
    if (!task) return;
    const updated = task.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    );
    patchTask({ checklist: updated });
    setTask({ ...task, checklist: updated });
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim() || !task) return;
    const item: ChecklistItem = {
      id: `cl_${Date.now()}`,
      text: newCheckItem.trim(),
      done: false,
    };
    const updated = [...task.checklist, item];
    patchTask({ checklist: updated });
    setTask({ ...task, checklist: updated });
    setNewCheckItem("");
  };

  const removeCheckItem = (itemId: string) => {
    if (!task) return;
    const updated = task.checklist.filter((c) => c.id !== itemId);
    patchTask({ checklist: updated });
    setTask({ ...task, checklist: updated });
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await fetch(`${API_BASE}/org/tasks/${taskId}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setCommentText("");
      await loadTask();
    } catch { /* silent */ } finally {
      setSendingComment(false);
    }
  };

  const createSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setCreatingSubtask(true);
    try {
      await fetch(`${API_BASE}/org/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });
      setNewSubtaskTitle("");
      await loadTask();
      onUpdate();
    } catch { /* silent */ } finally {
      setCreatingSubtask(false);
    }
  };

  const logTime = async () => {
    const h = parseFloat(timeHours);
    if (!h || h <= 0) return;
    setSendingTime(true);
    try {
      await fetch(`${API_BASE}/org/tasks/${taskId}/time`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ hours: h, comment: timeComment.trim() }),
      });
      setTimeHours("");
      setTimeComment("");
      await loadTask();
    } catch { /* silent */ } finally {
      setSendingTime(false);
    }
  };

  const togglePerson = (list: "co_executors" | "observers", personId: string) => {
    if (!task) return;
    const current = task[list];
    const exists = current.find((p) => p.id === personId);
    const member = members.find((m) => m.id === personId);
    if (!member) return;
    const updated = exists
      ? current.filter((p) => p.id !== personId)
      : [...current, { id: member.id, name: member.name }];
    patchTask({ [list]: updated });
    setTask({ ...task, [list]: updated });
  };

  /* ── Styles ── */
  const s = {
    overlay: {
      position: "fixed" as const, inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "flex-end",
    },
    panel: {
      width: "min(680px, 95vw)", height: "100vh", overflowY: "auto" as const,
      background: "var(--bg-surface)", borderLeft: "1px solid var(--border-primary)",
      display: "flex", flexDirection: "column" as const,
    },
    header: {
      padding: "20px 24px 16px", borderBottom: "1px solid var(--border-primary)",
      display: "flex", alignItems: "flex-start", gap: 12, position: "sticky" as const,
      top: 0, background: "var(--bg-surface)", zIndex: 2,
    },
    section: {
      padding: "16px 24px", borderBottom: "1px solid var(--border-primary)",
    },
    sectionTitle: {
      fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
      marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
    },
    badge: (color: string, bg?: string) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
      color, background: bg || `${color}18`,
    }),
    infoRow: {
      display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      fontSize: 14, color: "var(--text-primary)",
    },
    infoLabel: {
      width: 120, flexShrink: 0, color: "var(--text-tertiary)", fontSize: 13,
    },
    btn: (accent = false) => ({
      padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6,
      background: accent ? "var(--accent-blue)" : "var(--bg-elevated)",
      color: accent ? "#fff" : "var(--text-primary)",
      transition: "opacity 0.15s",
    }),
    input: {
      padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-primary)",
      background: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13,
      outline: "none", width: "100%",
    },
    avatar: (size = 28) => ({
      width: size, height: size, borderRadius: "50%",
      background: "var(--accent-blue)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 600, flexShrink: 0,
    }),
    chip: {
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 12, fontSize: 12,
      background: "var(--bg-elevated)", color: "var(--text-secondary)",
    },
  };

  /* ── Render ── */
  if (loading) {
    return (
      <motion.div style={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div style={s.panel} initial={{ x: 700 }} animate={{ x: 0 }} exit={{ x: 700 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--text-tertiary)" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            Загрузка...
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (error || !task) {
    return (
      <motion.div style={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div style={s.panel} initial={{ x: 700 }} animate={{ x: 0 }} exit={{ x: 700 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--accent-rose)" }}>
            <AlertCircle size={20} /> {error || "Задача не найдена"}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const pri = priorityMeta(task.priority);
  const st = statusBadge(task.status);
  const checkDone = task.checklist.filter((c) => c.done).length;
  const checkTotal = task.checklist.length;

  return (
    <motion.div style={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={panelRef}
        style={s.panel}
        initial={{ x: 700 }}
        animate={{ x: 0 }}
        exit={{ x: 700 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={s.header}>
          <div style={{ flex: 1 }}>
            {editingTitle ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={titleInputRef}
                  style={{ ...s.input, fontSize: 18, fontWeight: 700 }}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                />
                <button style={s.btn(true)} onClick={saveTitle}><Save size={14} /></button>
              </div>
            ) : (
              <h2
                style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer", margin: 0, display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
              >
                {task.title}
                <Edit3 size={14} style={{ color: "var(--text-tertiary)", opacity: 0.6 }} />
              </h2>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <span style={s.badge(st.color)}>{st.label}</span>
              <span style={s.badge(pri.color, pri.bg)}>
                <Flag size={12} /> {pri.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ ...s.btn(), padding: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Info grid ── */}
        <div style={s.section}>
          {/* Постановщик */}
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Постановщик</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={s.avatar()}>{(task.created_by_name || "?")[0]}</div>
              <span>{task.created_by_name || "—"}</span>
            </div>
          </div>

          {/* Исполнитель */}
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Исполнитель</span>
            {editingAssignee ? (
              <div style={{ display: "flex", gap: 6, flex: 1, position: "relative" }}>
                <select
                  style={{ ...s.input, width: "auto", flex: 1 }}
                  value={task.assignee_id || ""}
                  onChange={(e) => {
                    const m = members.find((mm) => mm.id === e.target.value);
                    patchTask({ assignee_id: e.target.value || null });
                    if (m) setTask({ ...task, assignee_id: m.id, assignee_name: m.name });
                    setEditingAssignee(false);
                  }}
                  onBlur={() => setEditingAssignee(false)}
                  autoFocus
                >
                  <option value="">Не назначен</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                onClick={() => setEditingAssignee(true)}
              >
                <div style={s.avatar()}>{(task.assignee_name || "?")[0]}</div>
                <span>{task.assignee_name || "Не назначен"}</span>
                <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
              </div>
            )}
          </div>

          {/* Крайний срок */}
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Крайний срок</span>
            {editingDueDate ? (
              <input
                type="date"
                style={{ ...s.input, width: "auto" }}
                value={task.due_date ? task.due_date.split("T")[0] : ""}
                onChange={(e) => {
                  patchTask({ due_date: e.target.value || null });
                  setTask({ ...task, due_date: e.target.value || null });
                  setEditingDueDate(false);
                }}
                onBlur={() => setEditingDueDate(false)}
                autoFocus
              />
            ) : (
              <span
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setEditingDueDate(true)}
              >
                <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
                {task.due_date ? new Date(task.due_date).toLocaleDateString("ru-RU") : "Не указан"}
                <Edit3 size={12} style={{ color: "var(--text-tertiary)", opacity: 0.5 }} />
              </span>
            )}
          </div>

          {/* Приоритет */}
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Приоритет</span>
            {editingPriority ? (
              <select
                style={{ ...s.input, width: "auto" }}
                value={task.priority}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  patchTask({ priority: v });
                  setTask({ ...task, priority: v });
                  setEditingPriority(false);
                }}
                onBlur={() => setEditingPriority(false)}
                autoFocus
              >
                <option value={0}>Низкий (0)</option>
                <option value={3}>Средний (3)</option>
                <option value={6}>Высокий (6)</option>
                <option value={9}>Критичный (9)</option>
              </select>
            ) : (
              <span
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setEditingPriority(true)}
              >
                <Flag size={14} style={{ color: pri.color }} />
                <span style={{ color: pri.color }}>{pri.label}</span>
                <Edit3 size={12} style={{ color: "var(--text-tertiary)", opacity: 0.5 }} />
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Теги</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {task.tags.map((t) => (
                  <span key={t} style={s.chip}><Tag size={10} /> {t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Participants ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}><Users size={14} /> Участники</div>

          {/* Соисполнители */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6 }}>Соисполнители</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {task.co_executors.map((p) => (
                <div key={p.id} style={{ ...s.chip, gap: 6 }}>
                  <div style={s.avatar(20)}>{p.name[0]}</div>
                  {p.name}
                </div>
              ))}
              <button style={{ ...s.btn(), padding: "4px 8px" }} onClick={() => setShowCoExPicker(!showCoExPicker)}>
                <Plus size={14} />
              </button>
            </div>
            <AnimatePresence>
              {showCoExPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden", marginTop: 6 }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, background: "var(--bg-base)", borderRadius: 8 }}>
                    {members.map((m) => {
                      const active = task.co_executors.some((p) => p.id === m.id);
                      return (
                        <button
                          key={m.id}
                          style={{ ...s.chip, cursor: "pointer", border: "none", background: active ? "var(--accent-blue)" : "var(--bg-elevated)", color: active ? "#fff" : "var(--text-secondary)" }}
                          onClick={() => togglePerson("co_executors", m.id)}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Наблюдатели */}
          <div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6 }}>Наблюдатели</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {task.observers.map((p) => (
                <div key={p.id} style={{ ...s.chip, gap: 6 }}>
                  <div style={s.avatar(20)}>{p.name[0]}</div>
                  {p.name}
                </div>
              ))}
              <button style={{ ...s.btn(), padding: "4px 8px" }} onClick={() => setShowObsPicker(!showObsPicker)}>
                <Eye size={14} />
              </button>
            </div>
            <AnimatePresence>
              {showObsPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden", marginTop: 6 }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, background: "var(--bg-base)", borderRadius: 8 }}>
                    {members.map((m) => {
                      const active = task.observers.some((p) => p.id === m.id);
                      return (
                        <button
                          key={m.id}
                          style={{ ...s.chip, cursor: "pointer", border: "none", background: active ? "var(--accent-lavender)" : "var(--bg-elevated)", color: active ? "#fff" : "var(--text-secondary)" }}
                          onClick={() => togglePerson("observers", m.id)}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Checklist ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <ListChecks size={14} /> Чек-лист
            {checkTotal > 0 && (
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-tertiary)" }}>
                {checkDone}/{checkTotal}
              </span>
            )}
          </div>
          {checkTotal > 0 && (
            <div style={{ height: 4, borderRadius: 2, background: "var(--bg-elevated)", marginBottom: 10 }}>
              <motion.div
                style={{ height: "100%", borderRadius: 2, background: "var(--accent-green)" }}
                initial={{ width: 0 }}
                animate={{ width: `${(checkDone / checkTotal) * 100}%` }}
              />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {task.checklist.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: item.done ? "var(--accent-green)" : "var(--text-tertiary)", padding: 0 }}
                  onClick={() => toggleCheckItem(item.id)}
                >
                  {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)", textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.6 : 1 }}>
                  {item.text}
                </span>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 2, opacity: 0.5 }}
                  onClick={() => removeCheckItem(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              placeholder="Новый пункт..."
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCheckItem(); }}
            />
            <button style={s.btn()} onClick={addCheckItem}><Plus size={14} /></button>
          </div>
        </div>

        {/* ── Subtasks ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <GitBranch size={14} /> Подзадачи
            {task.subtasks.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-tertiary)" }}>
                {task.subtasks.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {task.subtasks.map((sub) => {
              const subSt = statusBadge(sub.status);
              return (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "var(--bg-base)" }}>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>{sub.title}</span>
                  <span style={s.badge(subSt.color)}>{subSt.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              placeholder="Новая подзадача..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createSubtask(); }}
            />
            <button style={s.btn(true)} onClick={createSubtask} disabled={creatingSubtask}>
              {creatingSubtask ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
              Подзадача
            </button>
          </div>
        </div>

        {/* ── Attachments ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}><Paperclip size={14} /> Вложения</div>
          {task.attachments.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0" }}>Нет вложений</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {task.attachments.map((att) => (
                <div key={att.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "var(--bg-base)" }}>
                  <FileText size={16} style={{ color: "var(--accent-blue)" }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{att.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} МБ` : `${(att.size / 1024).toFixed(0)} КБ`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button style={{ ...s.btn(), marginTop: 8 }}><Upload size={14} /> Загрузить файл</button>
        </div>

        {/* ── Comments ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}><MessageSquare size={14} /> Комментарии ({task.comments.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto", marginBottom: 10 }}>
            {task.comments.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0" }}>Нет комментариев</div>
            )}
            {task.comments.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={s.avatar(28)}>{(c.user_name || "?")[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.user_name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {new Date(c.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              placeholder="Написать комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
            />
            <button style={s.btn(true)} onClick={addComment} disabled={sendingComment}>
              {sendingComment ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* ── Time tracking ── */}
        <div style={{ ...s.section, borderBottom: "none" }}>
          <div style={s.sectionTitle}><Timer size={14} /> Учёт времени</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>План</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {task.planned_hours}ч
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Факт</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: task.actual_hours > task.planned_hours ? "var(--accent-rose)" : "var(--accent-green)" }}>
                {task.actual_hours}ч
              </div>
            </div>
          </div>

          {task.time_entries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {task.time_entries.map((te) => (
                <div key={te.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 0" }}>
                  <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{te.hours}ч</span>
                  <span style={{ color: "var(--text-secondary)", flex: 1 }}>{te.comment || "—"}</span>
                  <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                    {te.user_name} &middot; {new Date(te.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number"
              style={{ ...s.input, width: 80 }}
              placeholder="Часы"
              value={timeHours}
              onChange={(e) => setTimeHours(e.target.value)}
              min={0.25}
              step={0.25}
            />
            <input
              style={{ ...s.input, flex: 1 }}
              placeholder="Комментарий..."
              value={timeComment}
              onChange={(e) => setTimeComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") logTime(); }}
            />
            <button style={s.btn(true)} onClick={logTime} disabled={sendingTime}>
              {sendingTime ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
              Записать
            </button>
          </div>
        </div>

        {/* Saving indicator */}
        <AnimatePresence>
          {saving && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{
                position: "fixed", bottom: 20, right: 20, padding: "8px 16px", borderRadius: 8,
                background: "var(--accent-blue)", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 1100,
              }}
            >
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Сохранение...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
