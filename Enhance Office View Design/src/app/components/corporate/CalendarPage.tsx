import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Loader2, X, Clock,
} from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

// ---- Types ----
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "meeting" | "deadline" | "reminder" | "vacation";
  color: string;
}

const EVENT_TYPES: { id: CalendarEvent["type"]; label: string; color: string }[] = [
  { id: "meeting", label: "Встреча", color: "var(--accent-blue)" },
  { id: "deadline", label: "Дедлайн", color: "var(--accent-rose)" },
  { id: "reminder", label: "Напоминание", color: "var(--accent-amber)" },
  { id: "vacation", label: "Отпуск", color: "var(--accent-green)" },
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(fmt(today));
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // form
  const [fTitle, setFTitle] = useState("");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fType, setFType] = useState<CalendarEvent["type"]>("meeting");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/calendar/events`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        const mapped: CalendarEvent[] = (data || []).map((e: any) => {
          const evtType = EVENT_TYPES.find(t => t.id === e.event_type) || EVENT_TYPES[0];
          return {
            id: e.id,
            title: e.title,
            start: e.start_at || e.start || "",
            end: e.end_at || e.end || "",
            type: e.event_type || "meeting",
            color: evtType.color,
          };
        });
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch calendar events", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleCreate = useCallback(async () => {
    if (!fTitle.trim() || !fStart) return;
    try {
      const resp = await fetch(`${API_BASE}/calendar/events`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: fTitle.trim(),
          start_at: fStart,
          end_at: fEnd || fStart,
          event_type: fType,
          all_day: false,
        }),
      });
      if (resp.ok) {
        await fetchEvents();
      }
    } catch (err) {
      console.error("Failed to create event", err);
    }
    setFTitle(""); setFStart(""); setFEnd(""); setFType("meeting");
    setShowCreate(false);
  }, [fTitle, fStart, fEnd, fType, fetchEvents]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/calendar/events/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      await fetchEvents();
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  }, [fetchEvents]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsForDate = (dateStr: string) => events.filter(e => e.start.slice(0, 10) <= dateStr && e.end.slice(0, 10) >= dateStr);
  const selectedEvents = eventsForDate(selectedDate);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Calendar size={22} /> Календарь
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Встречи, дедлайны и напоминания</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>
            <Plus size={16} /> Создать
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Calendar grid */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prev} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--text-secondary)" }}><ChevronLeft size={20} /></button>
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{MONTHS[month]} {year}</span>
              <button onClick={next} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--text-secondary)" }}><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map(w => <div key={w} className="text-xs font-medium py-1" style={{ color: "var(--text-tertiary)" }}>{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === fmt(today);
                const isSelected = dateStr === selectedDate;
                const dayEvents = eventsForDate(dateStr);
                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    className="relative p-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: isSelected ? "#fff" : isToday ? "var(--accent-blue)" : "var(--text-primary)",
                      background: isSelected ? "var(--accent-blue)" : "transparent",
                      fontWeight: isToday ? 700 : 400,
                    }}>
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 justify-center mt-0.5">
                        {dayEvents.slice(0, 3).map((e, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : e.color }} />)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Sidebar: events for selected date */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{selectedDate}</h3>
            {selectedEvents.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Нет событий</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(e => (
                  <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: e.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{e.title}</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                        <Clock size={10} /> {e.start.slice(11, 16) || "Весь день"}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:opacity-70 shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Новое событие</h2>
                <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: "var(--text-tertiary)" }} /></button>
              </div>
              <div className="space-y-3">
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Название" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="datetime-local" value={fStart} onChange={e => setFStart(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                  <input type="datetime-local" value={fEnd} onChange={e => setFEnd(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                </div>
                <div className="flex gap-2">
                  {EVENT_TYPES.map(t => (
                    <button key={t.id} onClick={() => setFType(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: fType === t.id ? t.color : "var(--bg-elevated)", color: fType === t.id ? "#fff" : "var(--text-secondary)", border: `1px solid ${fType === t.id ? t.color : "var(--border-default)"}` }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreate} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>Создать</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
