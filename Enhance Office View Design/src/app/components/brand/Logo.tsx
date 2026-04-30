/**
 * XEROCODE Logo — wordmark v3.0
 * "XERO" roman + "CODE" italic with aurora gradient
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 18
 */
import { CSSProperties } from "react";

type Variant = "primary" | "stacked" | "monogram" | "monochrome" | "inverse";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "display";

interface LogoProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  style?: CSSProperties;
}

const sizeMap: Record<Size, string> = {
  xs:      "1.125rem",  // 18px
  sm:      "2rem",      // 32px
  md:      "3.5rem",    // 56px
  lg:      "5.5rem",    // 88px
  xl:      "7.5rem",    // 120px
  display: "10rem",     // 160px
};

const baseStyle: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 0.95,
  display: "inline-block",
  whiteSpace: "nowrap",
};

export function Logo({
  variant = "primary",
  size = "md",
  className,
  style,
}: LogoProps) {
  const fontSize = sizeMap[size];

  // Monogram XC
  if (variant === "monogram") {
    return (
      <span
        className={className}
        style={{ ...baseStyle, fontSize, letterSpacing: "-0.1em", ...style }}
      >
        <span style={{ color: "var(--ink-50)" }}>X</span>
        <span
          style={{
            fontStyle: "italic",
            background: "var(--grad-aurora)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          C
        </span>
      </span>
    );
  }

  // Stacked: XERO over CODE
  if (variant === "stacked") {
    return (
      <span
        className={className}
        style={{
          ...baseStyle,
          fontSize,
          textAlign: "center",
          lineHeight: 0.85,
          display: "block",
          ...style,
        }}
      >
        <span style={{ color: "var(--ink-50)", display: "block" }}>XERO</span>
        <span
          style={{
            fontStyle: "italic",
            background: "var(--grad-aurora)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            display: "block",
          }}
        >
          CODE
        </span>
      </span>
    );
  }

  // Monochrome (current color)
  if (variant === "monochrome") {
    return (
      <span className={className} style={{ ...baseStyle, fontSize, color: "currentColor", ...style }}>
        XERO
        <span style={{ fontStyle: "italic", fontWeight: 400 }}>CODE</span>
      </span>
    );
  }

  // Inverse — for light backgrounds
  if (variant === "inverse") {
    return (
      <span className={className} style={{ ...baseStyle, fontSize, ...style }}>
        <span style={{ color: "var(--void-900)" }}>XERO</span>
        <span
          style={{
            fontStyle: "italic",
            color: "var(--violet-500)",
            fontWeight: 400,
          }}
        >
          CODE
        </span>
      </span>
    );
  }

  // Primary (default) — XERO white + CODE italic gradient
  return (
    <span className={className} style={{ ...baseStyle, fontSize, ...style }}>
      <span style={{ color: "var(--ink-50)" }}>XERO</span>
      <span
        style={{
          fontStyle: "italic",
          fontWeight: 700,
          background: "var(--grad-aurora)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        CODE
      </span>
    </span>
  );
}
