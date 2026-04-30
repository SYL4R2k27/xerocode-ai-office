/**
 * SectionHeader — универсальный заголовок секции в дизайне v3.
 */
import type { ReactNode } from "react";

interface Props {
  num: string;
  title: ReactNode;
  subtitle?: string;
  accent?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  num,
  title,
  subtitle,
  accent = "var(--violet-500)",
  align = "left",
}: Props) {
  return (
    <div style={{ marginBottom: 56, textAlign: align }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 32,
          paddingBottom: 32,
          borderBottom: "1px solid var(--border-subtle)",
          justifyContent: align === "center" ? "center" : "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.3em",
            color: accent,
            fontWeight: 500,
          }}
        >
          ⌘ {num}
        </span>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "var(--ink-50)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            color: "var(--ink-300)",
            fontSize: 17,
            marginTop: 24,
            maxWidth: 720,
            lineHeight: 1.6,
            marginInline: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
