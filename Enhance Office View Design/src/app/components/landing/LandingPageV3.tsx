/**
 * XEROCODE Landing v3.0 — главный роутер.
 * Главный лендинг (Hero/SubHero/Manifest/Workspaces/Quick-nav) + 7 subpages.
 *
 * Reference: BRANDBOOK_FINAL_v3.0.html
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Film, FileText, Image as ImageIcon, MessageSquare,
  Music, Network, Terminal,
} from "lucide-react";
import { Logo } from "../brand";
import type { PlanName } from "../../lib/plans";
import { staggerItem, staggerList } from "../../lib/motion-presets";

// Subpages
import { PricingSubPage } from "./subpages/PricingSubPage";
import { CLISubPage } from "./subpages/CLISubPage";
import { BusinessSubPage } from "./subpages/BusinessSubPage";
import { ArenaSubPage } from "./subpages/ArenaSubPage";
import { FeaturesSubPage } from "./subpages/FeaturesSubPage";
import { AboutSubPage } from "./subpages/AboutSubPage";
import { FAQSubPage } from "./subpages/FAQSubPage";
import { TermsSubPage } from "./subpages/TermsSubPage";
import { PrivacySubPage } from "./subpages/PrivacySubPage";
import { SecuritySubPage } from "./subpages/SecuritySubPage";
import { CookieSubPage } from "./subpages/CookieSubPage";
import { SectionHeader } from "./shared/SectionHeader";

// ────────────────────────────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────────────────────────────

interface LandingPageV3Props {
  onSelectPlan?: (id: PlanName) => void;
  onCTA?: () => void;
}

export type SubPage =
  | null
  | "features"
  | "pricing"
  | "business"
  | "arena"
  | "cli"
  | "faq"
  | "about"
  | "terms"
  | "privacy"
  | "security"
  | "cookie";

const SUB_PAGES: Array<{ id: Exclude<SubPage, null>; label: string }> = [
  { id: "features", label: "Возможности" },
  { id: "pricing",  label: "Тарифы" },
  { id: "business", label: "Бизнесу" },
  { id: "arena",    label: "Арена" },
  { id: "cli",      label: "Терминал" },
  { id: "faq",      label: "FAQ" },
  { id: "about",    label: "О нас" },
];

const SUB_PAGE_IDS = [
  ...SUB_PAGES.map((p) => p.id),
  "terms",
  "privacy",
  "security",
  "cookie",
] as const;

const WORKSPACES = [
  { id: "chat",   name: "Chat",          tagline: "Общий диалог",   accent: "#7C5CFF", Icon: MessageSquare },
  { id: "text",   name: "Text",          tagline: "Документы",      accent: "#F8F8FB", Icon: FileText },
  { id: "code",   name: "Code",          tagline: "IDE · Sandbox",  accent: "#22C55E", Icon: Terminal },
  { id: "images", name: "Images",        tagline: "gpt-image-2",    accent: "#FFB547", Icon: ImageIcon },
  { id: "video",  name: "Video",         tagline: "Sora · Veo",     accent: "#FF3B5C", Icon: Film },
  { id: "sound",  name: "Sound",         tagline: "Suno · TTS",     accent: "#FF6BFF", Icon: Music },
  { id: "orch",   name: "Orchestration", tagline: "DAG · 5 modes",  accent: "#7C5CFF", Icon: Network },
  { id: "corp",   name: "Corporate",     tagline: "CRM · 1С",       accent: "#00D4FF", Icon: Building2 },
];

// ────────────────────────────────────────────────────────────────────────
// STICKY NAV
// ────────────────────────────────────────────────────────────────────────

function StickyNav({
  onLogin,
  currentPage,
  onNavigate,
}: {
  onLogin?: () => void;
  currentPage: SubPage;
  onNavigate: (p: SubPage) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const isOnSubpage = currentPage !== null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isPersistent = scrolled || isOnSubpage;

  return (
    <motion.header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "background 400ms, backdrop-filter 400ms, border-color 400ms",
        background: isPersistent ? "rgba(10, 10, 26, 0.85)" : "transparent",
        backdropFilter: isPersistent ? "blur(20px)" : "none",
        WebkitBackdropFilter: isPersistent ? "blur(20px)" : "none",
        borderBottom: isPersistent ? "1px solid var(--border-subtle)" : "1px solid transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 32px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <button
          onClick={() => onNavigate(null)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          data-no-mascot
        >
          <Logo size="xs" />
        </button>

        <nav
          style={{ display: "flex", gap: 4, alignItems: "center" }}
          className="xc-nav-desktop"
        >
          {SUB_PAGES.map((link) => {
            const active = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                data-mascot-trigger
                style={{
                  background: active ? "rgba(124,92,255,0.12)" : "transparent",
                  border: "none",
                  color: active ? "var(--violet-500)" : "var(--ink-300)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "color 200ms, background 200ms",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--ink-50)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--ink-300)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onLogin}
            data-mascot-trigger
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--ink-200)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 200ms, color 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--violet-500)";
              e.currentTarget.style.color = "var(--ink-50)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--ink-200)";
            }}
          >
            Войти
          </button>
          <button
            onClick={onLogin}
            data-mascot-trigger
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius-sm)",
              background: "var(--violet-500)",
              border: "none",
              color: "white",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 200ms, box-shadow 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #7C5CFF, #00D4FF)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(124,92,255,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--violet-500)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            Начать
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .xc-nav-desktop { display: none !important; }
        }
      `}</style>
    </motion.header>
  );
}

// ────────────────────────────────────────────────────────────────────────
// HERO  (только на главной)
// ────────────────────────────────────────────────────────────────────────

function HeroSection({ onCTA }: { onCTA?: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const mesh = meshRef.current;
    if (!hero || !mesh) return;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mesh.style.transform = `translate(${x * -30}px, ${y * -30}px) scale(1.1)`;
    };
    const onLeave = () => { if (mesh) mesh.style.transform = ""; };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn) return;
    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.04)`;
    };
    const onLeave = () => { if (btn) btn.style.transform = ""; };
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => {
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        ref={meshRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--grad-mesh)",
          transition: "transform 300ms var(--ease-smooth)",
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,92,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 70%)",
          opacity: 0.6,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: "relative", zIndex: 5 }}
      >
        <Logo size="display" />
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(20px, 3vw, 32px)",
            color: "var(--ink-200)",
            fontWeight: 400,
            marginTop: 32,
            marginBottom: 8,
          }}
        >
          AI doesn't <em style={{ color: "var(--amber-500)", fontWeight: 700 }}>chat.</em>{" "}
          AI <em style={{ color: "var(--amber-500)", fontWeight: 700 }}>works.</em>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--ink-300)",
            textTransform: "uppercase",
            marginTop: 24,
            marginBottom: 48,
          }}
        >
          Multi-model orchestration · 430+ models · Made in Russia
        </p>
        <button
          ref={ctaRef}
          data-mascot-trigger
          onClick={onCTA}
          style={{
            display: "inline-block",
            padding: "16px 32px",
            borderRadius: 9999,
            background: "var(--violet-500)",
            color: "white",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            transition: "transform 200ms var(--ease-emphasis), box-shadow 250ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 40px rgba(124,92,255,0.5)";
            e.currentTarget.style.background = "linear-gradient(135deg, #7C5CFF, #00D4FF)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "";
            e.currentTarget.style.background = "var(--violet-500)";
          }}
        >
          Попробовать бесплатно
        </button>
      </motion.div>

      <p
        style={{
          position: "absolute",
          bottom: 32,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.3em",
          color: "var(--text-muted)",
          zIndex: 5,
        }}
      >
        ↓ SCROLL
      </p>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SUBHERO BAND
// ────────────────────────────────────────────────────────────────────────

function SubHeroBand() {
  return (
    <section
      style={{
        padding: "96px 32px",
        textAlign: "center",
        background: "var(--void-900)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--ink-300)",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          ▸ Одна подписка вместо пяти
        </p>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "var(--ink-50)",
            marginBottom: 24,
          }}
        >
          Claude, GPT, Gemini, Grok работают{" "}
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: "var(--grad-aurora)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            вместе.
          </em>{" "}
          Проверяют друг друга.{" "}
          <em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--amber-500)" }}>
            Дают результат лучше любого одиночки.
          </em>
        </h2>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MANIFEST  (3 принципа)
// ────────────────────────────────────────────────────────────────────────

function ManifestSection() {
  return (
    <section style={{ padding: "120px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.3em",
          color: "var(--violet-500)",
          marginBottom: 24,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        ⌘ Manifesto
      </p>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "clamp(28px, 4vw, 56px)",
          lineHeight: 1.2,
          textAlign: "center",
          color: "var(--ink-50)",
          maxWidth: 1000,
          margin: "0 auto 96px",
        }}
      >
        «Мир делится на тех, кто <em style={{ color: "var(--amber-500)", fontWeight: 700 }}>говорит</em> с ИИ,
        и тех, кто <em style={{ color: "var(--amber-500)", fontWeight: 700 }}>работает</em> с ИИ.»
      </p>
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}
        className="xc-manifest-grid"
      >
        {[
          { num: "01", title: "Outcome > Output", text: "Считаем готовые файлы. Не токены. Результат — единственная метрика." },
          { num: "02", title: "Multi-model",      text: "Один Claude не лучше всех. Лучше — оркестр: правильная модель для правильной задачи." },
          { num: "03", title: "Russia-grade",     text: "Не русский Notion. ИИ, понимающий 1С, ЭДО, Битрикс, ЮKassa нативно." },
        ].map((p) => (
          <motion.div key={p.num} variants={staggerItem} style={{ borderTop: "1px solid var(--violet-500)", paddingTop: 32 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", color: "var(--violet-500)", marginBottom: 16 }}>
              № {p.num}
            </p>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700, color: "var(--ink-50)", marginBottom: 16, letterSpacing: "-0.02em" }}>
              {p.title}
            </h3>
            <p style={{ color: "var(--ink-200)", fontSize: 15, lineHeight: 1.7 }}>{p.text}</p>
          </motion.div>
        ))}
      </motion.div>
      <style>{`
        @media (max-width: 920px) {
          .xc-manifest-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// WORKSPACES  (8 карточек, превью)
// ────────────────────────────────────────────────────────────────────────

function WorkspacesSection() {
  return (
    <section
      style={{
        padding: "120px 32px",
        background: "var(--void-950)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="03"
          title={<>8 Workspaces. <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>Один мозг.</em></>}
          subtitle="Не один продукт. Восемь workspace'ов под одной оркестрацией. Как Adobe — но AI."
        />
        <motion.div
          variants={staggerList}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
          className="xc-ws-grid"
        >
          {WORKSPACES.map((w) => (
            <motion.div
              key={w.id}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: w.accent, boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 32px ${w.accent}40` }}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 250ms",
                aspectRatio: "1 / 1.15",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: w.accent }} />
              <w.Icon size={32} strokeWidth={1.5} color={w.accent} style={{ marginBottom: "auto" }} />
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 700, color: "var(--ink-50)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {w.name}
              </h4>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: w.accent, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                ▸ {w.tagline}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 920px) { .xc-ws-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .xc-ws-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// QUICK NAV  (мост к sub-страницам)
// ────────────────────────────────────────────────────────────────────────

function QuickNav({ onNavigate }: { onNavigate: (p: SubPage) => void }) {
  const ITEMS: Array<{ id: Exclude<SubPage, null>; label: string; subtitle: string; accent: string }> = [
    { id: "features", label: "Возможности", subtitle: "8 workspace · 7 категорий · 30+ фич",         accent: "#7C5CFF" },
    { id: "pricing",  label: "Тарифы",       subtitle: "6 тарифов · cost-tier · marg 35-39%",         accent: "#FFB547" },
    { id: "business", label: "Бизнесу",      subtitle: "12 модулей · 1С · Битрикс · команда",         accent: "#00D4FF" },
    { id: "arena",    label: "Арена",        subtitle: "4 режима · Elo · сравнение моделей",          accent: "#FF3B5C" },
    { id: "cli",      label: "Терминал",     subtitle: "CLI · Docker · git · Desktop Agent",          accent: "#22C55E" },
    { id: "faq",      label: "FAQ",          subtitle: "10 вопросов про BYOK · ЭДО · цены",           accent: "#FF6BFF" },
    { id: "about",    label: "О нас",        subtitle: "Манифест · MMXXVI · ИП · контакты",           accent: "#A88AFF" },
  ];
  return (
    <section
      style={{
        padding: "120px 32px",
        background: "var(--void-950)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="—"
          title={<>Что <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>дальше.</em></>}
          subtitle="Подробности по разделам — выбирай интересующее."
        />
        <motion.div
          variants={staggerList}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
          className="xc-quick-grid"
        >
          {ITEMS.map((p) => (
            <motion.button
              key={p.id}
              variants={staggerItem}
              onClick={() => onNavigate(p.id)}
              whileHover={{ y: -4, borderColor: p.accent, boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 32px ${p.accent}40` }}
              data-mascot-trigger
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 250ms",
                position: "relative",
                overflow: "hidden",
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.accent }} />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    color: p.accent,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  ▸ Раздел
                </p>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 26,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                    marginBottom: 8,
                  }}
                >
                  {p.label}
                </h4>
                <p style={{ color: "var(--ink-300)", fontSize: 13, lineHeight: 1.5 }}>{p.subtitle}</p>
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  color: p.accent,
                  textTransform: "uppercase",
                }}
              >
                Открыть →
              </div>
            </motion.button>
          ))}
        </motion.div>
        <style>{`
          @media (max-width: 1100px) { .xc-quick-grid { grid-template-columns: repeat(3, 1fr) !important; } }
          @media (max-width: 768px)  { .xc-quick-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 480px)  { .xc-quick-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// FOOTER
// ────────────────────────────────────────────────────────────────────────

function Footer({ onNavigate }: { onNavigate: (p: SubPage) => void }) {
  return (
    <footer
      style={{
        padding: "80px 32px 48px",
        background: "var(--void-950)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 64,
          }}
          className="xc-footer-grid"
        >
          <div>
            <Logo size="sm" style={{ marginBottom: 16 }} />
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--ink-300)",
                lineHeight: 1.5,
                maxWidth: 320,
              }}
            >
              «AI doesn't chat. <em style={{ color: "var(--amber-500)", fontWeight: 700, fontStyle: "italic" }}>AI works.</em>»
            </p>
          </div>
          {[
            { title: "Продукт",        links: [["Возможности", "features"], ["Тарифы", "pricing"], ["Бизнесу", "business"], ["Арена", "arena"]] as const },
            { title: "Разработчикам",  links: [["Терминал", "cli"], ["FAQ", "faq"], ["О нас", "about"]] as const },
            { title: "Документы",      links: [["Условия", "terms"], ["Конфиденциальность", "privacy"], ["Безопасность", "security"], ["Cookie", "cookie"]] as const },
          ].map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {col.title}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {col.links.map(([label, target]) => (
                  <li key={label}>
                    <button
                      onClick={() => onNavigate(target as SubPage)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        color: "var(--ink-300)",
                        fontSize: 14,
                        textDecoration: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        textAlign: "left",
                        transition: "color 200ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink-50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-300)"; }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            paddingTop: 32,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          <span>© XEROCODE · MMXXVI</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 920px) { .xc-footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .xc-footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN LANDING (короткий)
// ────────────────────────────────────────────────────────────────────────

function MainLanding({
  onCTA,
  onNavigate,
}: {
  onCTA?: () => void;
  onNavigate: (p: SubPage) => void;
}) {
  return (
    <>
      <HeroSection onCTA={onCTA} />
      <SubHeroBand />
      <ManifestSection />
      <WorkspacesSection />
      <QuickNav onNavigate={onNavigate} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ────────────────────────────────────────────────────────────────────────

export function LandingPageV3({ onSelectPlan, onCTA }: LandingPageV3Props) {
  const [subPage, setSubPage] = useState<SubPage>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    return p && SUB_PAGE_IDS.includes(p as Exclude<SubPage, null>) ? (p as SubPage) : null;
  });

  // Sync URL on subpage change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (subPage) url.searchParams.set("p", subPage);
    else url.searchParams.delete("p");
    window.history.replaceState({}, "", url.toString());
  }, [subPage]);

  const navigate = (p: SubPage) => {
    setSubPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => navigate(null);

  const renderSubPage = () => {
    switch (subPage) {
      case "features": return <FeaturesSubPage onBack={back} onCTA={onCTA} onNavigateArena={() => navigate("arena")} />;
      case "pricing":  return <PricingSubPage  onBack={back} onCTA={onCTA} onSelectPlan={onSelectPlan} />;
      case "business": return <BusinessSubPage onBack={back} onCTA={onCTA} />;
      case "arena":    return <ArenaSubPage    onBack={back} onCTA={onCTA} />;
      case "cli":      return <CLISubPage      onBack={back} onCTA={onCTA} />;
      case "faq":      return <FAQSubPage      onBack={back} onCTA={onCTA} />;
      case "about":    return <AboutSubPage    onBack={back} onCTA={onCTA} />;
      case "terms":    return <TermsSubPage    onBack={back} onCTA={onCTA} />;
      case "privacy":  return <PrivacySubPage  onBack={back} onCTA={onCTA} />;
      case "security": return <SecuritySubPage onBack={back} onCTA={onCTA} />;
      case "cookie":   return <CookieSubPage   onBack={back} onCTA={onCTA} />;
      default:         return null;
    }
  };

  return (
    <div style={{ background: "var(--void-900)", color: "var(--ink-100)", minHeight: "100vh" }}>
      <StickyNav onLogin={onCTA} currentPage={subPage} onNavigate={navigate} />

      <AnimatePresence mode="wait">
        {subPage === null ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <MainLanding onCTA={onCTA} onNavigate={navigate} />
          </motion.div>
        ) : (
          <motion.div
            key={subPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            {renderSubPage()}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer onNavigate={navigate} />
    </div>
  );
}
