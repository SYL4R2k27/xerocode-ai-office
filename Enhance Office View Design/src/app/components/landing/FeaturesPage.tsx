import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  ArrowLeft, Brain, Plug, Bot, Zap, Palette, Building2, Shield, Globe,
  Swords, Layout, Smartphone, Terminal, Code, FileText, BarChart3,
  GraduationCap, Users, ChevronDown, Trophy, Eye, GitBranch, Sparkles,
  MessageSquare, Cpu, Layers, ArrowRight, ExternalLink,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface FeaturesPageProps {
  onBack: () => void;
  onLogin: () => void;
  onNavigateArena?: () => void;
  hideHeader?: boolean;
}

/* ── Feature categories ── */
const categories = [
  {
    id: "orchestration",
    title: "Мульти-агентная оркестрация",
    desc: "AI-модели работают как команда. Supervisor разбивает задачу на части — агенты выполняют параллельно.",
    icon: Brain,
    color: "#7C3AED",
    gradient: "from-purple-500/10 to-indigo-500/5",
    features: [
      { icon: Bot, title: "3 режима работы", desc: "Менеджер, Обсуждение, Авто — под любую задачу" },
      { icon: MessageSquare, title: "Communication Bus", desc: "Модели обмениваются контекстом через внутреннюю шину" },
      { icon: Layers, title: "Smart Router", desc: "Автовыбор: прямой → OpenRouter → fallback" },
      { icon: Users, title: "До 20 агентов", desc: "Параллельная работа — каждый на своей части задачи" },
    ],
  },
  {
    id: "providers",
    title: "10 провайдеров, 430+ моделей",
    desc: "Все лучшие AI мира в одном окне. Свои ключи или наш пул — на выбор.",
    icon: Plug,
    color: "#4F7CFF",
    gradient: "from-blue-500/10 to-cyan-500/5",
    features: [
      { icon: Sparkles, title: "OpenAI", desc: "GPT-5.4, o3, GPT-4.1, DALL-E 3" },
      { icon: Brain, title: "Anthropic", desc: "Claude Opus 4.6, Sonnet 4.6, Haiku 4.5" },
      { icon: Globe, title: "Google", desc: "Gemini 2.5 Pro, Flash" },
      { icon: Zap, title: "xAI + Groq", desc: "Grok 4, Llama 3.3 70B (бесплатно)" },
      { icon: Palette, title: "Stability AI", desc: "SD 3.5, Upscale, Video, 3D — 21 сервис" },
      { icon: Layers, title: "OpenRouter", desc: "234+ моделей с fallback" },
      { icon: Cpu, title: "Ollama + Custom", desc: "Локальные и свои OpenAI-совместимые" },
      { icon: Shield, title: "BYOK", desc: "Свои ключи — платите провайдерам напрямую" },
    ],
  },
  {
    id: "tools",
    title: "Tool-calling и генерация",
    desc: "AI не просто отвечает — он выполняет: код, файлы, изображения, видео, 3D.",
    icon: Zap,
    color: "#F59E0B",
    gradient: "from-amber-500/10 to-orange-500/5",
    features: [
      { icon: Code, title: "Исполнение кода", desc: "Python, JS, bash — sandbox с защитой" },
      { icon: FileText, title: "Работа с файлами", desc: "Создание и редактирование через агент" },
      { icon: Palette, title: "Генерация изображений", desc: "SD 3.5, FLUX — text2img, img2img, upscale" },
      { icon: Sparkles, title: "Видео + 3D", desc: "Stability Video и Fast 3D из текста" },
    ],
  },
  {
    id: "panels",
    title: "7 профильных панелей",
    desc: "Каждая панель настраивает AI под конкретную задачу — готовые шаблоны и параметры.",
    icon: Layout,
    color: "#2DD4BF",
    gradient: "from-teal-500/10 to-emerald-500/5",
    features: [
      { icon: Code, title: "Код", desc: "Язык, фреймворк, стиль, тесты, review" },
      { icon: Palette, title: "Дизайн", desc: "SD 3.5, FLUX, стили, batch-генерация" },
      { icon: Globe, title: "Ресёрч", desc: "Глубина, источники, цитаты APA/ГОСТ" },
      { icon: FileText, title: "Текст", desc: "Тон, SEO, платформа, формат" },
      { icon: BarChart3, title: "Данные", desc: "CSV/SQL, графики, Python/R" },
      { icon: Users, title: "Менеджмент", desc: "Шаблоны, Jira/Notion, отчёты" },
      { icon: GraduationCap, title: "Обучение", desc: "Сократический метод, задачи, сложность" },
    ],
  },
  {
    id: "arena",
    title: "Эволюция — битва моделей",
    desc: "Какая модель лучше для ваших задач? Честный Elo-рейтинг.",
    icon: Swords,
    color: "#F43F5E",
    gradient: "from-rose-500/10 to-pink-500/5",
    link: true,
    features: [
      { icon: Swords, title: "Дуэль", desc: "2 модели, 1 задача — вы выбираете лучший ответ" },
      { icon: GitBranch, title: "Эволюция", desc: "Модели улучшают ответы друг друга цепочкой" },
      { icon: Trophy, title: "Турнир", desc: "4 модели, bracket, финал" },
      { icon: Eye, title: "Слепой тест", desc: "Имена скрыты — оценивайте только качество" },
    ],
  },
  {
    id: "corporate",
    title: "Корпоративный режим",
    desc: "Для команд 3-20 человек — единый дашборд, роли, аналитика.",
    icon: Building2,
    color: "#10B981",
    gradient: "from-emerald-500/10 to-green-500/5",
    features: [
      { icon: BarChart3, title: "Дашборд", desc: "Статистика, расходы, ROI от AI" },
      { icon: Layout, title: "Kanban", desc: "Задачи с ревью — менеджер проверяет AI" },
      { icon: Users, title: "3 роли", desc: "Руководитель, Менеджер, Сотрудник" },
      { icon: Shield, title: "SSO + Audit", desc: "SAML/OIDC, полная история действий" },
    ],
  },
  {
    id: "security",
    title: "Безопасность и доступность",
    desc: "Данные защищены, работает отовсюду без VPN.",
    icon: Shield,
    color: "#EF4444",
    gradient: "from-red-500/10 to-rose-500/5",
    features: [
      { icon: Shield, title: "AES-256 (Fernet)", desc: "Ключи шифруются, расшифровка только при запросе" },
      { icon: Zap, title: "JWT + Rate limiting", desc: "Безопасная авторизация + защита от DDoS" },
      { icon: Globe, title: "Без VPN из РФ", desc: "EU-прокси (VLESS+REALITY) — просто открываете сайт" },
      { icon: Smartphone, title: "Везде", desc: "Веб, мобильный, CLI, Electron — на любом устройстве" },
    ],
  },
];

