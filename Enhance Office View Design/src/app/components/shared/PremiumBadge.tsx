import { useState, useEffect } from "react";

/* ─── Plan hierarchy ─── */
const PLAN_ORDER = ["free", "pro", "pro_plus", "ultima", "corporate"] as const;
type Plan = (typeof PLAN_ORDER)[number];

const PLAN_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  pro: { bg: "rgba(59,130,246,0.2)", text: "#3b82f6", border: "rgba(59,130,246,0.4)" },
  pro_plus: { bg: "rgba(139,92,246,0.2)", text: "#8b5cf6", border: "rgba(139,92,246,0.4)" },
  ultima: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.4)" },
};

const PLAN_LABELS: Record<string, string> = {
  pro: "PRO",
  pro_plus: "PRO+",
  ultima: "ULTIMA",
};

/* ═══════════════════════════════════════ */
/*  PremiumBadge                          */
/* ═══════════════════════════════════════ */

interface PremiumBadgeProps {
  requiredPlan: "pro" | "pro_plus" | "ultima";
  size?: "sm" | "md";
}

export function PremiumBadge({ requiredPlan, size = "sm" }: PremiumBadgeProps) {
  const colors = PLAN_COLORS[requiredPlan] || PLAN_COLORS.pro;
  const label = PLAN_LABELS[requiredPlan] || requiredPlan;
  const isUltima = requiredPlan === "ultima";

  const fontSize = size === "sm" ? "8px" : "10px";
  const padding = size === "sm" ? "1px 5px" : "2px 7px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.5px",
        padding,
        borderRadius: "6px",
        color: isUltima ? "#1a1a1a" : colors.text,
        background: isUltima
          ? "linear-gradient(135deg, #f59e0b, #d97706)"
          : colors.bg,
        border: isUltima ? "none" : `1px solid ${colors.border}`,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {isUltima && "✨ "}
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════ */
/*  UsageProgressBar                      */
/* ═══════════════════════════════════════ */

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number;
  icon?: string;
}

function getBarColor(pct: number): string {
  if (pct < 50) return "#22c55e";
  if (pct < 75) return "#eab308";
  if (pct < 90) return "#f97316";
  return "#ef4444";
}

export function UsageProgressBar({ label, used, limit, icon = "📊" }: UsageProgressBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = isUnlimited ? "#22c55e" : getBarColor(pct);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(isUnlimited ? 100 : pct), 100);
    return () => clearTimeout(t);
  }, [pct, isUnlimited]);

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "rgba(255,255,255,0.6)",
          marginBottom: "3px",
        }}
      >
        <span>
          {icon} {label}
        </span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>
          {used.toLocaleString()} / {isUnlimited ? "∞" : limit.toLocaleString()}
          {!isUnlimited && ` (${pct}%)`}
        </span>
      </div>
      <div
        style={{
          height: "4px",
          borderRadius: "2px",
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${animatedWidth}%`,
            borderRadius: "2px",
            backgroundColor: color,
            transition: "width 0.6s ease-out",
          }}
        />
      </div>
    </div>
  );
}
