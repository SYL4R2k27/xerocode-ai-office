import { useState } from "react";

/* ═══════════════════════════════════════ */
/*  UpgradeBanner                         */
/* ═══════════════════════════════════════ */

const TYPE_LABELS: Record<string, string> = {
  tasks: "задач",
  images: "изображений",
  tokens: "токенов",
  agents: "агентов",
};

type BannerState = "warning" | "critical" | "exhausted";

function getState(used: number, limit: number): BannerState | null {
  if (!isFinite(limit) || limit === 0) return null;
  const pct = (used / limit) * 100;
  if (pct >= 100) return "exhausted";
  if (pct >= 90) return "critical";
  if (pct >= 75) return "warning";
  return null;
}

const STATE_STYLES: Record<
  BannerState,
  { border: string; bar: string; icon: string; bg: string }
> = {
  warning: {
    border: "rgba(234,179,8,0.4)",
    bar: "#eab308",
    icon: "⚠️",
    bg: "rgba(234,179,8,0.06)",
  },
  critical: {
    border: "rgba(249,115,22,0.5)",
    bar: "#f97316",
    icon: "🔶",
    bg: "rgba(249,115,22,0.06)",
  },
  exhausted: {
    border: "rgba(239,68,68,0.5)",
    bar: "#ef4444",
    icon: "🔒",
    bg: "rgba(239,68,68,0.06)",
  },
};

interface UpgradeBannerProps {
  type: "tasks" | "images" | "tokens" | "agents";
  used: number;
  limit: number;
  plan?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export function UpgradeBanner({
  type,
  used,
  limit,
  onUpgrade,
  onDismiss,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const state = getState(used, limit);

  if (!state || dismissed) return null;

  const s = STATE_STYLES[state];
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const label = TYPE_LABELS[type] || type;

  const messages: Record<BannerState, string> = {
    warning: `Вы использовали ${used} из ${limit} ${label}`,
    critical: `Почти исчерпан лимит ${label}`,
    exhausted: `Лимит ${label} исчерпан`,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "10px",
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        transition: "max-height 0.3s ease, opacity 0.2s ease",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: "14px", flexShrink: 0 }}>{s.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "rgba(255,255,255,0.7)",
            marginBottom: "4px",
          }}
        >
          <span>{messages[state]}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>
            {pct}%
          </span>
        </div>
        <div
          style={{
            height: "3px",
            borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: "2px",
              backgroundColor: s.bar,
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
      </div>

      {onUpgrade && (
        <button
          onClick={onUpgrade}
          style={{
            flexShrink: 0,
            padding: "4px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            whiteSpace: "nowrap",
          }}
        >
          Улучшить
        </button>
      )}

      {onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          style={{
            flexShrink: 0,
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            fontSize: "12px",
            padding: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
