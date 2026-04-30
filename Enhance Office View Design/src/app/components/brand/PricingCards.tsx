/**
 * XEROCODE PricingCards v3.0 — 6-tier pricing grid
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 23
 */
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { PLANS, type PlanName } from "../../lib/plans";
import { staggerItem, staggerList } from "../../lib/motion-presets";

interface PricingCardsProps {
  currentPlan?: PlanName;
  onSelect?: (id: PlanName) => void;
  yearly?: boolean;
}

export function PricingCards({ currentPlan, onSelect, yearly = false }: PricingCardsProps) {
  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="visible"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 8,
        width: "100%",
      }}
    >
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const monthlyPrice = yearly
          ? Math.round((plan.priceRub * 12 * (1 - plan.yearlyDiscount / 100)) / 12)
          : plan.priceRub;

        return (
          <motion.article
            key={plan.id}
            variants={staggerItem}
            data-mascot-trigger
            style={{
              background: plan.highlight
                ? "var(--grad-mesh)"
                : "var(--bg-elevated)",
              border: `1px solid ${
                plan.highlight ? "var(--violet-500)" : "var(--border-subtle)"
              }`,
              borderRadius: "var(--radius-lg)",
              padding: "28px 20px 24px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              boxShadow: plan.highlight
                ? "0 0 40px rgba(124,92,255,0.30)"
                : undefined,
              transition: "transform 250ms var(--ease-smooth), border-color 250ms",
              cursor: "pointer",
            }}
            whileHover={{
              y: -4,
              borderColor: plan.accent,
              boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 32px ${plan.accent}40`,
            }}
            onClick={() => onSelect?.(plan.id)}
          >
            {/* Top accent bar */}
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 16,
                right: 16,
                height: 3,
                background: plan.accent,
                borderRadius: "0 0 3px 3px",
              }}
            />

            {/* Tag */}
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.25em",
                color: plan.accent,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {plan.tag}
            </p>

            {/* Name */}
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ink-50)",
                letterSpacing: "-0.02em",
                marginBottom: 4,
                lineHeight: 1,
              }}
            >
              {plan.displayName}
            </h3>

            {/* Audience */}
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {plan.audience}
            </p>

            {/* Price */}
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                fontSize: 36,
                color: "var(--ink-50)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {plan.isNegotiable ? "от " : ""}
              {monthlyPrice.toLocaleString("ru-RU")}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                  marginLeft: 2,
                }}
              >
                ₽/мес
              </span>
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              ${plan.priceUsd} / mo
              {plan.yearlyDiscount > 0 && ` · −${plan.yearlyDiscount}% год`}
            </p>

            {/* Margin badge */}
            {plan.marginPercent > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "var(--aurora)",
                  background: "rgba(34,197,94,0.1)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-full)",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                  marginBottom: 16,
                }}
              >
                ✓ Margin {plan.marginPercent}%
              </span>
            )}

            {/* Features */}
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {plan.features.map((f, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    color:
                      f.type === "dim"
                        ? "var(--text-muted)"
                        : f.type === "highlight"
                          ? "var(--ink-50)"
                          : "var(--text-secondary)",
                    lineHeight: 1.45,
                    padding: "6px 0",
                    borderBottom:
                      i < plan.features.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    display: "grid",
                    gridTemplateColumns: "14px 1fr",
                    gap: 8,
                    alignItems: "baseline",
                    fontWeight: f.type === "highlight" ? 500 : 400,
                  }}
                >
                  <Check
                    size={11}
                    strokeWidth={2.5}
                    color={f.type === "dim" ? "var(--text-disabled)" : plan.accent}
                  />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              style={{
                padding: 12,
                borderRadius: "var(--radius-sm)",
                background: plan.highlight ? "var(--violet-500)" : "transparent",
                border: plan.highlight ? "none" : `1px solid ${plan.accent}`,
                color: plan.highlight ? "white" : plan.accent,
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "center",
                transition: "background 200ms, color 200ms",
              }}
              onMouseEnter={(e) => {
                if (!plan.highlight) {
                  e.currentTarget.style.background = plan.accent;
                  e.currentTarget.style.color = "var(--void-900)";
                }
              }}
              onMouseLeave={(e) => {
                if (!plan.highlight) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = plan.accent;
                }
              }}
            >
              {isCurrent ? "Текущий" : plan.cta}
            </button>
          </motion.article>
        );
      })}
    </motion.div>
  );
}
