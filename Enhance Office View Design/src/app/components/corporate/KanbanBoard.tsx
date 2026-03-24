import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Calendar,
  ChevronDown,
  Check,
  RotateCcw,
  MessageSquare,
  Filter,
  Plus,
  X,
  GripVertical,
  Send,
} from "lucide-react";

// ====== Types ======

type KanbanStatus = "todo" | "in_progress" | "review" | "done";

interface KanbanTask {
  id: string;
  title: string;
  assignee_name: string;
  assignee_avatar?: string;
  ai_agent?: string;
  priority: "low" | "medium" | "high" | "critical";
  due_date?: string;
  status: KanbanStatus;
  project_name?: string;
}

// ====== Constants ======

const columns: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "todo", label: "TODO", color: "var(--text-tertiary)" },
  { id: "in_progress", label: "В РАБОТЕ", color: "var(--accent-blue)" },
  { id: "review", label: "РЕВЬЮ", color: "var(--accent-amber)" },
  { id: "done", label: "ГОТОВО", color: "var(--accent-teal)" },
];

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "var(--text-tertiary)", label: "Низкий" },
  medium: { color: "var(--accent-blue)", label: "Средний" },
  high: { color: "var(--accent-amber)", label: "Высокий" },
  critical: { color: "var(--accent-rose)", label: "Критический" },
};

// ====== Mock Data ======

const initialTasks: KanbanTask[] = [
  { id: "1", title: "Верстка главной страницы", assignee_name: "Алексей К.", priority: "high", status: "todo", project_name: "Редизайн лендинга", due_date: "2026-03-28" },
  { id: "2", title: "Настроить CI/CD пайплайн", assignee_name: "Дмитрий С.", priority: "medium", status: "todo", project_name: "API интеграция" },
  { id: "3", title: "Анализ конкурентов", assignee_name: "ИИ Агент", ai_agent: "GPT-4o", priority: "medium", status: "in_progress", project_name: "Аналитика" },
  { id: "4", title: "Написать тесты API", assignee_name: "Мария П.", priority: "high", status: "in_progress", project_name: "API интеграция", due_date: "2026-03-26" },
  { id: "5", title: "Генерация отчёта продаж", assignee_name: "ИИ Агент", ai_agent: "Claude", priority: "low", status: "in_progress", project_name: "Аналитика" },
  { id: "6", title: "Дизайн карточек товаров", assignee_name: "Елена В.", priority: "medium", status: "review", project_name: "Редизайн лендинга" },
  { id: "7", title: "Оптимизация запросов БД", assignee_name: "Сергей Н.", priority: "critical", status: "review", project_name: "API интеграция", due_date: "2026-03-25" },
  { id: "8", title: "Подготовить презентацию", assignee_name: "ИИ Агент", ai_agent: "GPT-4o", priority: "low", status: "done", project_name: "Аналитика" },
  { id: "9", title: "Настроить мониторинг", assignee_name: "Дмитрий С.", priority: "medium", status: "done", project_name: "API интеграция" },
  { id: "10", title: "SEO аудит страниц", assignee_name: "ИИ Агент", ai_agent: "Claude", priority: "high", status: "done", project_name: "Редизайн лендинга" },
];

// ====== Component ======

interface KanbanBoardProps {
  onReviewAction?: (taskId: string, action: string, comment?: string) => void;
}

