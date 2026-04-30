/**
 * XEROCODE Card v3.0 — base + interactive + glow variants
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 08
 */
import { motion, type HTMLMotionProps } from "motion/react";
import { CSSProperties, forwardRef } from "react";
import { cardLift } from "../../lib/motion-presets";

type Variant = "base" | "interactive" | "glow" | "mesh";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: Variant;
  accentColor?: string;
  padding?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
}

const paddingMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const variantStyles = (variant: Variant, accent?: string): CSSProperties => {
  const baseAccent = accent || "var(--violet-500)";
  switch (variant) {
    case "interactive":
      return {
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
        cursor: "pointer",
      };
    case "glow":
      return {
        background: "var(--bg-elevated)",
        border: `1px solid ${baseAccent}`,
        boxShadow: `var(--shadow-md), 0 0 32px ${baseAccent}40`,
      };
    case "mesh":
      return {
        background: "var(--grad-mesh)",
        border: "1px solid rgba(124,92,255,0.30)",
      };
    default:
      return {
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      };
  }
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "base", accentColor, padding = "md", children, style, ...rest }, ref) => {
    const isInteractive = variant === "interactive";
    return (
      <motion.div
        ref={ref}
        variants={isInteractive ? cardLift : undefined}
        initial={isInteractive ? "rest" : undefined}
        whileHover={isInteractive ? "hover" : undefined}
        style={{
          padding: paddingMap[padding],
          borderRadius: "var(--radius-lg)",
          ...variantStyles(variant, accentColor),
          ...style,
        }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
