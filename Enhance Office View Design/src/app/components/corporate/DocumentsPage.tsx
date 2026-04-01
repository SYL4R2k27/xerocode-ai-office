import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Presentation, Table2, FileDown,
  Loader2, Sparkles, ChevronDown, Download,
} from "lucide-react";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;

function getToken(): string | null {
  return localStorage.getItem("ai_office_token");
}

type DocType = "pptx" | "docx" | "xlsx";

const DOC_TYPES: Array<{ id: DocType; icon: React.ElementType; label: string; desc: string; color: string }> = [
  { id: "pptx", icon: Presentation, label: "Презентация", desc: "PPTX — слайды из промпта", color: "var(--accent-rose)" },
  { id: "docx", icon: FileText, label: "Документ", desc: "DOCX — отчёт, договор, КП", color: "var(--accent-blue)" },
  { id: "xlsx", icon: Table2, label: "Таблица", desc: "XLSX — данные с формулами", color: "var(--accent-green)" },
];

const PPTX_TEMPLATES = [
  { id: "business", label: "Бизнес", desc: "Тёмная, фиолетовый акцент" },
  { id: "marketing", label: "Маркетинг", desc: "Тёмная, розовый акцент" },
  { id: "education", label: "Образование", desc: "Тёмная, зелёный акцент" },
  { id: "minimal", label: "Минимал", desc: "Светлая, синий акцент" },
];

export function DocumentsPage() {
  const [docType, setDocType] = useState<DocType>("pptx");
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("business");
  const [slidesCount, setSlidesCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const token = getToken();
      const body: any = { prompt: prompt.trim(), language: "ru" };
      if (docType === "pptx") {
        body.slides_count = slidesCount;
        body.template = template;
      }
      if (docType === "docx") {
        body.template = "report";
      }

      const res = await fetch(`${API_BASE}/documents/${docType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка генерации" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      // Download file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = docType;
      const disposition = res.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `XeroCode_AI.${ext}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, [prompt, docType, template, slidesCount]);

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>AI Документы</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Промпт → готовый файл за секунды
          </p>
        </motion.div>

        {/* Type selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.id}
              onClick={() => setDocType(dt.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                backgroundColor: docType === dt.id ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: `2px solid ${docType === dt.id ? dt.color : "var(--border-default)"}`,
              }}
            >
              <dt.icon size={20} style={{ color: dt.color }} className="mb-2" />
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{dt.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{dt.desc}</div>
            </button>
          ))}
        </motion.div>

        {/* Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-xs block mb-2" style={{ color: "var(--text-tertiary)" }}>
            Опишите что нужно создать
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={
              docType === "pptx" ? "Презентация о продукте XeroCode для инвесторов. 6 слайдов: проблема, решение, рынок, бизнес-модель, команда, финансы."
              : docType === "docx" ? "Отчёт по итогам Q1 2026: выручка, клиенты, ключевые метрики, план на Q2."
              : "Таблица с планом продаж на 12 месяцев: месяц, план, факт, отклонение, комментарий."
            }
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </motion.div>

        {/* PPTX options */}
        <AnimatePresence>
          {docType === "pptx" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-4 overflow-hidden"
            >
              <div>
                <label className="text-xs block mb-2" style={{ color: "var(--text-tertiary)" }}>Шаблон</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PPTX_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: template === t.id ? "var(--bg-elevated)" : "var(--bg-surface)",
                        border: `1px solid ${template === t.id ? "var(--accent-blue)" : "var(--border-default)"}`,
                      }}
                    >
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{t.label}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs block mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Количество слайдов: {slidesCount}
                </label>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={slidesCount}
                  onChange={(e) => setSlidesCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs" style={{ color: "var(--accent-rose)" }}>
            {error}
          </div>
        )}

        {/* Generate button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Генерирую...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Сгенерировать {docType === "pptx" ? "презентацию" : docType === "docx" ? "документ" : "таблицу"}
            </>
          )}
        </motion.button>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Download size={14} style={{ color: "var(--accent-teal)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Как это работает</span>
          </div>
          <div className="text-xs space-y-1" style={{ color: "var(--text-tertiary)" }}>
            <p>1. Опишите задачу — что должно быть в документе</p>
            <p>2. AI генерирует структуру (заголовки, текст, данные)</p>
            <p>3. Файл собирается и скачивается автоматически</p>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
              Поддержка: PPTX (презентации), DOCX (документы), XLSX (таблицы)
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
