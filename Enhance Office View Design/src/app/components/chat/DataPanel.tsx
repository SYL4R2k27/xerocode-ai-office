import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DataParams {
  source: string;
  chartType: string;
  analysisType: string;
  codeLang: string;
  library: string;
  outputFormat: string;
}

export const DEFAULT_DATA_PARAMS: DataParams = {
  source: "csv",
  chartType: "bar",
  analysisType: "descriptive",
  codeLang: "python",
  library: "matplotlib",
  outputFormat: "notebook",
};

interface DataPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: DataParams;
  onParamsChange: (params: DataParams) => void;
}

const SOURCES = [
  { id: "csv", label: "CSV" },
  { id: "excel", label: "Excel" },
  { id: "json", label: "JSON" },
  { id: "sql", label: "SQL" },
  { id: "google-sheets", label: "Google Sheets" },
  { id: "api", label: "API" },
];

const CODE_LANGS = [
  { id: "python", label: "Python" },
  { id: "r", label: "R" },
  { id: "sql", label: "SQL" },
];

const CHART_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "scatter", label: "Scatter" },
  { id: "heatmap", label: "Heatmap" },
  { id: "pie", label: "Pie" },
  { id: "histogram", label: "Histogram" },
  { id: "treemap", label: "Treemap" },
];

const ANALYSIS_TYPES = [
  { id: "descriptive", label: "Описательный" },
  { id: "predictive", label: "Предиктивный" },
  { id: "clustering", label: "Кластеризация" },
  { id: "regression", label: "Регрессия" },
  { id: "timeseries", label: "Временной ряд" },
];

const LIBRARIES = [
  { id: "matplotlib", label: "Matplotlib" },
  { id: "plotly", label: "Plotly" },
  { id: "seaborn", label: "Seaborn" },
  { id: "pandas", label: "Pandas" },
];

const OUTPUT_FORMATS = [
  { id: "notebook", label: "Notebook" },
  { id: "pdf", label: "PDF" },
  { id: "dashboard", label: "Dashboard" },
  { id: "code", label: "Код" },
];

const ACCENT = "#10b981";
const ACCENT_BG = "rgba(16,185,129,0.2)";

export function DataPanel({
  isOpen,
  onToggle,
  params,
  onParamsChange,
}: DataPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = useCallback(
    (patch: Partial<DataParams>) => {
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
      <div
        style={{
          padding: "8px 12px",
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Ряд 1: Источник + Код */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          {/* Источник */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Источник:
            </span>
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ source: s.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.source === s.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.source === s.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.source === s.id
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Код */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Код:
            </span>
            {CODE_LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => update({ codeLang: l.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.codeLang === l.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.codeLang === l.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.codeLang === l.id
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 2: График */}
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                marginRight: "2px",
              }}
            >
              График:
            </span>
            {CHART_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => update({ chartType: c.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.chartType === c.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.chartType === c.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.chartType === c.id
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 3: Анализ и вывод (сворачиваемый) */}
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
            {showAdvanced ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
            Анализ и вывод
          </button>

          {showAdvanced && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {/* Анализ */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Анализ:
                </span>
                {ANALYSIS_TYPES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => update({ analysisType: a.id })}
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border:
                        params.analysisType === a.id
                          ? `1px solid ${ACCENT}`
                          : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor:
                        params.analysisType === a.id
                          ? ACCENT_BG
                          : "rgba(255,255,255,0.03)",
                      color:
                        params.analysisType === a.id
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Библиотека (only when codeLang === python) */}
              {params.codeLang === "python" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Библиотека:
                  </span>
                  {LIBRARIES.map((lib) => (
                    <button
                      key={lib.id}
                      onClick={() => update({ library: lib.id })}
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        border:
                          params.library === lib.id
                            ? `1px solid ${ACCENT}`
                            : "1px solid rgba(255,255,255,0.08)",
                        backgroundColor:
                          params.library === lib.id
                            ? ACCENT_BG
                            : "rgba(255,255,255,0.03)",
                        color:
                          params.library === lib.id
                            ? ACCENT
                            : "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {lib.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Вывод */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Вывод:
                </span>
                {OUTPUT_FORMATS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => update({ outputFormat: o.id })}
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border:
                        params.outputFormat === o.id
                          ? `1px solid ${ACCENT}`
                          : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor:
                        params.outputFormat === o.id
                          ? ACCENT_BG
                          : "rgba(255,255,255,0.03)",
                      color:
                        params.outputFormat === o.id
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {o.label}
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

/**
 * Сериализовать параметры данных в строку для сообщения.
 * Формат: [DATA:source=csv,chart=bar,analysis=descriptive,...]
 */
export function serializeDataParams(params: DataParams): string {
  const parts: string[] = [];
  if (params.source !== "csv") parts.push(`source=${params.source}`);
  if (params.chartType !== "bar") parts.push(`chart=${params.chartType}`);
  if (params.analysisType !== "descriptive")
    parts.push(`analysis=${params.analysisType}`);
  if (params.codeLang !== "python") parts.push(`lang=${params.codeLang}`);
  if (params.library !== "matplotlib")
    parts.push(`lib=${params.library}`);
  if (params.outputFormat !== "notebook")
    parts.push(`output=${params.outputFormat}`);

  if (parts.length === 0) return "";
  return ` [DATA:${parts.join(",")}]`;
}
