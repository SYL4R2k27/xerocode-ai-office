/**
 * About — миссия + ценности + tech-stack + контакты ИП.
 */
import { motion } from "motion/react";
import {
  Mail, Globe, Github, Package,
  Shield, Brain, Zap, Users,
} from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { SectionHeader } from "../shared/SectionHeader";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
}

const VALUES = [
  { icon: Zap,    title: "Скорость",          desc: "Задачи выполняются в 10 раз быстрее. Секунды вместо часов.",      accent: "#FFB547" },
  { icon: Shield, title: "Безопасность",      desc: "AES-256 шифрование, JWT, rate limiting. SOCKS5 прокси для всех вызовов.", accent: "#22C55E" },
  { icon: Brain,  title: "Мульти-модельность",desc: "430+ моделей от 10 провайдеров. Каждая — для своей задачи.",       accent: "#7C5CFF" },
  { icon: Users,  title: "Для команд",         desc: "От фрилансера до команды в 50 человек. Единое пространство.",     accent: "#00D4FF" },
];

const TECH_STATS = [
  { num: "430+",  label: "AI-моделей" },
  { num: "10",    label: "провайдеров" },
  { num: "76",    label: "API endpoints" },
  { num: "35K+",  label: "строк кода" },
];

const CONTACTS = [
  { icon: Mail,    label: "Поддержка",     value: "support@xerocode.space",                  href: "mailto:support@xerocode.space" },
  { icon: Mail,    label: "Коммерческие",  value: "sales@xerocode.space",                    href: "mailto:sales@xerocode.space" },
  { icon: Globe,   label: "Сайт",          value: "xerocode.ru",                             href: "https://xerocode.ru" },
  { icon: Github,  label: "GitHub",        value: "github.com/SYL4R2k27",                    href: "https://github.com/SYL4R2k27/xerocode-ai-office" },
  { icon: Package, label: "npm",           value: "xerocode-cli",                            href: "https://npmjs.com/package/xerocode-cli" },
];

export function AboutSubPage({ onBack, onCTA }: Props) {
  return (
    <>
      <SubPageHero
        num="06"
        title={<>О <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>нас.</em></>}
        subtitle="Ускоряем работу бизнеса с помощью AI-команды из 430+ моделей. Multi-model first. BYOK first. Made in Russia."
        tag={{ label: "MMXXVI · Москва · Россия", accent: "var(--amber-500)" }}
        onBack={onBack}
      />

      {/* Mission */}
      <section style={{ padding: "80px 32px", maxWidth: 880, margin: "0 auto" }}>
        <SectionHeader
          num="06.A"
          title={<>Мис<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>сия.</em></>}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: "var(--grad-mesh)",
            border: "1px solid rgba(124,92,255,0.25)",
            borderRadius: "var(--radius-lg)",
            padding: 40,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              lineHeight: 1.5,
              color: "var(--ink-100)",
              marginBottom: 20,
            }}
          >
            Мы создаём инструмент, который позволяет бизнесу работать{" "}
            <em style={{ color: "var(--amber-500)", fontWeight: 700, fontStyle: "italic" }}>быстрее.</em>
            {" "}Вместо того чтобы выбирать между GPT, Claude или Gemini —{" "}
            <em style={{ color: "var(--amber-500)", fontWeight: 700, fontStyle: "italic" }}>используйте все модели сразу,</em>
            {" "}каждую для того, в чём она сильнее.
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--ink-200)",
            }}
          >
            <em style={{ color: "var(--amber-500)", fontWeight: 700, fontStyle: "italic" }}>BYOK</em> (Bring Your Own Key) — вы подключаете свои API-ключи и платите только провайдерам.
            Мы оркестрируем, не перепродаём.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section
        style={{
          padding: "80px 32px",
          background: "var(--void-950)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1024, margin: "0 auto" }}>
          <SectionHeader
            num="06.B"
            title={<>Цен<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>ности.</em></>}
            align="center"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="xc-values-grid"
          >
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, borderColor: v.accent }}
                style={{
                  background: "var(--void-800)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 250ms",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: v.accent }} />
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: `${v.accent}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <v.icon size={20} color={v.accent} strokeWidth={1.75} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                    marginBottom: 8,
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ color: "var(--ink-300)", fontSize: 14, lineHeight: 1.55 }}>
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stats */}
      <section style={{ padding: "80px 32px", maxWidth: 1024, margin: "0 auto" }}>
        <SectionHeader
          num="06.C"
          title={<>Платформа в <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>цифрах.</em></>}
          align="center"
        />
        <div
          style={{
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
            className="xc-tech-grid"
          >
            {TECH_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                style={{
                  textAlign: "center",
                  padding: "20px 12px",
                  background: "var(--void-900)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 36,
                    fontWeight: 700,
                    background: "var(--grad-aurora)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {s.num}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section style={{ padding: "80px 32px", maxWidth: 880, margin: "0 auto" }}>
        <SectionHeader
          num="06.D"
          title={<>Конта<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>кты.</em></>}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
          }}
        >
          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CONTACTS.map((c, i) => (
              <motion.a
                key={c.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  color: "var(--ink-100)",
                  transition: "background 200ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--void-700)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <c.icon size={18} color="var(--violet-500)" strokeWidth={1.75} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {c.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      color: "var(--ink-50)",
                      marginTop: 2,
                    }}
                  >
                    {c.value}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .xc-values-grid, .xc-tech-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .xc-values-grid, .xc-tech-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <FinalCTA onCTA={onCTA} />
    </>
  );
}
