import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Loader2, AlertCircle, DollarSign, Users, TrendingUp,
  Phone, Mail, Building2, X, Save, GripVertical, ChevronRight, Trash2,
  User, Filter,
} from "lucide-react";
import { api, type CRMDeal, type CRMContact, type PipelineStats } from "../../lib/api";

const STAGES = [
  { id: "new", label: "Новая", color: "var(--text-tertiary)" },
  { id: "contact", label: "Контакт", color: "var(--accent-blue)" },
  { id: "proposal", label: "КП отправлено", color: "var(--accent-amber)" },
  { id: "negotiation", label: "Переговоры", color: "var(--accent-lavender)" },
  { id: "won", label: "Выиграна", color: "var(--accent-green)" },
  { id: "lost", label: "Проиграна", color: "var(--accent-rose)" },
];

interface CRMPageProps { orgRole: string }

export function CRMPage({ orgRole }: CRMPageProps) {
  const [tab, setTab] = useState<"pipeline" | "contacts">("pipeline");
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [dragDeal, setDragDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [d, c, p] = await Promise.all([
        api.crm.deals.list(),
        api.crm.contacts.list(),
        api.crm.pipeline(),
      ]);
      setDeals(d);
      setContacts(c);
      setPipeline(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDrop = useCallback(async (dealId: string, newStage: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    try { await api.crm.deals.update(dealId, { stage: newStage }); } catch (err) { console.error(err); }
    setDragDeal(null);
    setDragOverStage(null);
  }, []);

  const handleCreateDeal = useCallback(async (data: { title: string; amount: number; contact_id?: string }) => {
    try {
      const deal = await api.crm.deals.create(data);
      setDeals(prev => [deal, ...prev]);
      setShowCreate(false);
    } catch (err) { console.error(err); }
  }, []);

  const handleDeleteDeal = useCallback(async (id: string) => {
    try { await api.crm.deals.delete(id); setDeals(prev => prev.filter(d => d.id !== id)); } catch (err) { console.error(err); }
  }, []);

  const handleCreateContact = useCallback(async (data: { name: string; email?: string; phone?: string; company?: string }) => {
    try {
      const contact = await api.crm.contacts.create(data);
      setContacts(prev => [contact, ...prev]);
      setShowCreate(false);
    } catch (err) { console.error(err); }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  const filteredDeals = deals.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));
  const filteredContacts = contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>CRM</h1>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
            {(["pipeline", "contacts"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: tab === t ? "var(--bg-surface)" : "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {t === "pipeline" ? "Воронка" : "Контакты"}
              </button>
            ))}
          </div>
          {/* Quick stats */}
          {pipeline && (
            <div className="hidden md:flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <span>{deals.length} сделок</span>
              <span>·</span>
              <span style={{ color: "var(--accent-green)" }}>
                {pipeline.stages.won?.total_amount.toLocaleString("ru")} ₽ выиграно
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-[160px] outline-none"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            <Plus size={14} />
            {tab === "pipeline" ? "Сделка" : "Контакт"}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      {tab === "pipeline" ? (
        /* ── Pipeline (Kanban-style) ── */
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-3">
          <div className="flex gap-3 h-full min-w-max">
            {STAGES.map(stage => {
              const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
              const stageTotal = stageDeals.reduce((s, d) => s + d.amount, 0);
              const isDragOver = dragOverStage === stage.id;
              return (
                <div
                  key={stage.id}
                  className="w-[260px] flex-shrink-0 flex flex-col rounded-xl transition-colors"
                  style={{
                    backgroundColor: isDragOver ? "color-mix(in srgb, var(--bg-surface) 90%, var(--accent-blue) 10%)" : "var(--bg-surface)",
                    border: `1px solid ${isDragOver ? "var(--accent-blue)" : "var(--border-default)"}`,
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={e => { e.preventDefault(); if (dragDeal) handleDrop(dragDeal, stage.id); }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{stage.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>{stageDeals.length}</span>
                    </div>
                    {stageTotal > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: stage.color }}>{stageTotal.toLocaleString("ru")} ₽</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {stageDeals.map(deal => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => setDragDeal(deal.id)}
                        className="p-3 rounded-lg cursor-grab active:cursor-grabbing group transition-all"
                        style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{deal.title}</span>
                          <button onClick={() => handleDeleteDeal(deal.id)} className="opacity-0 group-hover:opacity-100 p-0.5" style={{ color: "var(--text-tertiary)" }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                        {deal.amount > 0 && (
                          <div className="text-xs font-bold mb-1" style={{ color: stage.color }}>{deal.amount.toLocaleString("ru")} ₽</div>
                        )}
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {deal.contact_name && <span className="flex items-center gap-0.5"><User size={8} />{deal.contact_name}</span>}
                          {deal.assignee_name && <span>{deal.assignee_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Contacts list ── */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-[800px] mx-auto space-y-2">
            {filteredContacts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 p-4 rounded-xl group"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                  <div className="text-xs flex items-center gap-3" style={{ color: "var(--text-tertiary)" }}>
                    {c.company && <span className="flex items-center gap-1"><Building2 size={10} />{c.company}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                  </div>
                </div>
                {c.position && <span className="text-[10px] hidden md:block" style={{ color: "var(--text-tertiary)" }}>{c.position}</span>}
              </motion.div>
            ))}
            {filteredContacts.length === 0 && (
              <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Контактов нет</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            type={tab === "pipeline" ? "deal" : "contact"}
            contacts={contacts}
            onClose={() => setShowCreate(false)}
            onCreateDeal={handleCreateDeal}
            onCreateContact={handleCreateContact}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Create Modal ── */
function CreateModal({ type, contacts, onClose, onCreateDeal, onCreateContact }: {
  type: "deal" | "contact";
  contacts: CRMContact[];
  onClose: () => void;
  onCreateDeal: (d: any) => void;
  onCreateContact: (c: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [contactId, setContactId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const handleSubmit = () => {
    if (type === "deal" && title.trim()) {
      onCreateDeal({ title: title.trim(), amount: parseFloat(amount) || 0, contact_id: contactId || undefined });
    } else if (type === "contact" && name.trim()) {
      onCreateContact({ name: name.trim(), email: email || undefined, phone: phone || undefined, company: company || undefined });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-[420px] rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {type === "deal" ? "Новая сделка" : "Новый контакт"}
        </h3>
        <div className="space-y-3">
          {type === "deal" ? (
            <>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название сделки" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма (₽)" type="number" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <select value={contactId} onChange={e => setContactId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                <option value="">Контакт (опционально)</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
              </select>
            </>
          ) : (
            <>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Компания" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Телефон" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            </>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}>Создать</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
