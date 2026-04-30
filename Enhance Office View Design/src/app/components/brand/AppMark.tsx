/**
 * XEROCODE App Icon — XC monogram in squircle (Concept B)
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 19
 */
import { CSSProperties } from "react";

interface AppMarkProps {
  size?: number;
  variant?: "macos" | "ios" | "windows" | "android" | "favicon";
  className?: string;
  style?: CSSProperties;
}

const radiusMap = {
  macos: "23%",
  ios: "22%",
  windows: "8%",
  android: "50%",
  favicon: "12%",
};

export function AppMark({
  size = 96,
  variant = "macos",
  className,
  style,
}: AppMarkProps) {
  const isAndroid = variant === "android";
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radiusMap[variant],
        background: isAndroid
          ? "linear-gradient(135deg, #7C5CFF, #00D4FF)"
          : "radial-gradient(circle at 30% 30%, #1F1F3D 0%, #050510 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(124,92,255,0.15)",
        containerType: "inline-size",
        ...style,
      }}
    >
      {!isAndroid && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 70% 80%, rgba(0,212,255,0.18), transparent 55%)",
            pointerEvents: "none",
          }}
        />
      )}
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          fontSize: "44cqi",
          lineHeight: 1,
          letterSpacing: "-0.06em",
          padding: "0 4cqi",
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: isAndroid ? "var(--void-900)" : "var(--ink-50)",
          }}
        >
          X
        </span>
        <span
          style={{
            fontStyle: "italic",
            color: isAndroid ? "var(--void-900)" : "transparent",
            background: isAndroid
              ? "none"
              : "var(--grad-aurora)",
            WebkitBackgroundClip: isAndroid ? "initial" : "text",
            backgroundClip: isAndroid ? "initial" : "text",
            filter: isAndroid
              ? "none"
              : "drop-shadow(0 0 6cqi rgba(124,92,255,0.5))",
          }}
        >
          C
        </span>
      </span>
    </div>
  );
}
