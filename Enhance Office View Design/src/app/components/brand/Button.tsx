/**
 * XEROCODE Button v3.0
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 08
 */
import { motion, type HTMLMotionProps } from "motion/react";
import { type CSSProperties } from "react";
import { springPop, t } from "../../lib/motion-presets";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "magnetic";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { padding: "8px 14px", fontSize: 13, height: 32 },
  md: { padding: "12px 20px", fontSize: 14, height: 44 },
  lg: { padding: "16px 28px", fontSize: 16, height: 52 },
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--violet-500)",
    color: "#FFFFFF",
    border: "none",
  },
  secondary: {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--crimson)",
    color: "#FFFFFF",
    border: "none",
  },
  magnetic: {
    background: "var(--violet-500)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 9999,
  },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      variants={springPop}
      initial="rest"
      whileHover={!disabled && !loading ? "hover" : "rest"}
      whileTap={!disabled && !loading ? "tap" : undefined}
      disabled={disabled || loading}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: variant === "magnetic" ? 9999 : "var(--radius-sm)",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        letterSpacing: "-0.005em",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        width: fullWidth ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background var(--dur-quick) var(--ease-smooth), box-shadow var(--dur-snappy) var(--ease-smooth)",
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "xc-rotate 0.8s linear infinite",
          }}
        />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
