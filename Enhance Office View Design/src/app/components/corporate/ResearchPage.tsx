import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Loader2, AlertCircle, Clock, Globe, FileText,
  ChevronRight, ExternalLink, Star, Zap, BookOpen, BarChart3,
  Play, RefreshCw, X, Check,
} from "lucide-react";
import { api, type ResearchSession, type ResearchResult } from "../../lib/api";

const DEPTH_OPTIONS = [
  { id: "quick", label: "Быстрый", description: "1 итерация, ~30 сек", icon: Zap },
  { id: "standard", label: "Стандарт", description: "2 итерации, ~2 мин", icon: Search },
  { id: "deep", label: "Глубокий", description: "4 итерации + Model Council, ~4 мин", icon: BookOpen },
];

export function ResearchPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("standard");
  const [language, setLanguage] = useState("ru");
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ResearchResult | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.research.sessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Poll active research
  useEffect(() => {
    if (!pollingId) return;
    const poll = async () => {
      try {
        const status = await api.research.status(pollingId);
        setSessions(prev => prev.map(s =>
          s.id === pollingId ? { ...s, ...status } : s
        ));
        if (status.status === "completed" || status.status === "failed") {
          setPollingId(null);
          loadSessions();
        }
      } catch { /* ignore */ }
    };
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollingId, loadSessions]);

  const handleStart = useCallback(async () => {
    if (!query.trim()) return;
    setStarting(true);
    try {
      const resp = await api.research.start(query, depth, language, depth === "deep");
      const newSession: ResearchSession = {
        id: resp.id,
        query,
        status: "pending",
        progress: 0,
        progress_message: "Запуск...",
        sources_count: 0,
        sections_count: 0,
        iterations_count: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        created_at: new Date().toISOString(),
      };
      setSessions(prev => [newSession, ...prev]);
      setPollingId(resp.id);
      setQuery("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  }, [query, depth, language]);

  const openResult = useCallback(async (sessionId: string) => {
    setActiveSession(sessionId);
    try {
      const result = await api.research.result(sessionId);
      setActiveResult(result);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const statusColors: Record<string, string> = {
    pending: "var(--text-tertiary)",
    searching: "var(--accent-blue)",
    analyzing: "var(--accent-teal)",
    council: "var(--accent-lavender)",
    generating: "var(--accent-amber)",
    completed: "var(--accent-green)",
    failed: "var(--accent-rose)",
  };

  const statusLabels: Record<string, string> = {
    pending: "Ожидание",
    searching: "Поиск",
    analyzing: "Анализ",
    council: "Model Council",
    generating: "Генерация",
    completed: "Завершено",
    failed: "Ошибка",
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Deep Research</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Итеративный AI-поиск с анализом, Model Council и Sparkpage отчётами
          </p>
        </motion.div>

        {/* New research form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl p-5 mb-6"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Что исследовать? Например: Текущие тренды в AI-автоматизации бизнес-процессов в 2026 году..."
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)", minHeight: "80px" }}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleStart(); }}
              />
            </div>
          </div>

          {/* Depth selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Глубина:</span>
            <div className="flex gap-2">
              {DEPTH_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = depth === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDepth(opt.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--accent-blue)" : "var(--bg-base)",
                      color: isActive ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${isActive ? "var(--accent-blue)" : "var(--border-default)"}`,
                    }}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 ml-auto">
              {["ru", "en"].map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: language === l ? "var(--bg-elevated)" : "transparent",
                    color: language === l ? "var(--text-primary)" : "var(--text-tertiary)",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!query.trim() || starting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Начать исследование
          </button>
        </motion.div>

        {/* Sessions list */}
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const isActive = s.status !== "completed" && s.status !== "failed";
            const color = statusColors[s.status] || "var(--text-tertiary)";
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-xl p-4 cursor-pointer transition-colors"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: `1px solid ${activeSession === s.id ? "var(--accent-blue)" : "var(--border-default)"}`,
                }}
                onClick={() => s.status === "completed" && openResult(s.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                  >
                    {isActive ? (
                      <Loader2 size={18} className="animate-spin" style={{ color }} />
                    ) : s.status === "completed" ? (
                      <FileText size={18} style={{ color }} />
                    ) : (
                      <AlertCircle size={18} style={{ color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {s.query}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                      >
                        {statusLabels[s.status] || s.status}
                      </span>
                      {s.progress_message && isActive && (
                        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          {s.progress_message}
                        </span>
                      )}
                      {s.sources_count > 0 && (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                          <Globe size={10} /> {s.sources_count} источников
                        </span>
                      )}
                      {s.sections_count > 0 && (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                          <FileText size={10} /> {s.sections_count} разделов
                        </span>
                      )}
                    </div>
                    {isActive && s.progress > 0 && (
                      <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          animate={{ width: `${s.progress * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {s.created_at && new Date(s.created_at).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {s.status === "completed" && (
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {sessions.length === 0 && !loading && (
          <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
            <Search size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Нет исследований</p>
            <p className="text-xs mt-1">Введите запрос выше и нажмите "Начать исследование"</p>
          </div>
        )}

        {/* Result detail panel */}
        <AnimatePresence>
          {activeSession && activeResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              onClick={() => { setActiveSession(null); setActiveResult(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[800px] max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>{activeResult.query}</h2>
                    <div className="text-xs flex items-center gap-3 mt-1" style={{ color: "var(--text-tertiary)" }}>
                      <span>{activeResult.sources?.length || 0} источников</span>
                      <span>{activeResult.sections?.length || 0} разделов</span>
                      <span>{activeResult.iterations_count} итераций</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={api.research.sparkpageUrl(activeResult.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                    >
                      <ExternalLink size={12} /> Sparkpage
                    </a>
                    <button onClick={() => { setActiveSession(null); setActiveResult(null); }} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Summary */}
                  {activeResult.summary && (
                    <div className="p-4 rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--accent-blue) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-blue) 12%, transparent)" }}>
                      <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{activeResult.summary}</p>
                    </div>
                  )}

                  {/* Sections */}
                  {activeResult.sections?.map((section, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                        {i + 1}. {section.title}
                      </h3>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{section.content}</p>
                    </div>
                  ))}

                  {/* Council votes */}
                  {activeResult.model_council_votes && activeResult.model_council_votes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Model Council</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {activeResult.model_council_votes.map((v, i) => (
                          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
                            <div className="text-[11px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>{v.model}</div>
                            <div className="flex items-center gap-1">
                              <Star size={14} style={{ color: "var(--accent-amber)" }} />
                              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{v.overall}/10</span>
                            </div>
                            {v.reasoning && <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>{v.reasoning}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {activeResult.sources && activeResult.sources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Источники ({activeResult.sources.length})</h3>
                      <div className="space-y-2">
                        {activeResult.sources.map((src, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "var(--bg-base)" }}>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>{i + 1}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{src.title}</div>
                              {src.url && (
                                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[11px] truncate block" style={{ color: "var(--accent-blue)" }}>
                                  {src.url.substring(0, 60)}
                                </a>
                              )}
                              {src.snippet && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{src.snippet.substring(0, 100)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