/* ── Animated stat counter ── */
function AnimatedStat({ num, label, color, delay }: { num: string; label: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center overflow-hidden cursor-default group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${color}08, transparent 70%)` }} />
      <div className="relative text-3xl font-bold" style={{ color }}>{num}</div>
      <div className="relative text-white/30 text-xs mt-1">{label}</div>
    </motion.div>
  );
}

/* ── Category card ── */
function CategoryCard({ cat, index, isOpen, onToggle, onArenaClick }: {
  cat: typeof categories[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onArenaClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isOpen ? `bg-gradient-to-br ${cat.gradient}` : "hover:bg-white/[0.01]"
      }`}
      style={{ borderColor: isOpen ? `${cat.color}25` : "rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 md:p-6 text-left group"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-shadow duration-300"
          style={{
            background: `${cat.color}${isOpen ? "20" : "10"}`,
            boxShadow: isOpen ? `0 0 20px ${cat.color}15` : "none",
          }}
        >
          <cat.icon size={22} style={{ color: cat.color }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base group-hover:text-white transition-colors">{cat.title}</h3>
          <p className="text-white/30 text-sm mt-0.5 truncate group-hover:text-white/40 transition-colors">{cat.desc}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] text-white/25 text-[11px]">
            {cat.features.length}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronDown size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />
          </motion.div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-6 md:px-6 md:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cat.features.map((f, fi) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fi * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="p-4 rounded-xl border border-white/[0.04] transition-all cursor-default"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cat.color}10` }}
                      >
                        <f.icon size={15} style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{f.title}</h4>
                        <p className="text-white/30 text-xs leading-relaxed mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Arena link inside arena category */}
              {(cat as any).link && onArenaClick && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={onArenaClick}
                  whileHover={{ scale: 1.01 }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all"
                  style={{ borderColor: `${cat.color}30`, color: cat.color }}
                >
                  Подробнее об Арене
                  <ExternalLink size={14} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main page ── */
export function FeaturesPage({ onBack, onLogin, onNavigateArena, hideHeader }: FeaturesPageProps) {
  const [expanded, setExpanded] = useState<string | null>("orchestration");

  return (
    <div className="min-h-screen text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full" style={{ left: "5%", top: "10%", background: "radial-gradient(circle,rgba(124,58,237,0.06),transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{ right: "5%", top: "40%", background: "radial-gradient(circle,rgba(79,124,255,0.05),transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute w-[350px] h-[350px] rounded-full" style={{ left: "30%", bottom: "10%", background: "radial-gradient(circle,rgba(244,63,94,0.04),transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-center justify-between h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Назад
          </button>
          <LogoFull height={26} />
          <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all">
            Войти
          </button>
        </div>
      </header>
      )}

      <main className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            <svg viewBox="0 0 200 200" width="56" height="56" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="16" strokeLinecap="round" className="text-white">
                <line x1="58" y1="58" x2="88" y2="88" />
                <line x1="112" y1="112" x2="142" y2="142" />
                <line x1="142" y1="58" x2="112" y2="88" />
                <line x1="58" y1="142" x2="88" y2="112" />
              </g>
            </svg>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.02em" }}>
            Что умеет{" "}
            <span style={{ letterSpacing: "0.08em", fontWeight: 500 }}>XEROCODE</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[500px] mx-auto leading-relaxed">
            Полный набор инструментов для ускорения работы с AI
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-20">
          <AnimatedStat num="430+" label="AI-моделей" color="#818CF8" delay={0.1} />
          <AnimatedStat num="10" label="провайдеров" color="#5EEAD4" delay={0.15} />
          <AnimatedStat num="7" label="панелей" color="#FBBF24" delay={0.2} />
          <AnimatedStat num="4" label="режима арены" color="#F43F5E" delay={0.25} />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map((cat, i) => (
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 relative overflow-hidden rounded-3xl border border-white/[0.06] p-10 md:p-14 text-center"
        >
          {/* Glow bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.06] via-blue-500/[0.03] to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-purple-500/10 rounded-full blur-[80px]" />

          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Попробуй всё это прямо сейчас</h2>
            <p className="text-white/40 mb-8 max-w-[400px] mx-auto">3 дня бесплатно. Без сложной настройки. Работает сразу.</p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-500 hover:to-blue-400 transition-all shadow-lg shadow-purple-500/20"
            >
              Попробовать бесплатно
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
