/**
 * Arena — 4 режима соревнований моделей. Полная v2-структура в дизайне v3.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Swords, Trophy, Eye, GitBranch, BarChart3, Zap, Brain, Sparkles,
} from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { SectionHeader } from "../shared/SectionHeader";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
}

const MODES = [
  {
    id: "duel",
    icon: Swords,
    title: "Дуэль",
    desc: "2 модели получают одну задачу. Вы видите оба ответа и выбираете лучший. Проигравший теряет Elo.",
    accent: "#FF3B5C",
    example: "GPT-5.4 vs Claude Opus 4.7 — кто лучше напишет маркетинговый текст?",
  },
  {
    id: "evolution",
    icon: GitBranch,
    title: "Эволюция",
    desc: "Модели улучшают ответы друг друга в цепочке. Каждый следующий участник видит предыдущий результат и делает лучше.",
    accent: "#7C5CFF",
    example: "Groq → Claude Sonnet → GPT-5.4 — каждый шаг улучшает текст",
  },
  {
    id: "tournament",
    icon: Trophy,
    title: "Турнир",
    desc: "4 модели, bracket-система. Победители полуфиналов встречаются в финале. Лучший получает максимум Elo.",
    accent: "#FFB547",
    example: "Четвертьфиналы → Полуфиналы → Финал. Один победитель.",
  },
  {
    id: "blind",
    icon: Eye,
    title: "Слепой тест",
    desc: "Имена моделей скрыты до голосования. Вы оцениваете только качество ответа — без предвзятости к бренду.",
    accent: "#22C55E",
    example: "Модель A vs Модель B — кто лучше? Имена откроются после.",
  },
];

const HOW_IT_WORKS = [
  { icon: Swords,    title: "Модели соревнуются", desc: "AI-модели получают вашу задачу и отвечают. Вы видите результаты и голосуете.", accent: "#FF3B5C" },
  { icon: BarChart3, title: "Elo обновляется",    desc: "После каждого голосования рейтинг пересчитывается. Сильные растут, слабые падают.", accent: "#7C5CFF" },
  { icon: Brain,     title: "Вы находите лучшую", desc: "Со временем рейтинг показывает какая модель лучше для именно ваших задач.", accent: "#22C55E" },
];

const REASONS = [
  { icon: Sparkles, text: "Найти лучшую модель для ваших задач — объективно, без маркетинга" },
  { icon: Zap,      text: "Сэкономить — зачем платить за GPT-5, если Groq справляется не хуже?" },
  { icon: Brain,    text: "Улучшить результат — эволюция позволяет моделям совершенствовать ответы" },
  { icon: Trophy,   text: "Развлечься — наблюдать за битвой AI-моделей просто интересно" },
];

export function ArenaSubPage({ onBack, onCTA }: Props) {
  const [activeId, setActiveId] = useState("duel");
  const active = MODES.find((m) => m.id === activeId)!;

  return (
    <>
      <SubPageHero
        num="04"
        title={<>Аре<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>на.</em></>}
        subtitle="Пусть модели соревнуются. Узнайте какая AI-модель лучше справляется с вашими задачами. Честный Elo-рейтинг на основе ваших оценок."
        tag={{ icon: <Swords size={12} />, label: "4 режима · Elo рейтинг", accent: "#FF3B5C" }}
        onBack={onBack}
      />

      {/* Mode selector */}
      <section style={{ padding: "80px 32px", maxWidth: 1024, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {MODES.map((m) => {
            const isActive = m.id === activeId;
            return (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
                data-mascot-trigger
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: "var(--radius-sm)",
                  background: isActive ? `${m.accent}15` : "transparent",
                  border: `1px solid ${isActive ? m.accent : "var(--border)"}`,
                  color: isActive ? m.accent : "var(--ink-300)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--ink-100)";
                    e.currentTarget.style.borderColor = "var(--ink-300)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--ink-300)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                }}
              >
                <m.icon size={14} />
                {m.title}
              </button>
            );
          })}
        </div>

        {/* Active mode card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            style={{
              background: "var(--void-800)",
              border: `1px solid ${active.accent}40`,
              borderLeft: `3px solid ${active.accent}`,
              borderRadius: "var(--radius-lg)",
              padding: 32,
              boxShadow: `0 16px 32px rgba(0,0,0,0.3), 0 0 32px ${active.accent}20`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--radius-md)",
                  background: `${active.accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <active.icon size={24} color={active.accent} strokeWidth={1.75} />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {active.title}
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: active.accent,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  ▸ Режим арены
                </p>
              </div>
            </div>
            <p style={{ color: "var(--ink-200)", fontSize: 16, lineHeight: 1.65, marginBottom: 20 }}>
              {active.desc}
            </p>
            <div
              style={{
                background: "var(--void-900)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: 16,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-muted)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                ▸ Пример
              </p>
              <p style={{ color: "var(--ink-100)", fontSize: 14, fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
                «{active.example}»
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* How Elo works */}
      <section
        style={{
          padding: "80px 32px",
          background: "var(--void-950)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionHeader
            num="04.A"
            title={<>Как работает <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>рейтинг.</em></>}
            align="center"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
            className="xc-elo-grid"
          >
            {HOW_IT_WORKS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, borderColor: s.accent }}
                style={{
                  background: "var(--void-800)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: 32,
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 250ms",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.accent }} />
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: `${s.accent}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <s.icon size={26} color={s.accent} strokeWidth={1.75} />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: s.accent,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Шаг {String(i + 1).padStart(2, "0")}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                    marginBottom: 12,
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: "var(--ink-300)", fontSize: 14, lineHeight: 1.6 }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section style={{ padding: "80px 32px", maxWidth: 1024, margin: "0 auto" }}>
        <SectionHeader
          num="04.B"
          title={<>Зачем это <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>нужно.</em></>}
          align="center"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
          className="xc-why-grid"
        >
          {REASONS.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              style={{
                display: "flex",
                gap: 14,
                padding: 20,
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <r.icon size={18} color="#FF3B5C" strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: "var(--ink-200)", fontSize: 14, lineHeight: 1.55 }}>
                {r.text}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 920px) {
          .xc-elo-grid { grid-template-columns: 1fr !important; }
          .xc-why-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <FinalCTA
        onCTA={onCTA}
        title="Попробуй Арену."
        subtitle="Битва моделей · Elo рейтинг · 4 режима"
        buttonText="Запустить Арену →"
      />
    </>
  );
}
