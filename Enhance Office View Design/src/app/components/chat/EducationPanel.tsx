import { useCallback } from "react";

export interface EducationParams {
  level: string;
  subject: string;
  mode: string;
  difficulty: number;
}

export const DEFAULT_EDUCATION_PARAMS: EducationParams = {
  level: "bachelor",
  subject: "programming",
  mode: "explain",
  difficulty: 3,
};

interface EducationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: EducationParams;
  onParamsChange: (params: EducationParams) => void;
}

const ACCENT = "#8b5cf6";
const ACCENT_BG = "rgba(139,92,246,0.2)";

const LEVELS = [
  { id: "school", label: "Школа" },
  { id: "bachelor", label: "Бакалавриат" },
  { id: "master", label: "Магистратура" },
  { id: "phd", label: "PhD" },
  { id: "self", label: "Самообучение" },
];

const SUBJECTS = [
  { id: "math", label: "Математика" },
  { id: "programming", label: "Программирование" },
  { id: "physics", label: "Физика" },
  { id: "languages", label: "Языки" },
  { id: "history", label: "История" },
  { id: "biology", label: "Биология" },
  { id: "economics", label: "Экономика" },
];

const MODES = [
  { id: "explain", label: "Объясни" },
  { id: "quiz", label: "Проверь меня" },
  { id: "socratic", label: "Сократ" },
  { id: "problems", label: "Задачи" },
  { id: "summary", label: "Конспект" },
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Легко",
  2: "Легко",
  3: "Средне",
  4: "Сложно",
  5: "Сложно",
};

export function EducationPanel({
  isOpen,
  onToggle,
  params,
  onParamsChange,
}: EducationPanelProps) {
  const update = useCallback(
    (patch: Partial<EducationParams>) => {
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
        {/* Row 1: Уровень */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            marginBottom: "6px",
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
            Уровень:
          </span>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => update({ level: l.id })}
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "10px",
                border:
                  params.level === l.id
                    ? `1px solid ${ACCENT}`
                    : "1px solid rgba(255,255,255,0.08)",
                backgroundColor:
                  params.level === l.id
                    ? ACCENT_BG
                    : "rgba(255,255,255,0.03)",
                color:
                  params.level === l.id
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

        {/* Row 2: Предмет */}
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
              Предмет:
            </span>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ subject: s.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.subject === s.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.subject === s.id
                      ? ACCENT_BG
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.subject === s.id
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
        </div>

        {/* Row 3: Режим */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            marginBottom: "6px",
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
            Режим:
          </span>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => update({ mode: m.id })}
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "10px",
                border:
                  params.mode === m.id
                    ? `1px solid ${ACCENT}`
                    : "1px solid rgba(255,255,255,0.08)",
                backgroundColor:
                  params.mode === m.id
                    ? ACCENT_BG
                    : "rgba(255,255,255,0.03)",
                color:
                  params.mode === m.id
                    ? ACCENT
                    : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Row 4: Сложность (always visible, range slider) */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            Сложность:
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              minWidth: "32px",
              textAlign: "right",
            }}
          >
            Легко
          </span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={params.difficulty}
            onChange={(e) =>
              update({ difficulty: parseInt(e.target.value, 10) })
            }
            style={{
              width: "100px",
              height: "4px",
              accentColor: ACCENT,
            }}
          />
          <span
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.3)",
              minWidth: "38px",
            }}
          >
            Сложно
          </span>
          <span
            style={{
              fontSize: "10px",
              color: ACCENT,
              fontWeight: 600,
              minWidth: "44px",
            }}
          >
            {params.difficulty}/5 {DIFFICULTY_LABELS[params.difficulty]}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Сериализовать параметры образования в строку для сообщения.
 * Формат: [EDU:level=bachelor,subject=programming,...]
 */
export function serializeEducationParams(params: EducationParams): string {
  const parts: string[] = [];
  if (params.level !== "bachelor") parts.push(`level=${params.level}`);
  if (params.subject !== "programming")
    parts.push(`subject=${params.subject}`);
  if (params.mode !== "explain") parts.push(`mode=${params.mode}`);
  if (params.difficulty !== 3) parts.push(`difficulty=${params.difficulty}`);

  if (parts.length === 0) return "";
  return ` [EDU:${parts.join(",")}]`;
}
