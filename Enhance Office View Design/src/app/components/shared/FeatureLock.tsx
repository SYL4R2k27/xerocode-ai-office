import type { ReactNode } from "react";

/* ─── Plan hierarchy ─── */
const PLAN_ORDER = ["free", "pro", "pro_plus", "ultima", "corporate"] as const;
type Plan = (typeof PLAN_ORDER)[number];

const PLAN_DISPLAY: Record<string, string> = {
  free: "Free",
  pro: "PRO",
  pro_plus: "PRO+",
  ultima: "ULTIMA",
  corporate: "Corporate",
};

export function isPlanSufficient(current: string, required: string): boolean {
  const ci = PLAN_ORDER.indexOf(current as Plan);
  const ri = PLAN_ORDER.indexOf(required as Plan);
  if (ci === -1 || ri === -1) return false;
  return ci >= ri;
}

/* ═══════════════════════════════════════ */
/*  FeatureLock                           */
/* ═══════════════════════════════════════ */

interface FeatureLockProps {
  children: ReactNode;
  requiredPlan: "pro" | "pro_plus" | "ultima";
  currentPlan: string;
  featureName?: string;
  onUpgrade?: () => void;
}

export function FeatureLock({
  children,
  requiredPlan,
  currentPlan,
  featureName,
  onUpgrade,
}: FeatureLockProps) {
  const unlocked = isPlanSufficient(currentPlan, requiredPlan);

  if (unlocked) return <>{children}</>;

  const planLabel = PLAN_DISPLAY[requiredPlan] || requiredPlan;

  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
      {/* Blurred content */}
      <div
        style={{
          opacity: 0.3,
          filter: "blur(2px)",
          pointerEvents: "none",
          userSelect: "none",
          transition: "opacity 0.3s, filter 0.3s",
        }}
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: "rgba(15,15,18,0.6)",
          backdropFilter: "blur(4px)",
          borderRadius: "12px",
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: "28px" }}>🔒</div>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            padding: "2px 8px",
            borderRadius: "8px",
            background:
              requiredPlan === "ultima"
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : requiredPlan === "pro_plus"
                ? "rgba(139,92,246,0.25)"
                : "rgba(59,130,246,0.25)",
            color:
              requiredPlan === "ultima"
                ? "#1a1a1a"
                : requiredPlan === "pro_plus"
                ? "#8b5cf6"
                : "#3b82f6",
          }}
        >
          {planLabel}
        </span>

        <div
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: "200px",
          }}
        >
          {featureName
            ? `${featureName} — доступно в ${planLabel}`
            : `Доступно в ${planLabel}`}
        </div>

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            style={{
              marginTop: "4px",
              padding: "6px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Улучшить план
          </button>
        )}
      </div>
    </div>
  );
}
