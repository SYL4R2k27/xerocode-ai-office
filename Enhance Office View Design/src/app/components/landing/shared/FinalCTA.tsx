/**
 * FinalCTA — общий блок финального призыва.
 */
import { Zap } from "lucide-react";

interface Props {
  onCTA?: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export function FinalCTA({
  onCTA,
  title = "Хватит говорить с ИИ. Начни работать с ним.",
  subtitle = "Free навсегда · 5 минут на запуск · BYOK ∞",
  buttonText = "Запустить XeroCode →",
}: Props) {
  return (
    <section
      style={{
        padding: "120px 32px",
        background: "var(--grad-mesh)",
        textAlign: "center",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Zap size={40} color="var(--amber-500)" strokeWidth={1.5} style={{ marginBottom: 24 }} />
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--ink-50)",
            marginBottom: 20,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--ink-300)",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          {subtitle}
        </p>
        <button
          data-mascot-trigger
          onClick={onCTA}
          style={{
            padding: "16px 32px",
            borderRadius: 9999,
            background: "var(--violet-500)",
            border: "none",
            color: "white",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            transition: "transform 200ms, box-shadow 250ms, background 250ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.04)";
            e.currentTarget.style.boxShadow = "0 0 56px rgba(124,92,255,0.6)";
            e.currentTarget.style.background = "linear-gradient(135deg, #7C5CFF, #00D4FF)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "";
            e.currentTarget.style.background = "var(--violet-500)";
          }}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
