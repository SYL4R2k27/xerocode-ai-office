import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Loader2, AlertCircle, DollarSign, Users, TrendingUp,
  Phone, Mail, Building2, X, GripVertical, ChevronRight, Trash2,
  User, Filter, CalendarDays, StickyNote, MessageCircle, ArrowRight,
  Link, FileText, BarChart3, Target, Clock, Flag, Send, ChevronDown,
  ExternalLink, Briefcase, Hash, Star, Activity, Zap, ArrowUpRight,
  ArrowDownRight, Minus,
} from "lucide-react";
import { api, type CRMDeal, type CRMContact, type PipelineStats, type CRMActivity, type CRMAnalytics } from "../../lib/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STAGES = [
  { id: "lead", label: "Лид", color: "var(--text-tertiary)", tint: "" },
  { id: "qualification", label: "Квалификация", color: "var(--accent-blue)", tint: "" },
  { id: "proposal", label: "КП", color: "var(--accent-amber)", tint: "" },
  { id: "negotiation", label: "Переговоры", color: "var(--accent-lavender)", tint: "" },
  { id: "decision", label: "Решение", color: "var(--accent-teal)", tint: "" },
  { id: "won", label: "Выиграна", color: "var(--accent-green)", tint: "color-mix(in srgb, var(--accent-green) 4%, transparent)" },
  { id: "lost", label: "Проиграна", color: "var(--accent-rose)", tint: "color-mix(in srgb, var(--accent-rose) 4%, transparent)" },
  { id: "post_sale", label: "Постпродажа", color: "var(--accent-blue)", tint: "" },
];

const PRIORITIES: Record<string, { label: string; color: string; icon: typeof Flag }> = {
  low: { label: "Низкий", color: "var(--text-tertiary)", icon: Flag },
  medium: { label: "Средний", color: "var(--accent-blue)", icon: Flag },
  high: { label: "Высокий", color: "var(--accent-amber)", icon: Flag },
  critical: { label: "Критичный", color: "var(--accent-rose)", icon: Flag },
};

const SOURCES: Record<string, string> = {
  website: "Сайт", phone: "Телефон", email: "Email",
  referral: "Реферал", social: "Соцсети", ad: "Реклама",
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: Phone, email: Mail, meeting: CalendarDays, note: StickyNote,
  comment: MessageCircle, stage_change: ArrowRight, task_linked: Link, doc_linked: FileText,
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: "Звонок", email: "Письмо", meeting: "Встреча", note: "Заметка",
  comment: "Комментарий", stage_change: "Смена стадии", task_linked: "Задача", doc_linked: "Документ",
};

interface CRMPageProps { orgRole: string }

