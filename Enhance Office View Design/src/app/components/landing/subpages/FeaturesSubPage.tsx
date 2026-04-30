/**
 * Features — все возможности XeroCode.
 * 4 animated stats + 7 раскрывающихся category-cards с под-фичами.
 */
import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Brain, Plug, Bot, Zap, Palette, Building2, Shield, Globe,
  Swords, Layout, Smartphone, Terminal, Code, FileText, BarChart3,
  GraduationCap, Users, ChevronDown, Trophy, Eye, GitBranch, Sparkles,
  MessageSquare, Cpu, Layers, ArrowRight,
} from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
  onNavigateArena?: () => void;
}

// ────────────────────────────────────────────────────────────────────────
// Categories (полный список из v2)
// ────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "orchestration",
    title: "Мульти-агентная оркестрация",
    desc: "AI-модели работают как команда. Supervisor разбивает задачу на части — агенты выполняют параллельно.",
    icon: Brain,
    accent: "#7C5CFF",
    features: [
      { icon: Bot,           title: "5 режимов работы",        desc: "manager · team · swarm · auction · xerocode_ai" },
      { icon: MessageSquare, title: "Communication Bus",       desc: "Модели обмениваются контекстом через внутреннюю шину" },
      { icon: Layers,        title: "Smart Router",            desc: "Автовыбор: direct → OpenRouter → apiyi → free" },
      { icon: Users,         title: "До 20 агентов",            desc: "Параллельная работа — каждый на своей части задачи" },
    ],
  },
  {
    id: "providers",
    title: "10 провайдеров, 430+ моделей",
    desc: "Все лучшие AI мира в одном окне. Свои ключи или наш пул — на выбор.",
    icon: Plug,
    accent: "#00D4FF",
    features: [
      { icon: Sparkles, title: "OpenAI",       desc: "GPT-5.4, gpt-image-2, o3, GPT-4.1, DALL-E 3" },
      { icon: Brain,    title: "Anthropic",    desc: "Claude Opus 4.7, Sonnet 4.6, Haiku 4.5" },
      { icon: Globe,    title: "Google",        desc: "Gemini 2.5 Pro, Flash, Imagen, Veo 3.1" },
      { icon: Zap,      title: "xAI + Groq",    desc: "Grok 4, Llama 3.3 70B (бесплатно)" },
      { icon: Palette,  title: "Stability AI", desc: "SD 3.5, Upscale, Video, 3D — 21 сервис" },
      { icon: Layers,   title: "OpenRouter",   desc: "234+ моделей с fallback" },
      { icon: Cpu,      title: "apiyi · Ollama",desc: "404+ моделей · локальные · OpenAI-совместимые" },
      { icon: Shield,   title: "BYOK",         desc: "Свои ключи — платите провайдерам напрямую" },
    ],
  },
  {
    id: "tools",
    title: "Tool-calling и генерация",
    desc: "AI не просто отвечает — он выполняет: код, файлы, изображения, видео, 3D, аудио.",
    icon: Zap,
    accent: "#FFB547",
    features: [
      { icon: Code,     title: "Исполнение кода",     desc: "Python, JS, bash — Docker sandbox с защитой" },
      { icon: FileText, title: "Документы PPTX/DOCX/XLSX", desc: "Генерация готовых файлов с премиум-дизайном" },
      { icon: Palette,  title: "Изображения",         desc: "gpt-image-2, FLUX 2 Pro, SD 3.5 Ultra" },
      { icon: Sparkles, title: "Видео + Аудио",       desc: "Sora · Veo 3.1 · Suno · ElevenLabs · Whisper" },
    ],
  },
  {
    id: "panels",
    title: "8 workspace'ов",
    desc: "Каждый workspace — под свой класс задач. Один мозг для всех.",
    icon: Layout,
    accent: "#22C55E",
    features: [
      { icon: MessageSquare, title: "Chat",          desc: "Общий диалог · 430+ моделей" },
      { icon: FileText,      title: "Text",          desc: "Документы · AI-coauthor · экспорт" },
      { icon: Code,          title: "Code",          desc: "IDE · Sandbox · git · LSP" },
      { icon: Palette,       title: "Images",        desc: "Text→Image · Inpaint · batch" },
      { icon: Sparkles,      title: "Video",         desc: "Sora · Veo · Runway · timeline" },
      { icon: GraduationCap, title: "Sound",         desc: "Suno · ElevenLabs · Whisper · EQ" },
      { icon: Users,         title: "Orchestration", desc: "DAG · 5 modes · multi-agent" },
      { icon: Building2,     title: "Corporate",     desc: "CRM · каналы · 1С · ЭДО" },
    ],
  },
  {
    id: "arena",
    title: "Эволюция — битва моделей",
    desc: "Какая модель лучше для ваших задач? Честный Elo-рейтинг.",
    icon: Swords,
    accent: "#FF3B5C",
    link: true,
    features: [
      { icon: Swords,    title: "Дуэль",       desc: "2 модели, 1 задача — вы выбираете лучший ответ" },
      { icon: GitBranch, title: "Эволюция",    desc: "Модели улучшают ответы друг друга цепочкой" },
      { icon: Trophy,    title: "Турнир",      desc: "4 модели, bracket, финал" },
      { icon: Eye,       title: "Слепой тест", desc: "Имена скрыты — оценивайте только качество" },
    ],
  },
  {
    id: "corporate",
    title: "Корпоративный режим",
    desc: "Для команд 3-50 человек — единый дашборд, роли, аналитика.",
    icon: Building2,
    accent: "#FF6BFF",
    features: [
      { icon: BarChart3, title: "Дашборд",     desc: "Статистика, расходы, ROI от AI" },
      { icon: Layout,    title: "Kanban",      desc: "Задачи с ревью — менеджер проверяет AI" },
      { icon: Users,     title: "5+ ролей",    desc: "Руководитель · Менеджер · Сотрудник + проф-роли" },
      { icon: Shield,    title: "SSO + Audit", desc: "SAML/OIDC, полная история действий" },
    ],
  },
  {
    id: "security",
    title: "Безопасность и доступность",
    desc: "Данные защищены, работает отовсюду без VPN.",
    icon: Shield,
    accent: "#A88AFF",
    features: [
      { icon: Shield,     title: "AES-256 (Fernet)",        desc: "Ключи шифруются, расшифровка только при запросе" },
      { icon: Zap,        title: "JWT + Rate limiting",     desc: "Безопасная авторизация + защита от DDoS" },
      { icon: Globe,      title: "Без VPN из РФ",           desc: "EU-прокси (SOCKS5) — просто открываете сайт" },
      { icon: Smartphone, title: "Везде",                   desc: "Веб · мобильный · CLI · Electron — на любом устройстве" },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────
// AnimatedStat — counter
// ────────────────────────────────────────────────────────────────────────

function AnimatedStat({ num, label, accent, delay }: { num: string; label: string; accent: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: "var(--void-800)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 48,
          fontWeight: 700,
          color: accent,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {num}
      </div>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Category card (раскрывающаяся)
// ────────────────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  index,
  isOpen,
  onToggle,
  onArenaClick,
}: {
  cat: typeof CATEGORIES[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onArenaClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      style={{
        background: "var(--void-800)",
        border: `1px solid ${isOpen ? cat.accent : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        transition: "border-color 250ms",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cat.accent }} />
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "24px 28px",
          background: "transparent",
          border: "none",
          color: "inherit",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: `${cat.accent}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <cat.icon size={22} color={cat.accent} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ink-50)",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            {cat.title}
          </h3>
          <p style={{ color: "var(--ink-300)", fontSize: 13, lineHeight: 1.5 }}>{cat.desc}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ flexShrink: 0, color: cat.accent }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 28px 28px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-subtle)",
                }}
                className="xc-cat-feat-grid"
              >
                {cat.features.map((f) => (
                  <div
                    key={f.title}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 14,
                      background: "var(--void-900)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <f.icon size={16} color={cat.accent} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <h4
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink-50)",
                          marginBottom: 2,
                        }}
                      >
                        {f.title}
                      </h4>
                      <p style={{ color: "var(--ink-300)", fontSize: 12, lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {cat.link && onArenaClick && (
                <button
                  onClick={onArenaClick}
                  data-mascot-trigger
                  style={{
                    marginTop: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: `${cat.accent}15`,
                    border: `1px solid ${cat.accent}40`,
                    color: cat.accent,
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 200ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${cat.accent}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${cat.accent}15`; }}
                >
                  Открыть страницу Арены
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @media (max-width: 600px) {
          .xc-cat-feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────

export function FeaturesSubPage({ onBack, onCTA, onNavigateArena }: Props) {
  const [expanded, setExpanded] = useState<string | null>("orchestration");

  return (
    <>
      <SubPageHero
        num="05"
        title={<>Возмож<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>ности.</em></>}
        subtitle="Полный набор инструментов для ускорения работы с AI. 7 категорий — раскрывайте интересующее."
        tag={{ icon: <Sparkles size={12} />, label: "7 категорий · 30+ фич", accent: "var(--violet-500)" }}
        onBack={onBack}
      />

      {/* Stats */}
      <section style={{ padding: "64px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
          className="xc-stats-grid"
        >
          <AnimatedStat num="430+" label="AI-моделей"        accent="#7C5CFF" delay={0.1}  />
          <AnimatedStat num="10"   label="провайдеров"        accent="#00D4FF" delay={0.15} />
          <AnimatedStat num="8"    label="workspace"          accent="#FFB547" delay={0.2}  />
          <AnimatedStat num="5"    label="режимов оркестрации" accent="#FF3B5C" delay={0.25} />
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "32px 32px 64px", maxWidth: 1024, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              isOpen={expanded === cat.id}
              onToggle={() => setExpanded(expanded === cat.id ? null : cat.id)}
              onArenaClick={onNavigateArena}
            />
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .xc-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <FinalCTA onCTA={onCTA} />
    </>
  );
}
