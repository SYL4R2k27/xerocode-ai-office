import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Menu,
  X,
  Zap,
  Sparkles,
  Check,
  Crown,
  Building2,
  Rocket,
  Plus,
  Minus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LandingPageProps {
  onLogin: () => void;
}

/* ------------------------------------------------------------------ */
/*  Animated section wrapper                                           */
/* ------------------------------------------------------------------ */
function Section({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS keyframes & global styles (injected once)                      */
/* ------------------------------------------------------------------ */
const globalStylesId = "xc-landing-styles";
function injectGlobalStyles() {
  if (document.getElementById(globalStylesId)) return;
  const style = document.createElement("style");
  style.id = globalStylesId;
  style.textContent = `
    @keyframes xc-drift-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-60px) scale(1.1)} 66%{transform:translate(-40px,40px) scale(0.95)} }
    @keyframes xc-drift-2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-100px,80px) scale(1.05)} }
    @keyframes xc-drift-3 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(60px,60px)} 75%{transform:translate(-80px,-30px)} }
    @keyframes xc-drift-4 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(50px,-80px) scale(1.08)} 80%{transform:translate(-60px,30px) scale(0.97)} }
    @keyframes xc-drift-5 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-70px,-50px)} }
    @keyframes xc-drift-6 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(90px,40px) scale(1.05)} 70%{transform:translate(-50px,-60px) scale(0.96)} }
    @keyframes xc-drift-7 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,70px)} }
    @keyframes xc-drift-8 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,50px) scale(1.1)} }
    @keyframes xc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
    @keyframes xc-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
    @keyframes xc-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes xc-node-pulse { 0%,100%{r:6} 50%{r:8} }
    @keyframes xc-line-dash { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }

    .xc-landing { background: #0A0A0F; color: #F5F5F7; font-family: Inter, system-ui, -apple-system, sans-serif; overflow-x: hidden; }
    .xc-landing * { box-sizing: border-box; margin: 0; padding: 0; }
    .xc-landing a { color: inherit; text-decoration: none; }

    .xc-gradient-text {
      background: linear-gradient(135deg, #F5F5F7 0%, #7C3AED 50%, #4F7CFF 100%);
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }
    .xc-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 28px; transition: all 0.3s ease;
    }
    .xc-card:hover {
      background: rgba(255,255,255,0.06); border-color: rgba(124,58,237,0.3);
      box-shadow: 0 0 30px rgba(124,58,237,0.08); transform: translateY(-2px);
    }
    .xc-btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #7C3AED, #4F7CFF); color: #fff;
      border: none; border-radius: 12px; padding: 14px 28px; font-size: 16px; font-weight: 600;
      cursor: pointer; transition: all 0.3s ease;
    }
    .xc-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
    .xc-btn-ghost {
      display: inline-flex; align-items: center; gap: 8px;
      background: transparent; color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
      padding: 14px 28px; font-size: 16px; font-weight: 500;
      cursor: pointer; transition: all 0.3s ease;
    }
    .xc-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.05); }

    .xc-section-label {
      font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
      color: #7C3AED; margin-bottom: 16px;
    }
    .xc-section-title {
      font-size: clamp(32px, 5vw, 48px); font-weight: 700; line-height: 1.15;
      color: #F5F5F7; margin-bottom: 20px;
    }
    .xc-section-subtitle {
      font-size: 18px; color: rgba(255,255,255,0.5); max-width: 600px; line-height: 1.6;
    }

    @media (max-width: 768px) {
      .xc-hide-mobile { display: none !important; }
      .xc-show-mobile { display: flex !important; }
    }
    @media (min-width: 769px) {
      .xc-show-mobile { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function LandingPage({ onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    injectGlobalStyles();
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------------------------------------------------------------- */
  /*  NAVIGATION                                                       */
  /* ---------------------------------------------------------------- */
  const nav = (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(10,10,15,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 20, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span className="xc-gradient-text">XeroCode</span>
      </div>

      <div className="xc-hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {[
          { label: "Возможности", id: "features" },
          { label: "Тарифы", id: "pricing" },
          { label: "FAQ", id: "faq" },
        ].map((l) => (
          <span key={l.id} onClick={() => scrollTo(l.id)} style={{ cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >{l.label}</span>
        ))}
      </div>

      <div className="xc-hide-mobile">
        <button onClick={onLogin} className="xc-btn-ghost" style={{ padding: "8px 20px", fontSize: 14 }}>Войти</button>
      </div>

      <button className="xc-show-mobile" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute", top: 64, left: 0, right: 0, background: "rgba(10,10,15,0.95)",
              backdropFilter: "blur(20px)", padding: 24, display: "flex", flexDirection: "column", gap: 20,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["features", "pricing", "faq"].map((id) => (
              <span key={id} onClick={() => scrollTo(id)} style={{ cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.7)" }}>
                {id === "features" ? "Возможности" : id === "pricing" ? "Тарифы" : "FAQ"}
              </span>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} className="xc-btn-ghost" style={{ padding: "10px 20px", fontSize: 14, width: "fit-content" }}>Войти</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );

  /* ---------------------------------------------------------------- */
  /*  HERO                                                             */
  /* ---------------------------------------------------------------- */
  const meshOrbs = [
    { color: "#7C3AED", size: 600, top: "10%", left: "20%", animation: "xc-drift-1 25s ease-in-out infinite", opacity: 0.12 },
    { color: "#4F7CFF", size: 500, top: "30%", left: "60%", animation: "xc-drift-2 30s ease-in-out infinite", opacity: 0.1 },
    { color: "#06B6D4", size: 450, top: "60%", left: "10%", animation: "xc-drift-3 35s ease-in-out infinite", opacity: 0.08 },
    { color: "#7C3AED", size: 350, top: "50%", left: "70%", animation: "xc-drift-4 22s ease-in-out infinite", opacity: 0.1 },
    { color: "#4F7CFF", size: 550, top: "5%", left: "75%", animation: "xc-drift-5 28s ease-in-out infinite", opacity: 0.07 },
    { color: "#8B5CF6", size: 400, top: "70%", left: "50%", animation: "xc-drift-6 32s ease-in-out infinite", opacity: 0.09 },
    { color: "#06B6D4", size: 300, top: "20%", left: "40%", animation: "xc-drift-7 40s ease-in-out infinite", opacity: 0.11 },
    { color: "#9333EA", size: 480, top: "80%", left: "30%", animation: "xc-drift-8 26s ease-in-out infinite", opacity: 0.08 },
  ];

  const hero = (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Mesh background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {meshOrbs.map((orb, i) => (
          <div key={i} style={{
            position: "absolute", top: orb.top, left: orb.left,
            width: orb.size, height: orb.size, borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            opacity: orb.opacity, filter: "blur(80px)", animation: orb.animation,
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 800 }}>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="xc-gradient-text"
          style={{ fontSize: "clamp(48px, 8vw, 80px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}
        >
          XeroCode
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 20 }}
        >
          Ваша команда ИИ-агентов
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}
        >
          Объединяйте любые ИИ-модели в одну команду. Ставьте задачи — агенты распределят работу и доставят результат.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          <button className="xc-btn-primary" onClick={onLogin}>Начать бесплатно <ArrowRight size={18} /></button>
          <button className="xc-btn-ghost" onClick={() => scrollTo("problem")}>Узнать больше <ChevronDown size={18} /></button>
        </motion.div>
      </div>

      {/* Bouncing chevron */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", animation: "xc-bounce 2s ease-in-out infinite", cursor: "pointer" }}
        onClick={() => scrollTo("providers")}
      >
        <ChevronDown size={28} color="rgba(255,255,255,0.3)" />
      </motion.div>
    </section>
  );

  /* ---------------------------------------------------------------- */
  /*  PROVIDERS                                                        */
  /* ---------------------------------------------------------------- */
  const providers = [
    { name: "OpenAI", abbr: "OA" },
    { name: "Anthropic", abbr: "AN" },
    { name: "Google", abbr: "GO" },
    { name: "Groq", abbr: "GQ" },
    { name: "xAI", abbr: "xA" },
    { name: "Ollama", abbr: "OL" },
    { name: "OpenRouter", abbr: "OR" },
  ];

  const providersSection = (
    <Section id="providers" className="">
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>
          Совместимо с лучшими ИИ-моделями
        </p>
        <div style={{ overflow: "hidden", position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 16, animation: "xc-marquee 30s linear infinite", width: "max-content" }}>
            {[...providers, ...providers].map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 40, fontSize: 14, color: "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap", transition: "all 0.3s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,124,255,0.2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                }}>{p.abbr}</span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  PROBLEM                                                          */
  /* ---------------------------------------------------------------- */
  const problems = [
    { icon: "🔀", title: "Переключение между чатами", desc: "ChatGPT для текста, Claude для кода, Midjourney для картинок. Каждый в своём окне.", accent: "#EF4444" },
    { icon: "🚫", title: "Нет командной работы", desc: "Модели не видят результаты друг друга. Вы — ручной передатчик данных.", accent: "#F59E0B" },
    { icon: "💸", title: "Дублирование расходов", desc: "Платите за 5 подписок. Используете 20% возможностей каждой.", accent: "#EF4444" },
  ];

  const problemSection = (
    <Section id="problem">
      <div style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <p className="xc-section-label">Проблема</p>
        <h2 className="xc-section-title" style={{ maxWidth: 700 }}>
          Десятки ИИ-моделей. Ни одна не работает в команде.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 48 }}>
          {problems.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
              className="xc-card" style={{ borderColor: `${p.accent}22`, borderLeftWidth: 3, borderLeftColor: `${p.accent}66` }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{p.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#F5F5F7" }}>{p.title}</h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  HOW IT WORKS                                                     */
  /* ---------------------------------------------------------------- */
  const steps = [
    { icon: "🔌", title: "Подключите модели", desc: "Добавьте API-ключи OpenAI, Claude, Gemini или используйте наши готовые пулы." },
    { icon: "🎯", title: "Поставьте цель", desc: "Опишите задачу. Выберите режим: Менеджер, Обсуждение или Авто." },
    { icon: "✨", title: "Получите результат", desc: "Модели разбивают задачу, пишут код, генерируют дизайн, проверяют друг друга." },
  ];

  const howItWorks = (
    <Section id="how-it-works">
      <div style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p className="xc-section-label">Процесс</p>
        <h2 className="xc-section-title">Как это работает</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, marginTop: 56, position: "relative" }}>
          {/* Connecting line (desktop only) */}
          <div className="xc-hide-mobile" style={{
            position: "absolute", top: 52, left: "20%", right: "20%", height: 2,
            background: "repeating-linear-gradient(90deg, rgba(124,58,237,0.3) 0px, rgba(124,58,237,0.3) 6px, transparent 6px, transparent 12px)",
          }} />
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 0.5 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "linear-gradient(135deg, #7C3AED, #4F7CFF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 24,
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
              }}>{i + 1}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, color: "#F5F5F7" }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 300 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  FEATURES BENTO GRID                                              */
  /* ---------------------------------------------------------------- */
  const featureCards = [
    { title: "Мульти-агентная оркестрация", desc: "Несколько моделей работают одновременно: планировщик раздаёт задачи, исполнители выполняют, ревьюер проверяет.", large: true, hasAnimation: true },
    { title: "60+ моделей", desc: "GPT-4o, Claude 3.5, Gemini Pro, Llama 3, Mistral и десятки других.", icon: <Sparkles size={24} /> },
    { title: "Tool-calling", desc: "Агенты используют инструменты: браузер, файлы, API, базы данных.", icon: <Zap size={24} /> },
    { title: "Генерация изображений", desc: "DALL-E, Stable Diffusion, Midjourney-подобные модели в одном интерфейсе.", icon: "🎨" },
    { title: "Без VPN из РФ", desc: "Прямой доступ ко всем моделям через российские серверы. Никаких блокировок.", icon: "🌐" },
    { title: "Корпоративный режим", desc: "Kanban-доска, командные чаты, ревью, аудит действий, SSO.", icon: <Building2 size={24} /> },
    { title: "Конструктор пулов", desc: "Создавайте свои наборы моделей под задачу. Автоматическая ротация, фолбэки, приоритеты.", large: true, icon: <Rocket size={24} /> },
  ];

  const featuresSection = (
    <Section id="features">
      <div style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="xc-section-label">Платформа</p>
          <h2 className="xc-section-title">Возможности</h2>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          {featureCards.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="xc-card"
              style={{
                gridColumn: f.large ? "span 2" : "span 1",
                minHeight: f.large ? 200 : 160,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Animated node diagram for orchestration card */}
              {f.hasAnimation && (
                <svg style={{ position: "absolute", top: 16, right: 16, opacity: 0.3 }} width="120" height="80" viewBox="0 0 120 80">
                  <line x1="30" y1="40" x2="60" y2="20" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "xc-line-dash 2s linear infinite" }} />
                  <line x1="30" y1="40" x2="60" y2="60" stroke="#4F7CFF" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "xc-line-dash 2s linear infinite 0.5s" }} />
                  <line x1="60" y1="20" x2="95" y2="40" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "xc-line-dash 2s linear infinite 1s" }} />
                  <line x1="60" y1="60" x2="95" y2="40" stroke="#4F7CFF" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "xc-line-dash 2s linear infinite 1.5s" }} />
                  <circle cx="30" cy="40" r="6" fill="#7C3AED" style={{ animation: "xc-node-pulse 2s ease-in-out infinite" }} />
                  <circle cx="60" cy="20" r="5" fill="#4F7CFF" style={{ animation: "xc-node-pulse 2s ease-in-out infinite 0.3s" }} />
                  <circle cx="60" cy="60" r="5" fill="#4F7CFF" style={{ animation: "xc-node-pulse 2s ease-in-out infinite 0.6s" }} />
                  <circle cx="95" cy="40" r="6" fill="#7C3AED" style={{ animation: "xc-node-pulse 2s ease-in-out infinite 0.9s" }} />
                </svg>
              )}
              <div>
                <div style={{ fontSize: 28, marginBottom: 14, color: "#7C3AED" }}>
                  {typeof f.icon === "string" ? f.icon : f.icon || null}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#F5F5F7" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Responsive override for mobile */}
        <style>{`
          @media (max-width: 768px) {
            #features [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
            #features [style*="grid-column: span 2"] { grid-column: span 1 !important; }
          }
        `}</style>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  PRODUCT DEMO                                                     */
  /* ---------------------------------------------------------------- */
  const demoSection = (
    <Section id="demo">
      <div style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p className="xc-section-label">Интерфейс</p>
        <h2 className="xc-section-title">Платформа в действии</h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          style={{
            marginTop: 48, borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(124,58,237,0.2)",
            background: "rgba(255,255,255,0.02)",
            boxShadow: "0 0 60px rgba(124,58,237,0.08)",
            animation: "xc-bounce 6s ease-in-out infinite",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 220px", minHeight: 380 }}>
            {/* Left sidebar */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", padding: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Модели</div>
              {["GPT-4o", "Claude 3.5", "Gemini Pro", "Llama 3", "DALL-E 3"].map((m, i) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: 8, marginBottom: 6, fontSize: 13,
                  color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
                  background: i === 0 ? "rgba(124,58,237,0.15)" : "transparent",
                }}>
                  <span style={{
                    display: "inline-block", width: 6, height: 6, borderRadius: 3,
                    background: i < 3 ? "#22C55E" : "rgba(255,255,255,0.2)", marginRight: 8,
                  }} />
                  {m}
                </div>
              ))}
            </div>

            {/* Center chat */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #7C3AED, #4F7CFF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>ME</div>
                <div style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: "4px 14px 14px 14px",
                  padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 400, textAlign: "left",
                }}>Создай лендинг для SaaS продукта с секциями hero, pricing и FAQ</div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <div style={{
                  background: "rgba(124,58,237,0.1)", borderRadius: "14px 4px 14px 14px",
                  padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 400, textAlign: "left",
                  border: "1px solid rgba(124,58,237,0.15)",
                }}>
                  <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, display: "block", marginBottom: 6 }}>GPT-4o → Менеджер</span>
                  Разбиваю задачу на подзадачи. Claude напишет код, DALL-E сгенерирует изображения...
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "rgba(124,58,237,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>🤖</div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <div style={{
                  background: "rgba(79,124,255,0.08)", borderRadius: "14px 4px 14px 14px",
                  padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 400, textAlign: "left",
                  border: "1px solid rgba(79,124,255,0.12)",
                }}>
                  <span style={{ fontSize: 11, color: "#4F7CFF", fontWeight: 600, display: "block", marginBottom: 6 }}>Claude 3.5 → Кодер</span>
                  Hero-секция готова. Использую Next.js + Tailwind. Передаю DALL-E запрос на hero-image...
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "rgba(79,124,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>🧠</div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", padding: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Задачи</div>
              {[
                { label: "Планирование", status: "done" },
                { label: "Hero секция", status: "done" },
                { label: "Pricing блок", status: "active" },
                { label: "FAQ компонент", status: "pending" },
                { label: "Hero-изображение", status: "pending" },
              ].map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 13,
                  color: t.status === "done" ? "rgba(255,255,255,0.35)" : t.status === "active" ? "#fff" : "rgba(255,255,255,0.4)",
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: t.status === "done" ? "#22C55E" : t.status === "active" ? "linear-gradient(135deg, #7C3AED, #4F7CFF)" : "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {t.status === "done" && <Check size={10} color="#fff" />}
                    {t.status === "active" && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#fff", animation: "xc-pulse 1.5s ease-in-out infinite" }} />}
                  </div>
                  <span style={{ textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <p style={{ marginTop: 24, fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
          Код, дизайн, ресёрч — в одном окне
        </p>

        {/* Mobile responsive override */}
        <style>{`
          @media (max-width: 768px) {
            #demo [style*="grid-template-columns: 200px"] {
              grid-template-columns: 1fr !important;
            }
            #demo [style*="border-right"] { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
            #demo [style*="border-left"] { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.06); }
          }
        `}</style>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  FOR WHO                                                          */
  /* ---------------------------------------------------------------- */
  const audiences = [
    { icon: "👨‍💻", title: "Разработчики", desc: "Мультиплицируйте продуктивность. GPT планирует, Claude кодит, Llama тестирует." },
    { icon: "🎨", title: "Дизайнеры", desc: "Генерация макетов и автоматическая вёрстка по ним. Всё в одном потоке." },
    { icon: "📝", title: "Контент", desc: "Ресёрч + тексты + изображения. Одна цель — готовый контент-пак." },
    { icon: "🏢", title: "Компании", desc: "Командный дашборд, Kanban, ревью, аудит. До 20 сотрудников." },
  ];

  const forWhoSection = (
    <Section id="for-who">
      <div style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p className="xc-section-label">Аудитория</p>
        <h2 className="xc-section-title">Для кого</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 48 }}>
          {audiences.map((a, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
              className="xc-card" style={{ textAlign: "center", padding: 32 }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,124,255,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
              }}>{a.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#F5F5F7" }}>{a.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  PRICING                                                          */
  /* ---------------------------------------------------------------- */
  const plans = [
    {
      name: "Start", price: "500₽", period: "единоразово", icon: <Zap size={20} />,
      features: ["3 дня бесплатно", "50 задач", "3 агента", "BYOK (свои ключи)"],
      badge: "Триал 3 дня", highlighted: false, glow: false,
    },
    {
      name: "Pro", price: "1 990₽", period: "/мес", icon: <Sparkles size={20} />,
      features: ["3 дня бесплатно", "500 задач", "10 агентов", "Бесплатный пул моделей"],
      badge: "Триал 3 дня", highlighted: false, glow: false,
    },
    {
      name: "Pro Plus", price: "5 490₽", period: "/мес", icon: <Rocket size={20} />,
      features: ["3 дня бесплатно", "2 000 задач", "Средние модели", "Генерация изображений"],
      badge: "Популярный", highlighted: true, glow: false,
    },
    {
      name: "Ultima", price: "34 990₽", period: "/мес", icon: <Crown size={20} />,
      features: ["Безлимит задач", "Все премиум-модели", "Docker Sandbox", "Nano Banana Pro"],
      badge: "Безлимит", highlighted: false, glow: true,
    },
    {
      name: "Corporate", price: "от 89 990₽", period: "/мес", icon: <Building2 size={20} />,
      features: ["3-20 профилей", "Kanban + ревью", "SSO, Audit, Webhook", "Счёт + НДС"],
      badge: null, highlighted: false, glow: false,
    },
  ];

  const pricingSection = (
    <Section id="pricing">
      <div style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <p className="xc-section-label">Стоимость</p>
        <h2 className="xc-section-title">Тарифы</h2>
        <p className="xc-section-subtitle" style={{ margin: "0 auto 56px" }}>
          Прозрачная стоимость без скрытых платежей
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16, alignItems: "stretch",
        }}>
          {plans.map((plan, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: plan.highlighted
                  ? "2px solid transparent"
                  : plan.glow
                    ? "1px solid rgba(124,58,237,0.4)"
                    : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: plan.highlighted ? "36px 24px" : "32px 24px",
                display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden",
                transform: plan.highlighted ? "scale(1.03)" : "none",
                ...(plan.highlighted ? {
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03)), linear-gradient(135deg, #7C3AED, #4F7CFF)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                } : {}),
                ...(plan.glow ? {
                  boxShadow: "0 0 40px rgba(124,58,237,0.15)",
                } : {}),
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = plan.highlighted ? "scale(1.05)" : "translateY(-4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = plan.highlighted ? "scale(1.03)" : "none"; }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute", top: 16, right: 16, padding: "4px 12px",
                  borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: plan.highlighted ? "linear-gradient(135deg, #7C3AED, #4F7CFF)" : "rgba(124,58,237,0.15)",
                  color: plan.highlighted ? "#fff" : "#7C3AED",
                }}>{plan.badge}</div>
              )}
              <div style={{ color: "#7C3AED", marginBottom: 16 }}>{plan.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#F5F5F7" }}>{plan.name}</h3>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#F5F5F7" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{plan.period}</span>
              </div>
              <div style={{ flex: 1 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                    <Check size={14} color="#7C3AED" />
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={onLogin}
                style={{
                  marginTop: 24, width: "100%", padding: "12px 20px",
                  borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: plan.highlighted ? "linear-gradient(135deg, #7C3AED, #4F7CFF)" : "rgba(255,255,255,0.06)",
                  color: plan.highlighted ? "#fff" : "rgba(255,255,255,0.7)",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
              >
                Выбрать
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  FAQ                                                              */
  /* ---------------------------------------------------------------- */
  const faqItems = [
    { q: "Что такое XeroCode?", a: "XeroCode — платформа для работы с мульти-агентными ИИ-командами. Вы подключаете любые модели и они работают вместе над вашими задачами, распределяя работу автоматически." },
    { q: "Какие модели поддерживаются?", a: "Более 60 моделей: GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Llama 3, Mistral, DALL-E 3, Stable Diffusion и многие другие. Список постоянно пополняется." },
    { q: "Нужен ли VPN для работы из России?", a: "Нет, VPN не нужен. Все модели доступны напрямую через наши серверы. Работайте из любой точки России без ограничений." },
    { q: "Как подключить свои модели?", a: "Добавьте API-ключи в настройках аккаунта. Поддерживаются OpenAI, Anthropic, Google, Groq и другие провайдеры. Можно также использовать наш встроенный пул моделей." },
    { q: "Можно ли попробовать бесплатно?", a: "Да! Тарифы Start, Pro и Pro Plus включают 3 дня бесплатного триала. Регистрируйтесь, подключайте модели и тестируйте без оплаты." },
    { q: "Что входит в корпоративный тариф?", a: "Корпоративный тариф включает 3-20 профилей сотрудников, Kanban-доску, систему ревью, аудит действий, SSO/LDAP интеграцию и персонального менеджера." },
  ];

  const faqSection = (
    <Section id="faq">
      <div style={{ padding: "100px 24px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="xc-section-label">Поддержка</p>
          <h2 className="xc-section-title">Частые вопросы</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {faqItems.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", textAlign: "left", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 16,
                  background: openFaq === i ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: openFaq === i ? "14px 14px 0 0" : 14,
                  padding: "18px 24px", cursor: "pointer", color: "#F5F5F7",
                  fontSize: 16, fontWeight: 500, transition: "all 0.2s",
                }}
              >
                {item.q}
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} color="rgba(255,255,255,0.4)" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      padding: "16px 24px 20px",
                      background: "rgba(255,255,255,0.02)",
                      borderLeft: "1px solid rgba(255,255,255,0.06)",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0 0 14px 14px",
                      fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
                    }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );

  /* ---------------------------------------------------------------- */
  /*  FINAL CTA + FOOTER                                               */
  /* ---------------------------------------------------------------- */
  const ctaAndFooter = (
    <>
      <Section id="cta">
        <div style={{ padding: "80px 24px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{
              padding: "56px 40px", borderRadius: 24,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid transparent",
              backgroundImage: "linear-gradient(rgba(10,10,15,1), rgba(10,10,15,1)), linear-gradient(135deg, #7C3AED, #4F7CFF)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, marginBottom: 16, color: "#F5F5F7" }}>
              Начните работать с ИИ-командой сегодня
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.6 }}>
              Подключите моделей, поставьте цель и получите результат
            </p>
            <button className="xc-btn-primary" onClick={onLogin} style={{ padding: "16px 36px", fontSize: 17 }}>
              Начать бесплатно <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </Section>

      <footer style={{
        padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.06)",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16,
          fontSize: 13, color: "rgba(255,255,255,0.35)",
        }}>
          <div>© 2026 XeroCode — Vladimir Tirskikh</div>
          <div>ИНН 503015361714 · Владимир Тирских</div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ cursor: "pointer" }} onClick={() => scrollTo("pricing")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >Тарифы</span>
            <span style={{ cursor: "pointer" }} onClick={() => scrollTo("faq")}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >FAQ</span>
            <span style={{ cursor: "pointer" }} onClick={onLogin}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >Войти</span>
            <span>xerocode.space</span>
          </div>
        </div>
      </footer>
    </>
  );

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="xc-landing">
      {nav}
      {hero}
      {providersSection}
      {problemSection}
      {howItWorks}
      {featuresSection}
      {demoSection}
      {forWhoSection}
      {pricingSection}
      {faqSection}
      {ctaAndFooter}
    </div>
  );
}
