/**
 * Pricing — полный v2-стиль (5+ тарифов · сабменю · сравнение) в дизайне v3.
 * Тарифы: Free / Go / Pro / Prime / Enterprise / Enterprise+
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ChevronDown, Sparkles } from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { SectionHeader } from "../shared/SectionHeader";
import { FinalCTA } from "../shared/FinalCTA";
import { PricingCards } from "../../brand";
import type { PlanName } from "../../../lib/plans";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
  onSelectPlan?: (id: PlanName) => void;
}

const COMPARISON_ROWS: Array<{ label: string; vals: string[] }> = [
  { label: "AI задач / мес",        vals: ["50",   "500",   "5 000", "25 000", "25 000", "∞"] },
  { label: "T1 Cheap токенов",      vals: ["—",    "200k",  "∞",     "∞",      "∞",      "∞"] },
  { label: "T2 Standard токенов",   vals: ["—",    "—",     "500k",  "2M",     "5M пул", "∞"] },
  { label: "T3 Premium токенов",    vals: ["—",    "—",     "50k",   "200k",   "500k пул","∞"] },
  { label: "Картинок / мес",        vals: ["—",    "10",    "30",    "200",    "500",    "∞"] },
  { label: "Видео / Аудио",         vals: ["—",    "—",     "—",     "20s/3m", "60s/10m","∞"] },
  { label: "Документов / день",     vals: ["3",    "10",    "50",    "200",    "500",    "∞"] },
  { label: "BYOK · Free models",    vals: ["yes",  "yes",   "yes",   "yes",    "yes",    "yes"] },
  { label: "Workspaces",            vals: ["1",    "3",     "5",     "8",      "8",      "8"] },
  { label: "Telegram · Slack · GW", vals: ["—",    "TG",    "yes",   "yes",    "yes",    "yes"] },
  { label: "1С · Битрикс · ЭДО",    vals: ["—",    "—",     "—",     "—",      "1С/Б24", "all"] },
  { label: "Seats",                 vals: ["1",    "1",     "1",     "1",      "до 10",  "∞"] },
  { label: "Storage",               vals: ["100M", "2GB",   "20GB",  "100GB",  "200GB",  "∞"] },
  { label: "MCP · API · Webhooks",  vals: ["—",    "API",   "yes",   "yes",    "yes",    "all"] },
  { label: "On-premise · SSO",      vals: ["—",    "—",     "—",     "—",      "—",      "yes"] },
  { label: "SLA",                   vals: ["—",    "—",     "99.5",  "99.5",   "99.9",   "99.95"] },
];

const PLAN_NAMES = ["Free", "Go", "Pro", "Prime", "Ent.", "Ent.+"];
const PLAN_COLORS = ["#A0A0CC", "#00D4FF", "#7C5CFF", "#FFB547", "#22C55E", "#FF3B5C"];

export function PricingSubPage({ onBack, onCTA, onSelectPlan }: Props) {
  const [yearly, setYearly] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  return (
    <>
      <SubPageHero
        num="01"
        title={<>Тари<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>фы.</em></>}
        subtitle="Free + BYOK = ∞ всегда. Платные тарифы — токены платных моделей по cost-tier. Маржа 35-39%, прозрачно."
        tag={{ icon: <Sparkles size={12} />, label: "6 тарифов · 35-39% маржа", accent: "var(--violet-500)" }}
        onBack={onBack}
      />

      {/* Toggle Месяц/Год */}
      <section style={{ padding: "48px 32px 0", maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: yearly ? "var(--text-muted)" : "var(--ink-50)",
              textTransform: "uppercase",
            }}
          >
            Месяц
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            style={{
              width: 52,
              height: 28,
              borderRadius: 9999,
              background: yearly ? "var(--violet-500)" : "var(--border)",
              position: "relative",
              border: "none",
              cursor: "pointer",
              transition: "background 200ms",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: yearly ? 27 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "white",
                transition: "left 200ms var(--ease-emphasis)",
              }}
            />
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: yearly ? "var(--ink-50)" : "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            Год <span style={{ color: "var(--aurora)" }}>−25%</span>
          </span>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: "48px 32px 24px", maxWidth: 1440, margin: "0 auto" }}>
        <PricingCards onSelect={onSelectPlan} yearly={yearly} />
      </section>

      {/* Comparison table toggle */}
      <section style={{ padding: "48px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button
            onClick={() => setShowCompare(!showCompare)}
            data-mascot-trigger
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--ink-200)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 24px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--violet-500)"; e.currentTarget.style.color = "var(--ink-50)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-200)"; }}
          >
            Подробное сравнение всех тарифов
            <motion.span animate={{ rotate: showCompare ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} />
            </motion.span>
          </button>
        </div>

        <AnimatePresence>
          {showCompare && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  background: "var(--void-800)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "32px 24px",
                  marginTop: 8,
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    minWidth: 720,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                          fontSize: 10,
                        }}
                      >
                        Функция
                      </th>
                      {PLAN_NAMES.map((n, i) => (
                        <th
                          key={n}
                          style={{
                            textAlign: "center",
                            padding: "12px 8px",
                            color: PLAN_COLORS[i],
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            fontSize: 10,
                          }}
                        >
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--ink-200)",
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                          }}
                        >
                          {row.label}
                        </td>
                        {row.vals.map((v, i) => (
                          <td
                            key={i}
                            style={{
                              textAlign: "center",
                              padding: "12px 8px",
                              color: "var(--ink-300)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {v === "yes" ? (
                              <Check size={14} color="var(--aurora)" style={{ display: "inline-block" }} />
                            ) : v === "—" ? (
                              <X size={14} color="var(--ink-500)" style={{ display: "inline-block" }} />
                            ) : (
                              <span style={{ color: PLAN_COLORS[i] }}>{v}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Cost-Tier explainer */}
      <section style={{ padding: "80px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="01.A"
          title={<>Cost-Tier <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>система.</em></>}
          subtitle="Не общий лимит запросов — а квоты по тирам стоимости моделей. Free и BYOK — без ограничений."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
          }}
          className="xc-tier-grid"
        >
          {[
            { num: "T 0", name: "Free",     accent: "#22C55E", desc: "Llama, Pollinations, DeepSeek-free", price: "$0" },
            { num: "T 1", name: "Cheap",    accent: "#00D4FF", desc: "Haiku, gpt-4o-mini, Flash",          price: "~$5/M" },
            { num: "T 2", name: "Standard", accent: "#7C5CFF", desc: "Sonnet, GPT-4.1, Gemini Pro",        price: "~$15/M" },
            { num: "T 3", name: "Premium",  accent: "#FFB547", desc: "Opus, GPT-5.4, o3, Grok 4",          price: "~$75/M" },
            { num: "T 4", name: "Media",    accent: "#FF3B5C", desc: "gpt-image · Veo · Sora · Suno",      price: "$0.04+/img" },
          ].map((tier) => (
            <div
              key={tier.num}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${tier.accent}`,
                borderRadius: "var(--radius-md)",
                padding: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: tier.accent,
                  letterSpacing: "0.2em",
                  marginBottom: 8,
                }}
              >
                {tier.num}
              </p>
              <h4
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "var(--ink-50)",
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                {tier.name}
              </h4>
              <p style={{ fontSize: 12, color: "var(--ink-300)", lineHeight: 1.5, marginBottom: 12, fontFamily: "var(--font-mono)" }}>
                {tier.desc}
              </p>
              <p
                style={{
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--amber-500)",
                  letterSpacing: "0.1em",
                }}
              >
                {tier.price}
              </p>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 1100px) { .xc-tier-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 600px)  { .xc-tier-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* Bottom note */}
      <section style={{ padding: "32px 32px 80px", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            lineHeight: 2,
          }}
        >
          Оплата: Карта · СБП · МИР · Юр.лицам — счёт + акт с НДС
          <br />
          Отмена в любой момент из личного кабинета · 3 дня free trial на Go/Pro/Prime
        </p>
      </section>

      <FinalCTA onCTA={onCTA} />
    </>
  );
}
