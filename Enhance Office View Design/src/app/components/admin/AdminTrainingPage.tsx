/**
 * AdminTrainingPage — dashboard для XeroCode AI training dataset.
 * Admin only. Stats + logs table + JSONL export.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Database, Download, ThumbsUp, ThumbsDown, RefreshCw, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

type Stats = {
  total_logs: number;
  rated: number;
  positive: number;
  positive_rate: number | null;
  unique_users: number;
  by_mode: Array<{ mode: string; count: number; avg_cost: number }>;
  positive_by_mode: Record<string, number>;
  daily: Array<{ day: string; count: number; cost: number }>;
  ready_for_finetune: boolean;
};

type LogRow = {
  id: string;
  mode: string;
  user_hash: string;
  user_query: string;
  final_response: string;
  chosen_models?: string[];
  router_decision?: any;
  total_tokens: number;
  total_cost_usd: number;
  duration_sec: number;
  success: boolean;
  user_rating: number | null;
  created_at: string;
};

const MODE_COLORS: Record<string, string> = {
  xerocode_ai: "#9333ea",
  manager: "#3b82f6",
  team: "#10b981",
  swarm: "#06b6d4",
  auction: "#f59e0b",
};

export function AdminTrainingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterMode, setFilterMode] = useState<string>("");
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LogRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.training.stats(),
        api.training.logs(page, 50, filterMode || undefined, filterRating),
      ]);
      setStats(s);
      setLogs(l.items);
      setPages(l.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterMode, filterRating]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #9333ea, #3b82f6)" }}
          >
            <Database size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              Training Dataset
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              XeroCode AI Phase 2 fine-tune data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
          <a
            href={api.training.exportUrl(true, false)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            <Download size={14} />
            Экспорт JSONL
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Всего логов" value={stats.total_logs.toLocaleString("ru")} icon={Database} />
            <StatCard label="С рейтингом" value={stats.rated.toLocaleString("ru")} sublabel={`${stats.total_logs ? ((stats.rated / stats.total_logs) * 100).toFixed(1) : 0}% от общего`} icon={CheckCircle2} />
            <StatCard
              label="Positive rate"
              value={stats.positive_rate ? `${(stats.positive_rate * 100).toFixed(1)}%` : "—"}
              sublabel={`${stats.positive.toLocaleString("ru")} 👍`}
              icon={ThumbsUp}
              accent={stats.positive_rate && stats.positive_rate > 0.7 ? "#10b981" : "#f59e0b"}
            />
            <StatCard label="Уникальных юзеров" value={stats.unique_users.toLocaleString("ru")} sublabel="анонимизировано" icon={Database} />
          </div>
        )}

        {/* Fine-tune readiness */}
        {stats && (
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              backgroundColor: stats.ready_for_finetune
                ? "color-mix(in srgb, var(--accent-green) 12%, transparent)"
                : "color-mix(in srgb, var(--accent-amber, #f59e0b) 12%, transparent)",
              border: `1px solid ${stats.ready_for_finetune ? "var(--accent-green)" : "var(--accent-amber, #f59e0b)"}`,
            }}
          >
            {stats.ready_for_finetune ? <CheckCircle2 size={20} color="var(--accent-green)" /> : <AlertCircle size={20} color="#f59e0b" />}
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                {stats.ready_for_finetune ? "Готово к fine-tune!" : `Нужно ещё ${(10000 - stats.rated).toLocaleString("ru")} rated пар до старта`}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: 4 }}>
                Минимум 10 000 rated пар для LoRA fine-tune. Сейчас: <b>{stats.rated.toLocaleString("ru")}</b>
                <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (stats.rated / 10000) * 100)}%`,
                      background: "linear-gradient(90deg, #9333ea, #3b82f6)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* By-mode breakdown */}
        {stats && stats.by_mode.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Использование режимов
            </h3>
            <div className="space-y-2">
              {stats.by_mode.map(m => {
                const pct = stats.total_logs ? (m.count / stats.total_logs) * 100 : 0;
                const color = MODE_COLORS[m.mode] || "var(--text-tertiary)";
                const positive = stats.positive_by_mode[m.mode] || 0;
                return (
                  <div key={m.mode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{m.mode}</span>
                        <span style={{ color: "var(--text-tertiary)" }}>· avg ${m.avg_cost.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ color: "var(--text-tertiary)" }}>{positive} 👍</span>
                        <span style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {m.count.toLocaleString("ru")}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ backgroundColor: "var(--bg-elevated)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters + Logs table */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <Filter size={14} style={{ color: "var(--text-tertiary)" }} />
            <select
              value={filterMode}
              onChange={e => { setFilterMode(e.target.value); setPage(1); }}
              className="text-xs rounded-md px-2 py-1.5 outline-none"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            >
              <option value="">Все режимы</option>
              {Object.keys(MODE_COLORS).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterRating ?? ""}
              onChange={e => { const v = e.target.value; setFilterRating(v === "" ? undefined : Number(v)); setPage(1); }}
              className="text-xs rounded-md px-2 py-1.5 outline-none"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            >
              <option value="">Все рейтинги</option>
              <option value="1">👍 Позитивные</option>
              <option value="-1">👎 Негативные</option>
              <option value="0">Без рейтинга</option>
            </select>
            <div className="flex-1" />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Стр. {page} из {pages}
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
            {logs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${MODE_COLORS[log.mode] || "#666"} 15%, transparent)`,
                      color: MODE_COLORS[log.mode] || "var(--text-secondary)",
                    }}
                  >
                    {log.mode}
                  </span>
                  {log.user_rating === 1 && <ThumbsUp size={10} style={{ color: "var(--accent-green)" }} />}
                  {log.user_rating === -1 && <ThumbsDown size={10} style={{ color: "var(--accent-red, #ef4444)" }} />}
                  {!log.success && <AlertCircle size={10} style={{ color: "#ef4444" }} />}
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                    {log.user_hash} · {log.total_tokens}t · ${log.total_cost_usd.toFixed(4)} · {log.duration_sec.toFixed(1)}s
                  </span>
                  <div className="flex-1" />
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {new Date(log.created_at).toLocaleString("ru")}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-primary)" }} className="line-clamp-1">
                  {log.user_query}
                </div>
              </button>
            ))}
            {logs.length === 0 && !loading && (
              <div className="px-4 py-8 text-center" style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
                Нет записей — пользователи ещё не делали запросов
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-1 px-4 py-3" style={{ borderTop: "1px solid var(--border-default)" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md text-xs disabled:opacity-30"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
              >
                ←
              </button>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", padding: "0 12px" }}>
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 rounded-md text-xs disabled:opacity-30"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4" onClick={() => setSelected(null)} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-xs font-mono" style={{ backgroundColor: `color-mix(in srgb, ${MODE_COLORS[selected.mode]} 15%, transparent)`, color: MODE_COLORS[selected.mode] }}>
                  {selected.mode}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>{selected.id.slice(0, 8)}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-tertiary)" }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Section title="Запрос пользователя" body={selected.user_query} />
              <Section title="Финальный ответ" body={selected.final_response} />
              {selected.chosen_models && selected.chosen_models.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 6 }}>Модели</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.chosen_models.map((m, i) => (
                      <span key={i} className="px-2 py-1 rounded-md text-xs font-mono" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.router_decision && (
                <Section title="Router decision" body={JSON.stringify(selected.router_decision)} mono />
              )}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat k="Tokens" v={selected.total_tokens.toLocaleString()} />
                <Stat k="Cost" v={`$${selected.total_cost_usd.toFixed(4)}`} />
                <Stat k="Duration" v={`${selected.duration_sec.toFixed(2)}s`} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sublabel, icon: Icon, accent }: { label: string; value: string; sublabel?: string; icon: any; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <Icon size={14} style={{ color: accent || "var(--text-tertiary)" }} />
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: accent || "var(--text-primary)" }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: 2 }}>{sublabel}</div>
      )}
    </div>
  );
}

function Section({ title, body, mono }: { title: string; body: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 6 }}>{title}</div>
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          fontSize: "13px",
          color: "var(--text-primary)",
          fontFamily: mono ? "monospace" : undefined,
          whiteSpace: "pre-wrap",
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        {body || "(пусто)"}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md px-2 py-1.5" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{k}</div>
      <div style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "monospace" }}>{v}</div>
    </div>
  );
}
