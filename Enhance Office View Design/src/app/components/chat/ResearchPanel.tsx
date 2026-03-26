import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ResearchParams {
  depth: string;
  sourceCount: string;
  sourceType: string;
  period: string;
  citationStyle: string;
  outputFormat: string;
  language: string;
}

export const DEFAULT_RESEARCH_PARAMS: ResearchParams = {
  depth: "standard",
  sourceCount: "10",
  sourceType: "all",
  period: "year",
  citationStyle: "apa",
  outputFormat: "summary",
  language: "ru",
};

interface ResearchPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: ResearchParams;
  onParamsChange: (params: ResearchParams) => void;
}

const DEPTHS = [
  { id: "quick", label: "Быстрый" },
  { id: "standard", label: "Стандартный" },
  { id: "deep", label: "Глубокий" },
];

const SOURCE_COUNTS = [
  { id: "5", label: "5" },
  { id: "10", label: "10" },
  { id: "25", label: "25" },
  { id: "50+", label: "50+" },
];

const SOURCE_TYPES = [
  { id: "all", label: "Все" },
  { id: "academic", label: "Академические" },
  { id: "news", label: "Новости" },
  { id: "patents", label: "Патенты" },
  { id: "blogs", label: "Блоги" },
];

const PERIODS = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "all", label: "Всё время" },
];

const CITATION_STYLES = [
  { id: "apa", label: "APA" },
  { id: "mla", label: "MLA" },
  { id: "chicago", label: "Chicago" },
  { id: "gost", label: "ГОСТ" },
  { id: "harvard", label: "Harvard" },
];

const OUTPUT_FORMATS = [
  { id: "summary", label: "Сводка" },
  { id: "report", label: "Отчёт" },
  { id: "table", label: "Таблица" },
  { id: "presentation", label: "Презентация" },
];

const LANGUAGES = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
  { id: "multi", label: "Мультиязычный" },
];

// Акцентный цвет для ResearchPanel — teal
const ACCENT = "#2dd4bf";
const ACCENT_BG = "rgba(45,212,191,0.15)";
const ACCENT_BORDER = "rgba(45,212,191,0.5)";

const btnBase: React.CSSProperties = {
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.5)",
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  border: `1px solid ${ACCENT_BORDER}`,
  backgroundColor: ACCENT_BG,
  color: ACCENT,
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.4)",
  whiteSpace: "nowrap",
};

export function ResearchPanel({ isOpen, onToggle, params, onParamsChange }: ResearchPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = useCallback(
    (patch: Partial<ResearchParams>) => {
      onParamsChange({ ...params, ...patch });
    },
    [params, onParamsChange]
  );

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "#141416",
        overflow: "hidden",
        transition: "max-height 0.3s ease, opacity 0.2s ease",
        maxHeight: isOpen ? "300px" : "0px",
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div style={{ padding: "8px 12px", maxHeight: "200px", overflowY: "auto", overflowX: "hidden" }}>
        {/* Ряд 1: Глубина + Источники */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Глубина:</span>
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                onClick={() => update({ depth: d.id })}
                style={params.depth === d.id ? btnActive : btnBase}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Источники:</span>
            {SOURCE_COUNTS.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ sourceCount: s.id })}
                style={params.sourceCount === s.id ? btnActive : btnBase}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 2: Тип + Период */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Тип:</span>
            {SOURCE_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ sourceType: t.id })}
                style={params.sourceType === t.id ? btnActive : btnBase}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Период:</span>
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => update({ period: p.id })}
                style={params.period === p.id ? btnActive : btnBase}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 3: Формат и цитаты (раскрываемый) */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "0",
              marginBottom: showAdvanced ? "4px" : "0",
            }}
          >
            {showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Формат и цитаты
            {(params.citationStyle !== "apa" || params.outputFormat !== "summary" || params.language !== "ru") && (
              <span style={{ color: ACCENT, marginLeft: "4px" }}>
                ({[
                  params.citationStyle !== "apa" ? params.citationStyle.toUpperCase() : "",
                  params.outputFormat !== "summary" ? params.outputFormat : "",
                  params.language !== "ru" ? params.language.toUpperCase() : "",
                ].filter(Boolean).join(", ")})
              </span>
            )}
          </button>

          {showAdvanced && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={labelStyle}>Цитаты:</span>
                {CITATION_STYLES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update({ citationStyle: c.id })}
                    style={params.citationStyle === c.id ? btnActive : btnBase}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={labelStyle}>Вывод:</span>
                {OUTPUT_FORMATS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => update({ outputFormat: o.id })}
                    style={params.outputFormat === o.id ? btnActive : btnBase}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={labelStyle}>Язык:</span>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => update({ language: l.id })}
                    style={params.language === l.id ? btnActive : btnBase}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function serializeResearchParams(params: ResearchParams): string {
  const parts: string[] = [];
  if (params.depth !== "standard") parts.push(`depth=${params.depth}`);
  if (params.sourceCount !== "10") parts.push(`sources=${params.sourceCount}`);
  if (params.sourceType !== "all") parts.push(`type=${params.sourceType}`);
  if (params.period !== "year") parts.push(`period=${params.period}`);
  if (params.citationStyle !== "apa") parts.push(`cite=${params.citationStyle}`);
  if (params.outputFormat !== "summary") parts.push(`output=${params.outputFormat}`);
  if (params.language !== "ru") parts.push(`lang=${params.language}`);
  if (parts.length === 0) return "";
  return ` [RESEARCH:${parts.join(",")}]`;
}
