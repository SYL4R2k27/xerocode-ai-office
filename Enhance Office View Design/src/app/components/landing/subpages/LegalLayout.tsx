/**
 * Универсальный layout для legal-страниц (Terms / Privacy / Security / Cookie).
 * Структурированный документ с разделами, без украшений.
 */
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SubPageHero } from "../shared/SubPageHero";
import { FinalCTA } from "../shared/FinalCTA";

export interface LegalSection {
  num: string;          // "1.1", "2", и т.д.
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface Props {
  num: string;
  title: ReactNode;
  subtitle: string;
  tagLabel: string;
  tagAccent?: string;
  effectiveDate: string;
  sections: LegalSection[];
  onBack: () => void;
  onCTA?: () => void;
}

export function LegalLayout({
  num,
  title,
  subtitle,
  tagLabel,
  tagAccent,
  effectiveDate,
  sections,
  onBack,
  onCTA,
}: Props) {
  return (
    <>
      <SubPageHero
        num={num}
        title={title}
        subtitle={subtitle}
        tag={{ label: tagLabel, accent: tagAccent || "var(--violet-500)" }}
        onBack={onBack}
      />

      <section style={{ padding: "64px 32px 48px", maxWidth: 880, margin: "0 auto" }}>
        {/* Метаданные */}
        <div
          style={{
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            marginBottom: 48,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.25em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ▸ Действует с
          </p>
          <p
            style={{
              color: "var(--ink-50)",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            {effectiveDate}
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {sections.map((sec, i) => (
            <motion.div
              key={sec.num}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  marginBottom: 20,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.25em",
                    color: "var(--violet-500)",
                    minWidth: 48,
                  }}
                >
                  {sec.num}
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {sec.title}
                </h2>
              </div>
              <div style={{ paddingLeft: 64 }} className="xc-legal-body">
                {sec.paragraphs?.map((p, j) => (
                  <p
                    key={j}
                    style={{
                      color: "var(--ink-200)",
                      fontSize: 15,
                      lineHeight: 1.75,
                      marginBottom: 12,
                    }}
                  >
                    {p}
                  </p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    {sec.bullets.map((b, j) => (
                      <li
                        key={j}
                        style={{
                          color: "var(--ink-200)",
                          fontSize: 14,
                          lineHeight: 1.6,
                          paddingLeft: 18,
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            color: "var(--violet-500)",
                            fontWeight: 700,
                          }}
                        >
                          ▸
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Контакты для вопросов */}
      <section style={{ padding: "32px 32px 80px", maxWidth: 880, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.25em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ▸ Вопросы по документу
          </p>
          <a
            href="mailto:legal@xerocode.space"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: "var(--ink-50)",
              textDecoration: "none",
              transition: "color 200ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-500)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-50)"; }}
          >
            legal@xerocode.space
          </a>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          .xc-legal-body { padding-left: 0 !important; }
        }
      `}</style>

      <FinalCTA onCTA={onCTA} />
    </>
  );
}
