import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Loader2, Send } from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

interface AICopilotProps {
  currentPage: string;
}

interface CopilotHint {
  text: string;
  suggestions: string[];
}

// Context-based hints per page
const PAGE_HINTS: Record<string, CopilotHint> = {
  dashboard: {
    text: "Я вижу ваш дашборд. Могу помочь с анализом задач или предложить оптимизацию рабочего процесса.",
    suggestions: ["Какие задачи приоритетные?", "Покажи статистику за неделю"],
  },
  calendar: {
    text: "Это календарь событий. Я могу помочь спланировать встречи или напомнить о дедлайнах.",
    suggestions: ["Запланируй встречу на завтра", "Какие дедлайны на этой неделе?"],
  },
  channels: {
    text: "Вы в каналах общения. Могу помочь составить сообщение или найти нужную информацию.",
    suggestions: ["Составь объявление для команды", "Найди последние обсуждения"],
  },
  documents: {
    text: "Реестр документов. Могу помочь с созданием или поиском документа.",
    suggestions: ["Создай новый договор", "Какие документы на согласовании?"],
  },
  hr: {
    text: "HR-панель. Могу помочь с управлением отпусками или онбордингом.",
    suggestions: ["Сколько дней отпуска осталось?", "Создай чек-лист для нового сотрудника"],
  },
  analytics: {
    text: "AI-аналитика. Задайте любой вопрос о данных вашей организации.",
    suggestions: ["Какой тренд продуктивности?", "Сравни отделы по KPI"],
  },
  default: {
    text: "Привет! Я AI-помощник. Спросите что угодно о вашем рабочем пространстве.",
    suggestions: ["Что нового?", "Помоги с задачей"],
  },
};

export function AICopilot({ currentPage }: AICopilotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const hint = PAGE_HINTS[currentPage] || PAGE_HINTS.default;

  const handleSend = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    setLoading(true);
    setResponse(null);
    try {
      const resp = await fetch(`${API_BASE}/analytics/copilot`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ page: currentPage, context: q }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setResponse(data.hint || data.response || "Нет ответа");
      } else {
        setResponse("Ошибка получения ответа от сервера");
      }
    } catch (err) {
      console.error("Copilot error", err);
      setResponse("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
    setInput("");
  }, [input, currentPage]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: "var(--accent-blue)" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={20} color="#fff" /> : <Sparkles size={20} color="#fff" />}
      </motion.button>

      {/* Hint card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-40 w-80 rounded-xl shadow-xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
              <Sparkles size={14} style={{ color: "var(--accent-blue)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Copilot</span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{hint.text}</p>

              {/* Response */}
              {loading && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Думаю...</span>
                </div>
              )}
              {response && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg text-sm" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                  {response}
                </motion.div>
              )}

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {hint.suggestions.map(s => (
                  <button key={s} onClick={() => handleSend(s)} className="px-2.5 py-1 rounded-full text-[11px] transition-colors hover:opacity-80" style={{ background: "var(--bg-elevated)", color: "var(--accent-blue)", border: "1px solid var(--border-default)" }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Спросите что-нибудь..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                />
                <button onClick={() => handleSend()} disabled={loading} className="p-2 rounded-lg text-white" style={{ background: "var(--accent-blue)" }}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