export function CRMPage({ orgRole }: CRMPageProps) {
  const [tab, setTab] = useState<"pipeline" | "contacts" | "analytics">("pipeline");
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState<"deal" | "contact" | null>(null);
  const [search, setSearch] = useState("");
  const [dragDeal, setDragDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [d, c, p] = await Promise.all([
        api.crm.deals.list(), api.crm.contacts.list(), api.crm.pipeline(),
      ]);
      setDeals(d); setContacts(c); setPipeline(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load analytics lazily
  useEffect(() => {
    if (tab === "analytics" && !analytics) {
      api.crm.analytics().then(setAnalytics).catch(console.error);
    }
  }, [tab, analytics]);

  const handleDrop = useCallback(async (dealId: string, newStage: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    try { await api.crm.deals.update(dealId, { stage: newStage }); } catch (err) { console.error(err); }
    setDragDeal(null); setDragOverStage(null);
  }, []);

  const openDealDetail = useCallback(async (dealId: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.crm.dealDetail(dealId);
      setSelectedDeal(detail);
      setSelectedContact(null);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  }, []);

  const openContactDetail = useCallback(async (contactId: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.crm.contacts.get(contactId);
      setSelectedContact(detail);
      setSelectedDeal(null);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  }, []);

  const handleCreateDeal = useCallback(async (data: any) => {
    const deal = await api.crm.deals.create(data);
    setDeals(prev => [deal, ...prev]);
    setShowCreate(null);
  }, []);

  const handleCreateContact = useCallback(async (data: any) => {
    const contact = await api.crm.contacts.create(data);
    setContacts(prev => [contact, ...prev]);
    setShowCreate(null);
  }, []);

  const handleDeleteDeal = useCallback(async (id: string) => {
    try { await api.crm.deals.delete(id); setDeals(prev => prev.filter(d => d.id !== id)); if (selectedDeal?.id === id) setSelectedDeal(null); } catch (err) { console.error(err); }
  }, [selectedDeal]);

  const handleAddActivity = useCallback(async (dealId: string, type: string, desc: string) => {
    try {
      await api.crm.activities.create(dealId, { activity_type: type, description: desc });
      const detail = await api.crm.dealDetail(dealId);
      setSelectedDeal(detail);
    } catch (err) { console.error(err); }
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  const filteredDeals = deals.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));
  const filteredContacts = contacts.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase()));
  const hasDetail = selectedDeal || selectedContact;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: "var(--accent-blue)" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>CRM</h1>
          </div>
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }}>
            {([["pipeline", "Воронка", Target], ["contacts", "Контакты", Users], ["analytics", "Аналитика", BarChart3]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: tab === id ? "var(--bg-surface)" : "transparent",
                  color: tab === id ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          {pipeline && (
            <div className="hidden lg:flex items-center gap-4 text-[11px] ml-2" style={{ color: "var(--text-tertiary)" }}>
              <span className="flex items-center gap-1"><Hash size={10} />{deals.length} сделок</span>
              <span className="flex items-center gap-1" style={{ color: "var(--accent-green)" }}>
                <DollarSign size={10} />{(pipeline.stages?.won?.total_amount || 0).toLocaleString("ru")} ₽
              </span>
              <span className="flex items-center gap-1"><Users size={10} />{contacts.length} контактов</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="pl-7 pr-3 py-1.5 rounded-lg text-xs w-[140px] outline-none focus:w-[200px] transition-all" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          </div>
          <button onClick={() => setShowCreate(tab === "contacts" ? "contact" : "deal")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}>
            <Plus size={13} /> {tab === "contacts" ? "Контакт" : "Сделка"}
          </button>
        </div>
      </div>

      {/* ━━ CONTENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 min-w-0 overflow-hidden transition-all ${hasDetail ? "mr-0" : ""}`}>
          {tab === "pipeline" && <PipelineView deals={filteredDeals} stages={STAGES} dragDeal={dragDeal} dragOverStage={dragOverStage} setDragDeal={setDragDeal} setDragOverStage={setDragOverStage} onDrop={handleDrop} onOpenDeal={openDealDetail} onDelete={handleDeleteDeal} />}
          {tab === "contacts" && <ContactsView contacts={filteredContacts} onOpen={openContactDetail} />}
          {tab === "analytics" && <AnalyticsView analytics={analytics} />}
        </div>

        {/* ━━ DETAIL PANEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {hasDetail && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ borderLeft: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="h-full overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>
                ) : selectedDeal ? (
                  <DealDetail deal={selectedDeal} onClose={() => setSelectedDeal(null)} onAddActivity={handleAddActivity} onDelete={handleDeleteDeal} />
                ) : selectedContact ? (
                  <ContactDetail contact={selectedContact} onClose={() => setSelectedContact(null)} onOpenDeal={openDealDetail} />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ━━ CREATE MODALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal type={showCreate} contacts={contacts} onClose={() => setShowCreate(null)} onCreateDeal={handleCreateDeal} onCreateContact={handleCreateContact} />
        )}
      </AnimatePresence>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PIPELINE VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PipelineView({ deals, stages, dragDeal, dragOverStage, setDragDeal, setDragOverStage, onDrop, onOpenDeal, onDelete }: any) {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden px-2 py-2">
      <div className="flex gap-2 h-full min-w-max">
        {stages.map((stage: any) => {
          const stageDeals = deals.filter((d: CRMDeal) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((s: number, d: CRMDeal) => s + d.amount, 0);
          const isDragOver = dragOverStage === stage.id;
          return (
            <div
              key={stage.id}
              className="w-[220px] flex-shrink-0 flex flex-col rounded-xl transition-colors"
              style={{
                backgroundColor: isDragOver ? `color-mix(in srgb, ${stage.color} 8%, var(--bg-surface))` : stage.tint || "var(--bg-surface)",
                border: `1px solid ${isDragOver ? stage.color : "var(--border-default)"}`,
              }}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => { e.preventDefault(); if (dragDeal) onDrop(dragDeal, stage.id); }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)" }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: stage.color }}>{stage.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>{stageDeals.length}</span>
                  {stageTotal > 0 && <span className="text-[9px] font-mono" style={{ color: stage.color }}>{(stageTotal / 1000).toFixed(0)}K</span>}
                </div>
              </div>
              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                {stageDeals.map((deal: CRMDeal) => {
                  const p = PRIORITIES[deal.priority || "medium"];
                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragDeal(deal.id)}
                      onClick={() => onOpenDeal(deal.id)}
                      className="p-2.5 rounded-lg cursor-pointer group transition-all hover:translate-y-[-1px]"
                      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = stage.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{deal.title}</span>
                        <button onClick={e => { e.stopPropagation(); onDelete(deal.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }}><Trash2 size={9} /></button>
                      </div>
                      {deal.amount > 0 && (
                        <div className="text-[11px] font-bold font-mono mb-1.5" style={{ color: stage.color }}>{deal.amount.toLocaleString("ru")} ₽</div>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {deal.priority && deal.priority !== "medium" && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-bold uppercase" style={{ color: p?.color, backgroundColor: `color-mix(in srgb, ${p?.color} 12%, transparent)` }}>{p?.label}</span>
                        )}
                        {deal.contact_name && (
                          <span className="text-[9px] flex items-center gap-0.5 truncate" style={{ color: "var(--text-tertiary)" }}><User size={8} />{deal.contact_name}</span>
                        )}
                        {deal.next_action_date && (
                          <span className="text-[9px] flex items-center gap-0.5" style={{ color: "var(--accent-amber)" }}><Clock size={8} />{new Date(deal.next_action_date).toLocaleDateString("ru", { day: "numeric", month: "short" })}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {stageDeals.length === 0 && (
                  <div className="text-center py-6 opacity-30"><Target size={16} className="mx-auto mb-1" style={{ color: "var(--text-tertiary)" }} /><p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>Пусто</p></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEAL DETAIL PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DealDetail({ deal, onClose, onAddActivity, onDelete }: { deal: CRMDeal; onClose: () => void; onAddActivity: (id: string, type: string, desc: string) => void; onDelete: (id: string) => void }) {
  const [actType, setActType] = useState("note");
  const [actDesc, setActDesc] = useState("");
  const stage = STAGES.find(s => s.id === deal.stage);
  const p = PRIORITIES[deal.priority || "medium"];

  return (
    <div className="w-[400px]">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{deal.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold font-mono" style={{ color: stage?.color }}>{deal.amount.toLocaleString("ru")} {deal.currency}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ color: stage?.color, backgroundColor: `color-mix(in srgb, ${stage?.color} 12%, transparent)` }}>{stage?.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(deal.id)} className="p-1 rounded" style={{ color: "var(--text-tertiary)" }} title="Удалить"><Trash2 size={13} /></button>
          <button onClick={onClose} className="p-1 rounded" style={{ color: "var(--text-tertiary)" }}><X size={15} /></button>
        </div>
      </div>

      {/* Info grid */}
      <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <InfoRow icon={Flag} label="Приоритет" value={p?.label || "—"} valueColor={p?.color} />
        <InfoRow icon={Briefcase} label="Источник" value={SOURCES[deal.source || ""] || deal.source || "—"} />
        <InfoRow icon={User} label="Контакт" value={deal.contact_name || "—"} valueColor="var(--accent-blue)" />
        <InfoRow icon={Users} label="Ответственный" value={deal.assignee_name || "—"} />
        {deal.expected_close && <InfoRow icon={CalendarDays} label="Закрытие" value={new Date(deal.expected_close).toLocaleDateString("ru")} />}
        {deal.next_action && <InfoRow icon={Clock} label="Следующее действие" value={deal.next_action} valueColor="var(--accent-amber)" />}
        {deal.next_action_date && <InfoRow icon={Clock} label="Дата действия" value={new Date(deal.next_action_date).toLocaleDateString("ru")} />}
        {deal.lost_reason && <InfoRow icon={AlertCircle} label="Причина проигрыша" value={deal.lost_reason} valueColor="var(--accent-rose)" />}
        {deal.qualification_score != null && deal.qualification_score > 0 && <InfoRow icon={Star} label="Квалификация" value={`${deal.qualification_score}/100`} />}
        {deal.description && (
          <div>
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Описание</div>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{deal.description}</p>
          </div>
        )}
      </div>

      {/* Add activity */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="text-[9px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--text-tertiary)" }}>Добавить активность</div>
        <div className="flex gap-1 mb-2 flex-wrap">
          {["note", "call", "email", "meeting", "comment"].map(t => {
            const Icon = ACTIVITY_ICONS[t] || MessageCircle;
            return (
              <button key={t} onClick={() => setActType(t)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: actType === t ? "var(--accent-blue)" : "var(--bg-base)", color: actType === t ? "#fff" : "var(--text-tertiary)", border: `1px solid ${actType === t ? "var(--accent-blue)" : "var(--border-default)"}` }}>
                <Icon size={10} />{ACTIVITY_LABELS[t]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <input value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="Описание..." className="flex-1 px-2.5 py-1.5 rounded text-[11px] outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} onKeyDown={e => { if (e.key === "Enter" && actDesc.trim()) { onAddActivity(deal.id, actType, actDesc); setActDesc(""); } }} />
          <button onClick={() => { if (actDesc.trim()) { onAddActivity(deal.id, actType, actDesc); setActDesc(""); } }} className="px-2 py-1.5 rounded" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}><Send size={11} /></button>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="px-4 py-3">
        <div className="text-[9px] uppercase tracking-wider font-bold mb-3" style={{ color: "var(--text-tertiary)" }}>Хронология ({deal.activities?.length || 0})</div>
        <div className="space-y-0">
          {(deal.activities || []).map((a, i) => {
            const Icon = ACTIVITY_ICONS[a.activity_type] || MessageCircle;
            return (
              <div key={a.id} className="flex gap-2.5 pb-3 relative">
                {i < (deal.activities?.length || 0) - 1 && <div className="absolute left-[9px] top-[20px] bottom-0 w-px" style={{ backgroundColor: "var(--border-default)" }} />}
                <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                  <Icon size={9} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>{a.user_name}</span>
                    <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{ACTIVITY_LABELS[a.activity_type] || a.activity_type}</span>
                  </div>
                  {a.description && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{a.description}</p>}
                  <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{new Date(a.created_at).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          {(!deal.activities || deal.activities.length === 0) && (
            <p className="text-[10px] text-center py-4" style={{ color: "var(--text-tertiary)" }}>Нет активностей</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor }: { icon: React.ElementType; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={11} style={{ color: "var(--text-tertiary)" }} className="flex-shrink-0" />
      <span className="text-[10px] w-[100px] flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-[11px] font-medium truncate" style={{ color: valueColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTACTS VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ContactsView({ contacts, onOpen }: { contacts: CRMContact[]; onOpen: (id: string) => void }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Table header */}
      <div className="grid items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-wider sticky top-0" style={{ gridTemplateColumns: "1fr 140px 160px 120px 100px 70px", color: "var(--text-tertiary)", backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)", zIndex: 5 }}>
        <span>Имя</span><span>Компания</span><span>Email</span><span>Телефон</span><span>Источник</span><span className="text-right">Сделки</span>
      </div>
      {contacts.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.01 }}
          onClick={() => onOpen(c.id)}
          className="grid items-center gap-2 px-5 py-2.5 cursor-pointer transition-colors"
          style={{ gridTemplateColumns: "1fr 140px 160px 120px 100px 70px", borderBottom: "1px solid color-mix(in srgb, var(--border-default) 40%, transparent)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.name}</div>
              {c.position && <div className="text-[9px] truncate" style={{ color: "var(--text-tertiary)" }}>{c.position}</div>}
            </div>
          </div>
          <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{c.company || "—"}</span>
          <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</span>
          <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{c.phone || "—"}</span>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{SOURCES[c.source || ""] || "—"}</span>
          <span className="text-[11px] text-right font-mono" style={{ color: "var(--text-tertiary)" }}>{c.deals?.length || 0}</span>
        </motion.div>
      ))}
      {contacts.length === 0 && <div className="text-center py-16"><Users size={28} className="mx-auto mb-2 opacity-20" style={{ color: "var(--text-tertiary)" }} /><p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Нет контактов</p></div>}
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTACT DETAIL PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ContactDetail({ contact, onClose, onOpenDeal }: { contact: CRMContact; onClose: () => void; onOpenDeal: (id: string) => void }) {
  return (
    <div className="w-[400px]">
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>{contact.name.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{contact.name}</h3>
            {contact.position && <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{contact.position}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1" style={{ color: "var(--text-tertiary)" }}><X size={15} /></button>
      </div>
      <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
        {contact.company && <InfoRow icon={Building2} label="Компания" value={contact.company} />}
        {contact.email && <InfoRow icon={Mail} label="Email" value={contact.email} valueColor="var(--accent-blue)" />}
        {contact.phone && <InfoRow icon={Phone} label="Телефон" value={contact.phone} />}
        {contact.source && <InfoRow icon={Zap} label="Источник" value={SOURCES[contact.source] || contact.source} />}
        {contact.notes && <div><div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Заметки</div><p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{contact.notes}</p></div>}
      </div>
      <div className="px-4 py-3">
        <div className="text-[9px] uppercase tracking-wider font-bold mb-2" style={{ color: "var(--text-tertiary)" }}>Сделки ({contact.deals?.length || 0})</div>
        <div className="space-y-1.5">
          {(contact.deals || []).map(d => {
            const s = STAGES.find(st => st.id === d.stage);
            return (
              <button key={d.id} onClick={() => onOpenDeal(d.id)} className="w-full flex items-center gap-2 p-2 rounded-lg text-left" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s?.color || "var(--border-default)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s?.color }} />
                <span className="text-[11px] font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>{d.title}</span>
                <span className="text-[10px] font-mono" style={{ color: s?.color }}>{d.amount.toLocaleString("ru")} ₽</span>
              </button>
            );
          })}
          {(!contact.deals || contact.deals.length === 0) && <p className="text-[10px] text-center py-3" style={{ color: "var(--text-tertiary)" }}>Нет сделок</p>}
        </div>
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function AnalyticsView({ analytics }: { analytics: CRMAnalytics | null }) {
  if (!analytics) return <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  const maxFunnel = Math.max(...analytics.funnel.map(f => f.count), 1);

  const metrics = [
    { label: "Всего сделок", value: analytics.total_deals, icon: Hash, color: "var(--accent-blue)" },
    { label: "Выиграно ₽", value: analytics.won_revenue.toLocaleString("ru"), icon: DollarSign, color: "var(--accent-green)" },
    { label: "Конверсия", value: `${analytics.conversion_rate}%`, icon: TrendingUp, color: analytics.conversion_rate > 20 ? "var(--accent-green)" : "var(--accent-amber)" },
    { label: "Средний чек", value: `${analytics.avg_deal_size.toLocaleString("ru")} ₽`, icon: Target, color: "var(--accent-teal)" },
    { label: "В воронке", value: `${analytics.pipeline_value.toLocaleString("ru")} ₽`, icon: Activity, color: "var(--accent-lavender)" },
  ];

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-[900px] mx-auto space-y-5">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-3.5 rounded-xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <m.icon size={13} style={{ color: m.color }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{m.label}</span>
              </div>
              <div className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>{m.value}</div>
            </motion.div>
          ))}
        </div>

        {/* This month */}
        <div className="flex gap-3">
          <div className="flex-1 p-3.5 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent-blue) 12%, transparent)" }}>
              <ArrowUpRight size={16} style={{ color: "var(--accent-blue)" }} />
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Новых в этом месяце</div>
              <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{analytics.new_this_month}</div>
            </div>
          </div>
          <div className="flex-1 p-3.5 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent-green) 12%, transparent)" }}>
              <Star size={16} style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Выиграно в этом месяце</div>
              <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{analytics.won_this_month}</div>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <h3 className="text-xs font-bold mb-4" style={{ color: "var(--text-primary)" }}>Воронка продаж</h3>
          <div className="space-y-2.5">
            {analytics.funnel.map((f, i) => {
              const stage = STAGES.find(s => s.id === f.stage);
              const width = Math.max((f.count / maxFunnel) * 100, 4);
              return (
                <motion.div key={f.stage} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</span>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <span className="font-mono">{f.count} сделок</span>
                      <span className="font-mono" style={{ color: stage?.color }}>{f.amount.toLocaleString("ru")} ₽</span>
                    </div>
                  </div>
                  <div className="h-5 rounded overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
                    <motion.div className="h-full rounded" style={{ backgroundColor: stage?.color, width: `${width}%` }} initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* By source */}
        {Object.keys(analytics.by_source).length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-xs font-bold mb-3" style={{ color: "var(--text-primary)" }}>По источникам</h3>
            <div className="space-y-2">
              {Object.entries(analytics.by_source).map(([key, data]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] w-[80px]" style={{ color: "var(--text-secondary)" }}>{data.label}</span>
                  <div className="flex-1 h-3 rounded overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
                    <div className="h-full rounded" style={{ backgroundColor: "var(--accent-blue)", width: `${(data.count / Math.max(...Object.values(analytics.by_source).map(s => s.count), 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono w-[30px] text-right" style={{ color: "var(--text-tertiary)" }}>{data.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CreateModal({ type, contacts, onClose, onCreateDeal, onCreateContact }: any) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("lead");
  const [priority, setPriority] = useState("medium");
  const [source, setSource] = useState("");
  const [contactId, setContactId] = useState("");
  const [description, setDescription] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [contactSource, setContactSource] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (type === "deal" && !title.trim()) { setError("Укажите название сделки"); return; }
    if (type === "contact" && !name.trim()) { setError("Укажите имя контакта"); return; }
    setSubmitting(true);
    try {
      if (type === "deal") {
        await onCreateDeal({ title: title.trim(), amount: parseFloat(amount) || 0, stage, priority, source: source || undefined, contact_id: contactId || undefined, description: description || undefined, expected_close: expectedClose || undefined });
      } else {
        await onCreateContact({ name: name.trim(), email: email || undefined, phone: phone || undefined, company: company || undefined, position: position || undefined, source: contactSource || undefined });
      }
    } catch (err: any) {
      setError(err?.message || "Ошибка при создании");
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && (type === "deal" ? title.trim() : name.trim())) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="w-full max-w-[440px] rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }} onClick={(e: any) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{type === "deal" ? "Новая сделка" : "Новый контакт"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto" onKeyDown={handleKeyDown}>
          {type === "deal" ? (
            <>
              {/* ━━ Основные поля (всегда видны) ━━ */}
              <Input label="Название *" value={title} onChange={setTitle} placeholder="Например: Поставка серверов для Яндекс" autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Сумма (₽)" value={amount} onChange={setAmount} placeholder="100 000" type="number" />
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Стадия</label>
                  <div className="flex flex-wrap gap-1">
                    {STAGES.slice(0, 6).map(s => (
                      <button key={s.id} onClick={() => setStage(s.id)} className="px-2 py-1 rounded-md text-[10px] font-medium transition-all" style={{ backgroundColor: stage === s.id ? `color-mix(in srgb, ${s.color} 18%, transparent)` : "var(--bg-base)", color: stage === s.id ? s.color : "var(--text-tertiary)", border: `1px solid ${stage === s.id ? s.color : "var(--border-default)"}` }}>{s.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ━━ Подробнее (скрыто по умолчанию) ━━ */}
              <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-1.5 text-[11px] font-medium py-1 transition-colors" style={{ color: "var(--accent-blue)" }}>
                <ChevronDown size={12} style={{ transform: showMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                {showMore ? "Скрыть подробности" : "Подробнее"}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3 overflow-hidden">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Приоритет</label>
                        <div className="flex gap-1">
                          {Object.entries(PRIORITIES).map(([k, v]) => (
                            <button key={k} onClick={() => setPriority(k)} className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all text-center" style={{ backgroundColor: priority === k ? `color-mix(in srgb, ${v.color} 18%, transparent)` : "var(--bg-base)", color: priority === k ? v.color : "var(--text-tertiary)", border: `1px solid ${priority === k ? v.color : "var(--border-default)"}` }}>{v.label}</button>
                          ))}
                        </div>
                      </div>
                      <Select label="Источник" value={source} onChange={setSource} options={[{ value: "", label: "—" }, ...Object.entries(SOURCES).map(([k, v]) => ({ value: k, label: v }))]} />
                    </div>
                    <Select label="Контакт" value={contactId} onChange={setContactId} options={[{ value: "", label: "Без контакта" }, ...contacts.map((c: CRMContact) => ({ value: c.id, label: `${c.name}${c.company ? ` — ${c.company}` : ""}` }))]} />
                    <Input label="Ожидаемое закрытие" value={expectedClose} onChange={setExpectedClose} type="date" />
                    <Textarea label="Описание" value={description} onChange={setDescription} placeholder="Детали сделки..." />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              {/* ━━ Контакт: основные ━━ */}
              <Input label="Имя *" value={name} onChange={setName} placeholder="Иван Петров" autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" value={email} onChange={setEmail} placeholder="ivan@company.ru" />
                <Input label="Телефон" value={phone} onChange={setPhone} placeholder="+7 900 000-00-00" />
              </div>

              {/* ━━ Подробнее ━━ */}
              <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-1.5 text-[11px] font-medium py-1 transition-colors" style={{ color: "var(--accent-blue)" }}>
                <ChevronDown size={12} style={{ transform: showMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                {showMore ? "Скрыть подробности" : "Подробнее"}
              </button>

              <AnimatePresence>
                {showMore && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3 overflow-hidden">
                    <Input label="Компания" value={company} onChange={setCompany} placeholder="ООО «Компания»" />
                    <Input label="Должность" value={position} onChange={setPosition} placeholder="Директор" />
                    <Select label="Источник" value={contactSource} onChange={setContactSource} options={[{ value: "", label: "—" }, ...Object.entries(SOURCES).map(([k, v]) => ({ value: k, label: v }))]} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* ━━ Footer ━━ */}
        {error && (
          <div className="px-5 py-2 flex items-center gap-2" style={{ color: "var(--accent-rose)" }}>
            <AlertCircle size={13} />
            <span className="text-[11px]">{error}</span>
          </div>
        )}
        <div className="px-5 py-3 flex gap-2" style={{ borderTop: "1px solid var(--border-default)" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity" style={{ backgroundColor: "var(--accent-blue)", color: "#fff", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? <><Loader2 size={13} className="animate-spin" /> Создание...</> : <>
              <Plus size={13} /> Создать
            </>}
          </button>
        </div>

        {/* ━━ Подсказка ━━ */}
        <div className="px-5 py-2 text-center" style={{ borderTop: "1px solid color-mix(in srgb, var(--border-default) 40%, transparent)" }}>
          <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>Enter — создать • Esc — отмена</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ━━ Form helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Input({ label, value, onChange, placeholder, type = "text", autoFocus }: any) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</label>
      <input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} type={type} autoFocus={autoFocus} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</label>
      <textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</label>
      <select value={value} onChange={(e: any) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs outline-none appearance-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
