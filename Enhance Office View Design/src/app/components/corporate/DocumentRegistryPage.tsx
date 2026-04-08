import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Loader2, X, Search, Filter, ArrowUpDown,
} from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// ---- Types ----
type DocCategory = "contract" | "invoice" | "act" | "proposal";
type DocType = "in" | "out" | "internal";
type DocStatus = "draft" | "approval" | "signed" | "archive" | "rejected";

interface RegistryDoc {
  id: string;
  doc_number: string;
  title: string;
  category: DocCategory;
  type: DocType;
  status: DocStatus;
  date: string;
  description?: string;
}

const CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "contract", label: "Договор" },
  { id: "invoice", label: "Счёт" },
  { id: "act", label: "Акт" },
  { id: "proposal", label: "КП" },
];

const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: "in", label: "Входящий" },
  { id: "out", label: "Исходящий" },
  { id: "internal", label: "Внутренний" },
];

const STATUSES: { id: DocStatus; label: string; color: string; bg: string }[] = [
  { id: "draft", label: "Черновик", color: "var(--text-tertiary)", bg: "rgba(128,128,128,.12)" },
  { id: "approval", label: "На согласовании", color: "var(--accent-amber)", bg: "rgba(245,158,11,.12)" },
  { id: "signed", label: "Подписан", color: "var(--accent-green)", bg: "rgba(34,197,94,.12)" },
  { id: "archive", label: "Архив", color: "var(--accent-blue)", bg: "rgba(59,130,246,.12)" },
  { id: "rejected", label: "Отклонён", color: "var(--accent-rose)", bg: "rgba(244,63,94,.12)" },
];

function statusBadge(status: DocStatus) {
  const s = STATUSES.find(x => x.id === status)!;
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

export function DocumentRegistryPage() {
  const [docs, setDocs] = useState<RegistryDoc[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<DocType | "">("");
  const [filterStatus, setFilterStatus] = useState<DocStatus | "">("");
  const [filterCategory, setFilterCategory] = useState<DocCategory | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // form
  const [fTitle, setFTitle] = useState("");
  const [fType, setFType] = useState<DocType>("internal");
  const [fCategory, setFCategory] = useState<DocCategory>("contract");
  const [fDesc, setFDesc] = useState("");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("doc_type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const resp = await fetch(`${API_BASE}/docs/registry${qs}`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setDocs(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterCategory]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleCreate = useCallback(async () => {
    if (!fTitle.trim()) return;
    try {
      const resp = await fetch(`${API_BASE}/docs/registry`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: fTitle.trim(),
          doc_type: fType,
          category: fCategory,
          description: fDesc || undefined,
        }),
      });
      if (resp.ok) {
        await fetchDocs();
      }
    } catch (err) {
      console.error("Failed to create document", err);
    }
    setFTitle(""); setFDesc(""); setShowCreate(false);
  }, [fTitle, fType, fCategory, fDesc, fetchDocs]);

  const filtered = docs.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.doc_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <FileText size={22} /> Реестр документов
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Учёт входящих, исходящих и внутренних документов</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>
            <Plus size={16} /> Создать
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию или номеру..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            <option value="">Все типы</option>
            {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            <option value="">Все статусы</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            <option value="">Все категории</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["Номер", "Название", "Категория", "Тип", "Статус", "Дата"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>Документы не найдены</td></tr>
                )}
                {filtered.map(d => (
                  <tr key={d.id} className="hover:opacity-80 transition-opacity" style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--accent-blue)" }}>{d.doc_number}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{d.title}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{CATEGORIES.find(c => c.id === d.category)?.label}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{DOC_TYPES.find(t => t.id === d.type)?.label}</td>
                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-tertiary)" }}>{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Новый документ</h2>
                <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: "var(--text-tertiary)" }} /></button>
              </div>
              <div className="space-y-3">
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Название документа" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={fType} onChange={e => setFType(e.target.value as DocType)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                    {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <select value={fCategory} onChange={e => setFCategory(e.target.value as DocCategory)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Описание (необязательно)" rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                <button onClick={handleCreate} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>Создать</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