export function KanbanBoard({ onReviewAction }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterAI, setFilterAI] = useState<string>("all");
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [moveMenuTaskId, setMoveMenuTaskId] = useState<string | null>(null);

  // Unique filter values
  const projects = ["all", ...new Set(tasks.map((t) => t.project_name).filter(Boolean) as string[])];
  const assignees = ["all", ...new Set(tasks.map((t) => t.assignee_name))];
  const aiAgents = ["all", ...new Set(tasks.map((t) => t.ai_agent).filter(Boolean) as string[])];

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterProject !== "all" && t.project_name !== filterProject) return false;
    if (filterAssignee !== "all" && t.assignee_name !== filterAssignee) return false;
    if (filterAI !== "all" && t.ai_agent !== filterAI) return false;
    return true;
  });

  const getColumnTasks = (status: KanbanStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const moveTask = useCallback((taskId: string, newStatus: KanbanStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setMoveMenuTaskId(null);
  }, []);

  const handleApprove = useCallback((taskId: string) => {
    moveTask(taskId, "done");
    onReviewAction?.(taskId, "approve");
  }, [moveTask, onReviewAction]);

  const handleReturn = useCallback((taskId: string) => {
    setCommentTaskId(taskId);
  }, []);

  const handleSubmitComment = useCallback((taskId: string) => {
    if (commentText.trim()) {
      moveTask(taskId, "in_progress");
      onReviewAction?.(taskId, "return", commentText);
      setCommentText("");
      setCommentTaskId(null);
    }
  }, [commentText, moveTask, onReviewAction]);

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${day} ${months[date.getMonth()]}`;
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="text-[22px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Задачи
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Канбан-доска проектов
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={14} style={{ color: "var(--text-tertiary)" }} />

          {/* Project Filter */}
          <div className="relative">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="appearance-none text-[12px] pl-3 pr-7 py-1.5 rounded-lg cursor-pointer"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
                outline: "none",
              }}
            >
              <option value="all">Все проекты</option>
              {projects.slice(1).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>

          {/* Assignee Filter */}
          <div className="relative">
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="appearance-none text-[12px] pl-3 pr-7 py-1.5 rounded-lg cursor-pointer"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
                outline: "none",
              }}
            >
              <option value="all">Все исполнители</option>
              {assignees.slice(1).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>

          {/* AI Agent Filter */}
          <div className="relative">
            <select
              value={filterAI}
              onChange={(e) => setFilterAI(e.target.value)}
              className="appearance-none text-[12px] pl-3 pr-7 py-1.5 rounded-lg cursor-pointer"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
                outline: "none",
              }}
            >
              <option value="all">Все ИИ агенты</option>
              {aiAgents.slice(1).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div
                key={col.id}
                className="w-[300px] flex flex-col h-full flex-shrink-0"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span
                    className="text-[12px] font-semibold tracking-wider"
                    style={{ color: col.color }}
                  >
                    {col.label}
                  </span>
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Body */}
                <div
                  className="flex-1 overflow-y-auto rounded-xl p-2 flex flex-col gap-2"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {colTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg p-3 relative group"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        {/* Priority dot + Title */}
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: priorityConfig[task.priority].color }}
                            title={priorityConfig[task.priority].label}
                          />
                          <span
                            className="text-[13px] font-medium leading-snug"
                            style={{
                              color: "var(--text-primary)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Project badge */}
                        {task.project_name && (
                          <div
                            className="text-[10px] px-2 py-0.5 rounded-md inline-block mb-2"
                            style={{
                              backgroundColor: "var(--bg-surface)",
                              color: "var(--text-tertiary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {task.project_name}
                          </div>
                        )}

                        {/* Assignee + AI badge + Due date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                              style={{
                                backgroundColor: task.ai_agent
                                  ? "color-mix(in srgb, var(--accent-lavender) 25%, transparent)"
                                  : "var(--bg-surface)",
                                color: task.ai_agent
                                  ? "var(--accent-lavender)"
                                  : "var(--text-secondary)",
                                border: "1px solid var(--border-default)",
                              }}
                            >
                              {task.ai_agent ? (
                                <Bot size={10} />
                              ) : (
                                task.assignee_name.charAt(0)
                              )}
                            </div>
                            <span
                              className="text-[11px]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {task.assignee_name}
                            </span>
                            {task.ai_agent && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: "color-mix(in srgb, var(--accent-lavender) 15%, transparent)",
                                  color: "var(--accent-lavender)",
                                }}
                              >
                                {task.ai_agent}
                              </span>
                            )}
                          </div>

                          {task.due_date && (
                            <span
                              className="text-[10px] flex items-center gap-1"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              <Calendar size={10} />
                              {formatDueDate(task.due_date)}
                            </span>
                          )}
                        </div>

                        {/* Review Actions */}
                        {col.id === "review" && (
                          <div className="mt-3 pt-2 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-default)" }}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(task.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                style={{
                                  backgroundColor: "color-mix(in srgb, var(--accent-teal) 15%, transparent)",
                                  color: "var(--accent-teal)",
                                  border: "1px solid color-mix(in srgb, var(--accent-teal) 30%, transparent)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-teal) 25%, transparent)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-teal) 15%, transparent)";
                                }}
                              >
                                <Check size={12} /> Одобрить
                              </button>
                              <button
                                onClick={() => handleReturn(task.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                style={{
                                  backgroundColor: "color-mix(in srgb, var(--accent-rose) 15%, transparent)",
                                  color: "var(--accent-rose)",
                                  border: "1px solid color-mix(in srgb, var(--accent-rose) 30%, transparent)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-rose) 25%, transparent)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-rose) 15%, transparent)";
                                }}
                              >
                                <RotateCcw size={12} /> Вернуть
                              </button>
                            </div>

                            {/* Comment input (shown when returning) */}
                            <AnimatePresence>
                              {commentTaskId === task.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex gap-1.5"
                                >
                                  <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Комментарий..."
                                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg"
                                    style={{
                                      backgroundColor: "var(--bg-input)",
                                      color: "var(--text-primary)",
                                      border: "1px solid var(--border-default)",
                                      outline: "none",
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = "var(--border-focus)";
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = "var(--border-default)";
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSubmitComment(task.id);
                                      if (e.key === "Escape") {
                                        setCommentTaskId(null);
                                        setCommentText("");
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSubmitComment(task.id)}
                                    className="px-2 py-1.5 rounded-lg transition-colors"
                                    style={{
                                      backgroundColor: "var(--accent-blue)",
                                      color: "#fff",
                                    }}
                                  >
                                    <Send size={11} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCommentTaskId(null);
                                      setCommentText("");
                                    }}
                                    className="px-1.5 py-1.5 rounded-lg transition-colors"
                                    style={{ color: "var(--text-tertiary)" }}
                                  >
                                    <X size={11} />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Move menu (click to move) */}
                        {col.id !== "review" && (
                          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setMoveMenuTaskId(
                                    moveMenuTaskId === task.id ? null : task.id
                                  )
                                }
                                className="flex items-center gap-1 text-[10px] py-1 px-2 rounded-md transition-colors"
                                style={{
                                  color: "var(--text-tertiary)",
                                  backgroundColor: "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                                  e.currentTarget.style.color = "var(--text-secondary)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "var(--text-tertiary)";
                                }}
                              >
                                <GripVertical size={10} /> Переместить
                              </button>

                              <AnimatePresence>
                                {moveMenuTaskId === task.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute left-0 top-full mt-1 rounded-lg p-1 z-10"
                                    style={{
                                      backgroundColor: "var(--bg-elevated)",
                                      border: "1px solid var(--border-default)",
                                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                    }}
                                  >
                                    {columns
                                      .filter((c) => c.id !== col.id)
                                      .map((target) => (
                                        <button
                                          key={target.id}
                                          onClick={() => moveTask(task.id, target.id)}
                                          className="flex items-center gap-2 w-full text-left text-[11px] px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                                          style={{ color: "var(--text-secondary)" }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                                            e.currentTarget.style.color = "var(--text-primary)";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                            e.currentTarget.style.color = "var(--text-secondary)";
                                          }}
                                        >
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: target.color }}
                                          />
                                          {target.label}
                                        </button>
                                      ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colTasks.length === 0 && (
                    <div
                      className="flex-1 flex items-center justify-center text-[12px] py-8"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Нет задач
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
