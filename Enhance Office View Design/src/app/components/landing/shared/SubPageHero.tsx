/**
 * SubPageHero — общий header для sub-страниц.
 * Mesh-фон, ⌘ номер, Playfair italic заголовок, кнопка ← На главную.
 */
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface SubPageHeroProps {
  num: string;
  title: ReactNode;
  subtitle?: string;
  /** Tag над заголовком (опционально) */
  tag?: { icon?: ReactNode; label: string; accent?: string };
  onBack: () => void;
}

export function SubPageHero({ num, title, subtitle, tag, onBack }: SubPageHeroProps) {
  return (
    <section
      style={{
        position: "relative",
        padding: "144px 32px 64px",
        background: "var(--grad-mesh)",
        borderBottom: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      {/* subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,92,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 80%)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <button
          onClick={onBack}
          data-mascot-trigger
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "none",
            color: "var(--ink-300)",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 32,
            padding: 0,
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink-50)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-300)"; }}
        >
          ← На главную
        </button>

        {tag && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9999,
              background: `${tag.accent || "var(--violet-500)"}15`,
              border: `1px solid ${tag.accent || "var(--violet-500)"}33`,
              color: tag.accent || "var(--violet-500)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            {tag.icon}
            {tag.label}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.3em",
            color: "var(--violet-500)",
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          ⌘ {num}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(48px, 7vw, 96px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--ink-50)",
            margin: 0,
          }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: "var(--ink-200)",
              fontSize: 19,
              marginTop: 24,
              maxWidth: 720,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
