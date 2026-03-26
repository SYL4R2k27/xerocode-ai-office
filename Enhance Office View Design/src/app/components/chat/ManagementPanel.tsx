import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ManagementParams {
  format: string;
  audience: string;
  integration: string;
  template: string;
  period: string;
}

export const DEFAULT_MANAGEMENT_PARAMS: ManagementParams = {
  format: "executive",
  audience: "management",
  integration: "",
  template: "status-report",
  period: "week",
};

interface ManagementPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: ManagementParams;
  onParamsChange: (params: ManagementParams) => void;
}

const ACCENT = "#f43f5e";
const ACCENT_BG = "rgba(244,63,94,0.2)";

const FORMATS = [
  { id: "executive", label: "Executive summary" },
  { id: "detailed", label: "Детальный" },
  { id: "one-pager", label: "Одностраничник" },
  { id: "presentation", label: "Презентация" },
];

const AUDIENCES = [
  { id: "management", label: "Руководство" },
  { id: "team", label: "Команда" },
  { id: "client", label: "Клиент" },
  { id: "investors", label: "Инвесторы" },
];

const TEMPLATES = [
  { id: "status-report", label: "Статус-отчёт" },
  { id: "retro", label: "Ретро" },
  { id: "risks", label: "Риски" },
  { id: "charter", label: "Устав проекта" },
  { id: "sprint-review", label: "Спринт-обзор" },
  { id: "kpi", label: "KPI" },
];

const INTEGRATIONS = [
  { id: "jira", label: "Jira" },
  { id: "trello", label: "Trello" },
  { id: "notion", label: "Notion" },
  { id: "slack", label: "Slack" },
  { id: "linear", label: "Linear" },
  { id: "asana", label: "Asana" },
];

const PERIODS = [
  { id: "day", label: "За день" },
  { id: "week", label: "За неделю" },
  { id: "sprint", label: "За спринт" },
  { id: "month", label: "За месяц" },
  { id: "quarter", label: "За квартал" },
];

export function ManagementPanel({
  isOpen,
  onToggle,
  params,
  onParamsChange,
}: ManagementPanelProps) {
  const [showExtra, setShowExtra] = useState(false);

  const update = useCallback(
    (patch: Partial<ManagementParams>) => {
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
        {/* Row 1: Формат + Аудитория */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          {/* Формат */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Формат:
            </span>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => update({ format: f.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.format === f.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.format === f.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.format === f.id
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Аудитория */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Аудитория:
            </span>
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => update({ audience: a.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.audience === a.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.audience === a.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.audience === a.id
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
        </div>

        {/* Row 2: Шаблон */}
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Шаблон:
            </span>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ template: t.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.template === t.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.template === t.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.template === t.id
                      ? ACCENT
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Интеграции и период (collapsible) */}
        <div>
          <button
            onClick={() => setShowExtra(!showExtra)}
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
              marginBottom: showExtra ? "4px" : "0",
            }}
          >
            {showExtra ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
            Интеграции и период
            {params.integration && (
              <span style={{ color: ACCENT, marginLeft: "4px" }}>
                (выбрано)
              </span>
            )}
          </button>

          {showExtra && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {/* Интеграции */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
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
                  Интеграции:
                </span>
                {INTEGRATIONS.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => update({ integration: i.id })}
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border:
                        params.integration === i.id
                          ? `1px solid ${ACCENT}`
                          : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor:
                        params.integration === i.id
                          ? ACCENT_BG
                          : "rgba(255,255,255,0.03)",
                      color:
                        params.integration === i.id
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {i.label}
                  </button>
                ))}
              </div>

              {/* Период */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
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
                  Период:
                </span>
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => update({ period: p.id })}
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border:
                        params.period === p.id
                          ? `1px solid ${ACCENT}`
                          : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor:
                        params.period === p.id
                          ? ACCENT_BG
                          : "rgba(255,255,255,0.03)",
                      color:
                        params.period === p.id
                          ? ACCENT
                          : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {p.label}
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
 * Сериализовать параметры управления в строку для сообщения.
 * Формат: [MGMT:format=executive,audience=management,...]
 */
export function serializeManagementParams(params: ManagementParams): string {
  const parts: string[] = [];
  if (params.format !== "executive") parts.push(`format=${params.format}`);
  if (params.audience !== "management")
    parts.push(`audience=${params.audience}`);
  if (params.integration) parts.push(`integration=${params.integration}`);
  if (params.template !== "status-report")
    parts.push(`template=${params.template}`);
  if (params.period !== "week") parts.push(`period=${params.period}`);

  if (parts.length === 0) return "";
  return ` [MGMT:${parts.join(",")}]`;
}
