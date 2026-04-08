import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2, AlertCircle, CalendarDays, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, User, Clock,
} from "lucide-react";

/* ── API ── */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

interface GanttTask {
  id: string;
  title: string;
  status: string;
  assignee_name?: string;
  assignee_id?: string;
  priority?: number;
  start_date?: string | null;
  due_date?: string | null;
  depends_on?: string[];
  tags?: string[];
}

/* ── Status colors ── */
const STATUS_COLORS: Record<string, string> = {
  in_progress: "var(--accent-blue)",
  review_operator: "var(--accent-amber)",
  review_manager: "var(--accent-amber)",
  done: "var(--accent-green)",
  backlog: "var(--text-tertiary)",
  pending: "var(--text-tertiary)",
  assigned: "var(--accent-blue)",
  failed: "var(--accent-rose)",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "В работе",
  review_operator: "Проверка",
  review_manager: "Ревью",
  done: "Готово",
  backlog: "Бэклог",
  pending: "Ожидание",
  assigned: "Назначена",
  failed: "Ошибка",
};

type ZoomLevel = "week" | "month" | "quarter";
const PX_PER_DAY: Record<ZoomLevel, number> = { week: 40, month: 12, quarter: 4 };

const BAR_HEIGHT = 24;
const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 48;
const LEFT_PANEL_WIDTH = 280;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
}

interface GanttPageProps {
  onOpenTask?: (taskId: string) => void;
}

