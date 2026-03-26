import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface TextParams {
  tone: string;
  length: string;
  audience: string;
  platform: string;
  seoKeywords: string;
  outputFormat: string;
  language: string;
}

export const DEFAULT_TEXT_PARAMS: TextParams = {
  tone: "professional",
  length: "post",
  audience: "b2c",
  platform: "blog",
  seoKeywords: "",
  outputFormat: "markdown",
  language: "ru",
};

interface TextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: TextParams;
  onParamsChange: (params: TextParams) => void;
}

const ACCENT = "#f59e0b";
const ACCENT_BG = "rgba(245,158,11,0.2)";

const TONES = [
  { id: "professional", label: "Профессиональный" },
  { id: "friendly", label: "Дружелюбный" },
  { id: "selling", label: "Продающий" },
  { id: "expert", label: "Экспертный" },
  { id: "humorous", label: "Юмористический" },
  { id: "formal", label: "Формальный" },
];

const LENGTHS = [
  { id: "tweet", label: "Твит" },
  { id: "post", label: "Пост" },
  { id: "article", label: "Статья" },
  { id: "longread", label: "Лонгрид" },
];

const AUDIENCES = [
  { id: "b2b", label: "B2B" },
  { id: "b2c", label: "B2C" },
  { id: "teens", label: "Подростки" },
  { id: "business", label: "Бизнес" },
  { id: "broad", label: "Широкая" },
];

const PLATFORMS = [
  { id: "blog", label: "Блог" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "telegram", label: "Telegram" },
  { id: "email", label: "Email" },
  { id: "ads", label: "Реклама" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
];

const OUTPUT_FORMATS = [
  { id: "markdown", label: "Markdown" },
  { id: "html", label: "HTML" },
  { id: "plaintext", label: "Plain text" },
];

const LANGUAGES = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
  { id: "adapt", label: "Адаптация" },
];

export function TextPanel({
  isOpen,
  onToggle,
  params,
  onParamsChange,
}: TextPanelProps) {
  const [showSeoFormat, setShowSeoFormat] = useState(false);

  const update = useCallback(
    (patch: Partial<TextParams>) => {
      onParamsChange({ ...params, ...patch });
    },
    [params, onParamsChange]
  );

  const pillStyle = (active: boolean) => ({
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "10px",
    border: active
      ? `1px solid ${ACCENT}`
      : "1px solid rgba(255,255,255,0.08)",
    backgroundColor: active ? ACCENT_BG : "rgba(255,255,255,0.03)",
    color: active ? ACCENT : "rgba(255,255,255,0.5)",
    cursor: "pointer" as const,
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  });

  const labelStyle = {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    whiteSpace: "nowrap" as const,
  };

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
        {/* Ряд 1: Тон */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          <span style={labelStyle}>Тон:</span>
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ tone: t.id })}
              style={pillStyle(params.tone === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ряд 2: Длина + Аудитория */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={labelStyle}>Длина:</span>
            {LENGTHS.map((l) => (
              <button
                key={l.id}
                onClick={() => update({ length: l.id })}
                style={pillStyle(params.length === l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={labelStyle}>Аудитория:</span>
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => update({ audience: a.id })}
                style={pillStyle(params.audience === a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 3: Платформа */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          <span style={labelStyle}>Платформа:</span>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => update({ platform: p.id })}
              style={pillStyle(params.platform === p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Ряд 4: SEO и формат (сворачиваемый) */}
        <div>
          <button
            onClick={() => setShowSeoFormat(!showSeoFormat)}
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
              marginBottom: showSeoFormat ? "4px" : "0",
            }}
          >
            {showSeoFormat ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
            SEO и формат
            {params.seoKeywords && (
              <span style={{ color: ACCENT, marginLeft: "4px" }}>
                (задано)
              </span>
            )}
          </button>

          {showSeoFormat && (
            <div>
              {/* SEO keywords input */}
              <input
                type="text"
                value={params.seoKeywords}
                onChange={(e) => update({ seoKeywords: e.target.value })}
                placeholder="SEO ключевые слова через запятую..."
                style={{
                  width: "100%",
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  outline: "none",
                  marginBottom: "6px",
                  boxSizing: "border-box",
                }}
              />

              {/* Формат + Язык */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={labelStyle}>Формат:</span>
                  {OUTPUT_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update({ outputFormat: f.id })}
                      style={pillStyle(params.outputFormat === f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={labelStyle}>Язык:</span>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => update({ language: l.id })}
                      style={pillStyle(params.language === l.id)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Сериализовать параметры текста в строку для сообщения.
 * Формат: [TEXT:tone=professional,length=article,...]
 */
export function serializeTextParams(params: TextParams): string {
  const parts: string[] = [];
  if (params.tone !== "professional") parts.push(`tone=${params.tone}`);
  if (params.length !== "post") parts.push(`length=${params.length}`);
  if (params.audience !== "b2c") parts.push(`audience=${params.audience}`);
  if (params.platform !== "blog") parts.push(`platform=${params.platform}`);
  if (params.seoKeywords) parts.push(`seo=${params.seoKeywords}`);
  if (params.outputFormat !== "markdown")
    parts.push(`format=${params.outputFormat}`);
  if (params.language !== "ru") parts.push(`lang=${params.language}`);

  if (parts.length === 0) return "";
  return ` [TEXT:${parts.join(",")}]`;
}
