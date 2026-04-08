import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Loader2, X, Plus, Calendar, UserCheck, Briefcase, Clock, Check, XCircle,
} from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

// ---- Types ----
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hire_date: string;
}

type TimeOffType = "vacation" | "sick" | "personal" | "maternity";
type TimeOffStatus = "pending" | "approved" | "rejected";

interface TimeOffRequest {
  id: string;
  employee_name: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  status: TimeOffStatus;
  comment?: string;
}

const TIME_OFF_TYPES: { id: TimeOffType; label: string }[] = [
  { id: "vacation", label: "Отпуск" },
  { id: "sick", label: "Больничный" },
  { id: "personal", label: "Личный" },
  { id: "maternity", label: "Декрет" },
];

const STATUS_BADGE: Record<TimeOffStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "На рассмотрении", color: "var(--accent-amber)", bg: "rgba(245,158,11,.12)" },
  approved: { label: "Одобрено", color: "var(--accent-green)", bg: "rgba(34,197,94,.12)" },
  rejected: { label: "Отклонено", color: "var(--accent-rose)", bg: "rgba(244,63,94,.12)" },
};

const TABS = [
  { id: "employees", label: "Сотрудники", icon: Users },
  { id: "timeoff", label: "Отпуска", icon: Calendar },
  { id: "onboarding", label: "Onboarding", icon: UserCheck },
] as const;

const ONBOARDING_STEPS = [
  "Оформление документов", "Настройка рабочего места", "Знакомство с командой",
  "Обучение системам", "Назначение наставника", "Первые задачи",
];

type TabId = typeof TABS[number]["id"];

export function HRPage() {
  const [tab, setTab] = useState<TabId>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // time-off form
  const [fType, setFType] = useState<TimeOffType>("vacation");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fComment, setFComment] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/hr/employees`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setEmployees(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  }, []);

  const fetchTimeOff = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/hr/time-off`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setTimeOff(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch time-off requests", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEmployees(), fetchTimeOff()]).finally(() => setLoading(false));
  }, [fetchEmployees, fetchTimeOff]);

  const handleCreateTimeOff = useCallback(async () => {
    if (!fStart || !fEnd) return;
    try {
      const resp = await fetch(`${API_BASE}/hr/time-off`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          type: fType,
          start_date: fStart,
          end_date: fEnd,
          comment: fComment || undefined,
        }),
      });
      if (resp.ok) {
        await fetchTimeOff();
      }
    } catch (err) {
      console.error("Failed to create time-off request", err);
    }
    setFStart(""); setFEnd(""); setFComment(""); setShowCreate(false);
  }, [fType, fStart, fEnd, fComment, fetchTimeOff]);

  const handleDecide = useCallback(async (id: string, action: "approve" | "reject") => {
    try {
      const resp = await fetch(`${API_BASE}/hr/time-off/${id}/decide`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action }),
      });
      if (resp.ok) {
        await fetchTimeOff();
      }
    } catch (err) {
      console.error("Failed to decide time-off", err);
    }
  }, [fetchTimeOff]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Briefcase size={22} /> HR-панель
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Управление персоналом и отпусками</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: tab === t.id ? "var(--accent-blue)" : "transparent", color: tab === t.id ? "#fff" : "var(--text-secondary)" }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Employees tab */}
        {tab === "employees" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["Имя", "Email", "Отдел", "Должность", "Дата найма"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>Нет сотрудников</td></tr>
                )}
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{e.name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{e.email}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: "var(--accent-blue)", background: "rgba(59,130,246,.12)" }}>{e.department}</span></td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{e.position}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-tertiary)" }}>{e.hire_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Time off tab */}
        {tab === "timeoff" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>
                <Plus size={16} /> Запрос на отпуск
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                    {["Сотрудник", "Тип", "Начало", "Конец", "Статус", "Действия"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeOff.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>Нет запросов</td></tr>}
                  {timeOff.map(r => {
                    const st = STATUS_BADGE[r.status];
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{r.employee_name}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{TIME_OFF_TYPES.find(t => t.id === r.type)?.label}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-tertiary)" }}>{r.start_date}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-tertiary)" }}>{r.end_date}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: st.color, background: st.bg }}>{st.label}</span></td>
                        <td className="px-4 py-3">
                          {r.status === "pending" && (
                            <div className="flex gap-1">
                              <button onClick={() => handleDecide(r.id, "approve")} className="p-1 rounded hover:opacity-70" title="Одобрить" style={{ color: "var(--accent-green)" }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => handleDecide(r.id, "reject")} className="p-1 rounded hover:opacity-70" title="Отклонить" style={{ color: "var(--accent-rose)" }}>
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Onboarding tab */}
        {tab === "onboarding" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Чек-лист Onboarding</h3>
            <div className="space-y-3">
              {ONBOARDING_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--accent-blue)" }}>{i + 1}</div>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{step}</span>
                  <Clock size={14} className="ml-auto" style={{ color: "var(--text-tertiary)" }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create time-off modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Запрос на отпуск</h2>
                <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: "var(--text-tertiary)" }} /></button>
              </div>
              <div className="space-y-3">
                <select value={fType} onChange={e => setFType(e.target.value as TimeOffType)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                  {TIME_OFF_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={fStart} onChange={e => setFStart(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                  <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                </div>
                <textarea value={fComment} onChange={e => setFComment(e.target.value)} placeholder="Комментарий (необязательно)" rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                <button onClick={handleCreateTimeOff} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>Отправить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