export function GanttPage({ onOpenTask }: GanttPageProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Fetch tasks ── */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/org/tasks`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  /* ── Date calculations ── */
  const today = useMemo(() => startOfDay(new Date()), []);
  const pxPerDay = PX_PER_DAY[zoom];

  const { minDate, maxDate, taskBars } = useMemo(() => {
    if (tasks.length === 0) {
      const min = addDays(today, -7);
      const max = addDays(today, 30);
      return { minDate: min, maxDate: max, taskBars: [] };
    }

    let earliest = today;
    let latest = today;

    const bars = tasks.map((t) => {
      const start = t.start_date ? startOfDay(new Date(t.start_date)) : today;
      const end = t.due_date ? startOfDay(new Date(t.due_date)) : addDays(start, 3);

      if (start < earliest) earliest = start;
      if (end > latest) latest = end;

      return { ...t, barStart: start, barEnd: end };
    });

    const min = addDays(earliest, -7);
    const max = addDays(latest, 7);
    return { minDate: min, maxDate: max, taskBars: bars };
  }, [tasks, today]);

  const totalDays = daysBetween(minDate, maxDate);
  const svgWidth = totalDays * pxPerDay;
  const svgHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 20;

  /* ── Scroll to today on load ── */
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const todayOffset = daysBetween(minDate, today) * pxPerDay;
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - 200);
    }
  }, [loading, minDate, today, pxPerDay]);

  /* ── Build month labels ── */
  const monthLabels = useMemo(() => {
    const labels: { x: number; label: string }[] = [];
    let cursor = new Date(minDate);
    cursor.setDate(1);
    if (cursor < minDate) cursor.setMonth(cursor.getMonth() + 1);

    while (cursor <= maxDate) {
      const offset = daysBetween(minDate, cursor) * pxPerDay;
      labels.push({ x: offset, label: formatMonthLabel(cursor) });
      cursor = new Date(cursor);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return labels;
  }, [minDate, maxDate, pxPerDay]);

  /* ── Build weekend rects ── */
  const weekendRects = useMemo(() => {
    if (zoom === "quarter") return []; // too dense
    const rects: { x: number; width: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(minDate, i);
      if (isWeekend(d)) {
        rects.push({ x: i * pxPerDay, width: pxPerDay });
      }
    }
    return rects;
  }, [minDate, totalDays, pxPerDay, zoom]);

  /* ── Task map for dependency lookup ── */
  const taskMap = useMemo(() => {
    const m = new Map<string, typeof taskBars[0]>();
    taskBars.forEach((t) => m.set(t.id, t));
    return m;
  }, [taskBars]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <Loader2 className="animate-spin" size={20} style={{ color: "var(--accent-blue)" }} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Загрузка диаграммы Ганта...
          </span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <AlertCircle size={32} style={{ color: "var(--accent-rose)" }} className="mx-auto mb-3" />
          <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>Ошибка загрузки</p>
          <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>{error}</p>
          <button
            onClick={loadTasks}
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: "var(--accent-blue)",
              color: "#fff",
            }}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <CalendarDays size={40} style={{ color: "var(--text-tertiary)" }} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-1" style={{ color: "var(--text-primary)" }}>Нет задач</p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Создайте задачи в разделе "Задачи", чтобы увидеть диаграмму Ганта
          </p>
        </div>
      </div>
    );
  }

  const todayX = daysBetween(minDate, today) * pxPerDay;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <CalendarDays size={18} style={{ color: "var(--accent-blue)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Диаграмма Ганта
        </span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {tasks.length} задач
        </span>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          {(["week", "month", "quarter"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: zoom === z ? "var(--accent-blue)" : "transparent",
                color: zoom === z ? "#fff" : "var(--text-secondary)",
              }}
            >
              {z === "week" ? "Неделя" : z === "month" ? "Месяц" : "Квартал"}
            </button>
          ))}
        </div>
      </div>

      {/* Main area: left panel + SVG timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: task list */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: LEFT_PANEL_WIDTH,
            borderRight: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center px-3 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              height: HEADER_HEIGHT,
              color: "var(--text-tertiary)",
              borderBottom: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            Задача
          </div>

          {/* Task rows */}
          {taskBars.map((t, i) => {
            const statusColor = STATUS_COLORS[t.status] || "var(--text-tertiary)";
            const statusLabel = STATUS_LABELS[t.status] || t.status;

            return (
              <div
                key={t.id}
                className="flex items-center px-3 gap-2 cursor-pointer transition-colors"
                style={{
                  height: ROW_HEIGHT,
                  borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.04))",
                }}
                onClick={() => onOpenTask?.(t.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.assignee_name && (
                      <span
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <User size={9} />
                        {t.assignee_name}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right panel: SVG timeline */}
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ display: "block", minWidth: "100%" }}
          >
            {/* Background */}
            <rect width={svgWidth} height={svgHeight} fill="var(--bg-base)" />

            {/* Weekend shading */}
            {weekendRects.map((r, i) => (
              <rect
                key={`we-${i}`}
                x={r.x}
                y={0}
                width={r.width}
                height={svgHeight}
                fill="var(--bg-elevated)"
                opacity={0.4}
              />
            ))}

            {/* Header background */}
            <rect
              x={0}
              y={0}
              width={svgWidth}
              height={HEADER_HEIGHT}
              fill="var(--bg-surface)"
            />
            <line
              x1={0}
              y1={HEADER_HEIGHT}
              x2={svgWidth}
              y2={HEADER_HEIGHT}
              stroke="var(--border-default)"
              strokeWidth={1}
            />

            {/* Month labels */}
            {monthLabels.map((ml, i) => (
              <g key={`ml-${i}`}>
                <line
                  x1={ml.x}
                  y1={0}
                  x2={ml.x}
                  y2={svgHeight}
                  stroke="var(--border-default)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
                <text
                  x={ml.x + 6}
                  y={20}
                  fill="var(--text-tertiary)"
                  fontSize={11}
                  fontFamily="inherit"
                  fontWeight={500}
                >
                  {ml.label}
                </text>
              </g>
            ))}

            {/* Row horizontal lines */}
            {taskBars.map((_, i) => (
              <line
                key={`rl-${i}`}
                x1={0}
                y1={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
                x2={svgWidth}
                y2={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
                stroke="var(--border-default)"
                strokeWidth={0.3}
                opacity={0.3}
              />
            ))}

            {/* Dependency arrows */}
            {taskBars.map((t, i) => {
              if (!t.depends_on || t.depends_on.length === 0) return null;
              return t.depends_on.map((depId) => {
                const dep = taskMap.get(depId);
                if (!dep) return null;
                const depIndex = taskBars.findIndex((tb) => tb.id === depId);
                if (depIndex === -1) return null;

                const depEndX = daysBetween(minDate, dep.barEnd) * pxPerDay;
                const depY = HEADER_HEIGHT + depIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                const taskStartX = daysBetween(minDate, t.barStart) * pxPerDay;
                const taskY = HEADER_HEIGHT + i * ROW_HEIGHT + ROW_HEIGHT / 2;
                const midX = depEndX + (taskStartX - depEndX) / 2;

                return (
                  <polyline
                    key={`dep-${depId}-${t.id}`}
                    points={`${depEndX},${depY} ${midX},${depY} ${midX},${taskY} ${taskStartX},${taskY}`}
                    stroke={STATUS_COLORS[t.status] || "var(--text-tertiary)"}
                    strokeWidth={1.5}
                    strokeDasharray="4"
                    fill="none"
                    opacity={0.6}
                  />
                );
              });
            })}

            {/* Task bars */}
            {taskBars.map((t, i) => {
              const x = daysBetween(minDate, t.barStart) * pxPerDay;
              const w = Math.max(daysBetween(t.barStart, t.barEnd) * pxPerDay, pxPerDay);
              const y = HEADER_HEIGHT + i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
              const color = STATUS_COLORS[t.status] || "var(--text-tertiary)";

              return (
                <g
                  key={`bar-${t.id}`}
                  style={{ cursor: onOpenTask ? "pointer" : "default" }}
                  onClick={() => onOpenTask?.(t.id)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={BAR_HEIGHT}
                    rx={4}
                    ry={4}
                    fill={color}
                    opacity={0.75}
                  />
                  {/* Bar label */}
                  {w > 60 && (
                    <text
                      x={x + 8}
                      y={y + BAR_HEIGHT / 2 + 4}
                      fill="#fff"
                      fontSize={10}
                      fontFamily="inherit"
                      fontWeight={500}
                    >
                      {t.title.length > Math.floor(w / 7) ? t.title.slice(0, Math.floor(w / 7)) + "..." : t.title}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Today line */}
            <line
              x1={todayX}
              y1={0}
              x2={todayX}
              y2={svgHeight}
              stroke="var(--accent-rose)"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              opacity={0.8}
            />
            <text
              x={todayX + 4}
              y={38}
              fill="var(--accent-rose)"
              fontSize={10}
              fontFamily="inherit"
              fontWeight={600}
            >
              Сегодня
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
