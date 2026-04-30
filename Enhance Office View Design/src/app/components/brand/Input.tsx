/**
 * XEROCODE Input v3.0
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 08
 */
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, fullWidth, style, ...rest }, ref) => (
    <input
      ref={ref}
      style={{
        height: 44,
        padding: "0 16px",
        background: "var(--bg-input)",
        border: `1px solid ${hasError ? "var(--crimson)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        width: fullWidth ? "100%" : undefined,
        outline: "none",
        transition: "border-color var(--dur-quick), box-shadow var(--dur-quick)",
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--violet-500)";
        e.target.style.boxShadow = "0 0 0 3px rgba(124,92,255,0.20)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasError ? "var(--crimson)" : "var(--border)";
        e.target.style.boxShadow = "";
      }}
      {...rest}
    />
  )
);
Input.displayName = "Input";
