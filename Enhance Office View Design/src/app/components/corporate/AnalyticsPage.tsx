import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, Loader2, Send, TrendingUp, TrendingDown, Lightbulb, Target,
  Sparkles, AlertCircle,
} from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

// ---- Types ----
interface AnalyticsResult {
  title: string;
  insights: string[];
  metrics: { label: string; value: string; trend: "up" | "down" | "neutral"; change: string }[];
  recommendations: string[];
}

export function AnalyticsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/analytics/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!resp.ok) {
        throw new Error(`Ошибка сервера: ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Ошибка анализа");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp size={14} style={{ color: "var(--accent-green)" }} />;
    if (trend === "down") return <TrendingDown size={14} style={{ color: "var(--accent-rose)" }} />;
    return null;
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[900px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Sparkles size={22} /> AI-Аналитика
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Задайте вопрос на естественном языке</p>
        </motion.div>

        {/* Query input */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl p-5 mb-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              placeholder="Например: Какой процент задач завершён? Какой отдел самый продуктивный?"
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--accent-blue)" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Анализировать
            </button>
          </div>
          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["Статистика задач за месяц", "Продуктивность по отделам", "Расходы на AI"].map(p => (
              <button key={p} onClick={() => { setQuery(p); }} className="px-3 py-1 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>{p}</button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-4 rounded-xl mb-6" style={{ background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.2)" }}>
            <AlertCircle size={16} style={{ color: "var(--accent-rose)" }} />
            <span className="text-sm" style={{ color: "var(--accent-rose)" }}>{error}</span>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Анализирую данные...</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Title */}
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{result.title}</h2>

              {/* Metrics cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.metrics.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{m.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{m.value}</span>
                      <span className="flex items-center gap-0.5 text-xs font-medium mb-0.5" style={{ color: m.trend === "up" ? "var(--accent-green)" : m.trend === "down" ? "var(--accent-rose)" : "var(--text-tertiary)" }}>
                        <TrendIcon trend={m.trend} /> {m.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Insights */}
              <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--text-primary)" }}>
                  <Target size={14} style={{ color: "var(--accent-blue)" }} /> Выводы
                </h3>
                <ul className="space-y-2">
                  {result.insights.map((ins, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-blue)" }}>&#8226;</span> {ins}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: "var(--text-primary)" }}>
                  <Lightbulb size={14} style={{ color: "var(--accent-amber)" }} /> Рекомендации
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-amber)" }}>{i + 1}.</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
