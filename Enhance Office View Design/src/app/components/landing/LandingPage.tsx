import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket, Sparkles, Brain, Plug, Bot, Zap, Palette, Building2,
  Shield, Globe, ChevronDown, ChevronLeft, Check, X, Crown, Star,
  Menu, LogIn, ArrowRight, Monitor, Swords, Layout, Smartphone, Terminal,
  Code, FileText, BarChart3, GraduationCap, Users,
} from "lucide-react";

import { TermsPage } from "../legal/TermsPage";
import { PrivacyPage } from "../legal/PrivacyPage";
import { LogoIcon, LogoFull } from "../shared/Logo";
import { AgentConnect } from "../shared/AgentConnect";

interface LandingPageProps { onLogin: () => void; }
type Section = null | "features" | "pricing" | "faq" | "about" | "agent";

function useTypewriter(text: string, speed = 40, start = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start) { return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => { setDisplayed(text.slice(0, ++i)); if (i >= text.length) { clearInterval(iv); setDone(true); } }, speed);
    return () => clearInterval(iv);
  }, [text, speed, start]);
  return { displayed, done };
}

function MeshBg() {
  return (<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute w-[500px] h-[500px] rounded-full" style={{ left: "15%", top: "20%", background: "radial-gradient(circle,rgba(124,58,237,0.12),transparent 70%)", filter: "blur(60px)" }} />
    <div className="absolute w-[400px] h-[400px] rounded-full" style={{ left: "70%", top: "60%", background: "radial-gradient(circle,rgba(79,124,255,0.10),transparent 70%)", filter: "blur(60px)" }} />
    <div className="absolute w-[350px] h-[350px] rounded-full" style={{ left: "40%", top: "80%", background: "radial-gradient(circle,rgba(6,182,212,0.08),transparent 70%)", filter: "blur(60px)" }} />
  </div>);
}

function FeaturesContent() {
  const f = [
    { icon: Brain, t: "Мульти-агентная оркестрация", d: "3 режима: Менеджер, Обсуждение, Авто", c: "#7C3AED" },
    { icon: Plug, t: "10 провайдеров", d: "OpenAI, Anthropic, Google, xAI, Groq, Stability AI, OpenRouter, APIyi, Ollama, Custom", c: "#4F7CFF" },
    { icon: Bot, t: "430+ моделей", d: "GPT-5.4, Claude Opus 4.6, Grok 4, Gemini 2.5, SD 3.5, FLUX, DeepSeek V3", c: "#06B6D4" },
    { icon: Zap, t: "Tool-calling", d: "Модели пишут код, создают файлы, запускают команды", c: "#F59E0B" },
    { icon: Palette, t: "Генерация изображений", d: "Stable Diffusion 3.5, FLUX, Nano Banana", c: "#EC4899" },
    { icon: Building2, t: "Корпоративный режим", d: "Дашборд, Kanban, команды до 20 человек", c: "#10B981" },
    { icon: Shield, t: "Безопасность", d: "Fernet шифрование, JWT, rate limiting, HTTPS, 3 аудита пройдено", c: "#EF4444" },
    { icon: Globe, t: "Работа из РФ", d: "Без VPN, через EU-прокси (VLESS+REALITY)", c: "#8B5CF6" },
    { icon: Swords, t: "Эволюция — битва моделей", d: "Дуэль, Эволюция, Турнир, Слепой тест. Elo-рейтинг.", c: "#F43F5E" },
    { icon: Layout, t: "7 профильных панелей", d: "Код, Дизайн, Ресёрч, Текст, Данные, Менеджмент, Обучение", c: "#2DD4BF" },
    { icon: Smartphone, t: "Мобильный UI", d: "Telegram-стиль: свайпы, пузыри, bottom tabs", c: "#F97316" },
    { icon: Terminal, t: "CLI + Десктоп", d: "npx xerocode-agent или Electron-приложение (Mac/Win/Linux)", c: "#A855F7" },
  ];
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2">Что умеет XeroCode</motion.h2>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/50 mb-8">Платформа-оркестратор для командной работы 430+ ИИ-моделей</motion.p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {f.map((x, i) => (<motion.div key={x.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.01 }} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${x.c}15` }}><x.icon size={20} style={{ color: x.c }} /></div>
          <div><h3 className="text-white font-semibold text-sm mb-1">{x.t}</h3><p className="text-white/40 text-xs leading-relaxed">{x.d}</p></div>
        </div>
      </motion.div>))}
    </div>
  </div>);
}

function PricingContent() {
  const [exp, setExp] = useState<string | null>(null);
  const plans = [
    { id: "start", n: "START", p: "500₽", note: "единоразово", badge: "", c: "#6B7280", feat: ["50 задач/мес", "3 агента", "Свои модели (BYOK)", "Tool-calling", "3 дня триал"], all: ["50 задач/мес", "3 агента", "Свои модели (BYOK)", "Tool-calling", "Локальный агент", "Конструктор пулов", "Fallback OpenRouter"] },
    { id: "pro", n: "PRO", p: "1 990₽", note: "/ месяц", badge: "", c: "#10B981", feat: ["500 задач/мес", "10 агентов", "Бесплатный пул", "100 изображений/мес", "3 дня триал"], all: ["500 задач/мес", "10 агентов", "Бесплатный пул моделей", "100 изображений/мес", "Готовые пулы", "Всё из START"] },
    { id: "pp", n: "PRO PLUS", p: "5 490₽", note: "/ месяц", badge: "Популярный", c: "#4F7CFF", feat: ["2 000 задач/мес", "15 агентов", "Средние модели", "500 изображений/мес", "3 дня триал"], all: ["2 000 задач/мес", "15 агентов", "Средние модели (Haiku, GPT-4.1 mini)", "100K премиум токенов/день", "500 изображений", "Кастомные пулы", "Всё из PRO"] },
    { id: "ult", n: "ULTIMA", p: "34 990₽", note: "/ месяц", badge: "Безлимит", c: "#7C3AED", feat: ["Безлимитные задачи", "Безлимитные агенты", "ВСЕ премиум модели", "Безлимитные изображения"], all: ["Безлимитные задачи и агенты", "ВСЕ премиум модели", "GPT-5, Claude Opus, Grok 4", "Nano Banana Pro, FLUX, SD 3.5", "Docker Sandbox", "Всё из PRO PLUS"] },
    { id: "corp", n: "CORPORATE", p: "от 89 990₽", note: "/ месяц", badge: "", c: "#F59E0B", feat: ["3-20 профилей", "Дашборд + Kanban", "SSO, Audit log", "Только юр. лица"], all: ["3-20 профилей", "Роли: рук/менеджер/сотрудник", "Командный дашборд", "Kanban + Ревью", "Аналитика расходов", "SSO, Webhook", "Всё из ULTIMA"] },
  ];
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2">Тарифы</motion.h2>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/50 mb-8">3 дня бесплатно для START, PRO и PRO PLUS</motion.p>
    <div className="flex flex-wrap gap-4 justify-center">
      {plans.map((pl, i) => (<motion.div key={pl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ scale: 1.01 }} onClick={() => setExp(exp === pl.id ? null : pl.id)} className={`relative w-[190px] rounded-xl p-5 border cursor-pointer transition-all ${pl.id === "pp" ? "border-[#4F7CFF]/40 bg-[#4F7CFF]/5 scale-105" : pl.id === "ult" ? "border-[#7C3AED]/30 bg-[#7C3AED]/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
        {pl.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full border" style={{ background: `${pl.c}20`, borderColor: `${pl.c}40`, color: pl.c }}>{pl.badge}</span>}
        <h3 className="font-bold text-white text-sm mb-1">{pl.n}</h3>
        <div className="text-xl font-bold mb-0.5" style={{ color: pl.c }}>{pl.p}</div>
        <div className="text-white/30 text-[10px] mb-3">{pl.note}</div>
        {pl.feat.map(f => <div key={f} className="flex items-center gap-1.5 text-white/50 text-[11px] mb-1"><Check size={10} className="text-green-400 flex-shrink-0" />{f}</div>)}
        <div className="mt-3 text-center text-[10px]" style={{ color: pl.c }}>{exp === pl.id ? "Свернуть ▲" : "Подробнее ▼"}</div>
      </motion.div>))}
    </div>
    <AnimatePresence>{exp && (() => { const pl = plans.find(x => x.id === exp); if (!pl) return null; return (<motion.div key="exp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-6 p-6 rounded-xl border bg-white/[0.03]" style={{ borderColor: `${pl.c}30` }}>
      <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white">{pl.n} — {pl.p}</h3><button onClick={() => setExp(null)} className="text-white/40 hover:text-white"><X size={16} /></button></div>
      <div className="grid grid-cols-2 gap-2">{pl.all.map(f => <div key={f} className="flex items-center gap-2 text-white/60 text-xs"><Check size={12} style={{ color: pl.c }} />{f}</div>)}</div>
    </motion.div>); })()}</AnimatePresence>
  </div>);
}

function FAQContent() {
  const [op, setOp] = useState<number | null>(null);
  const items = [
    { q: "Что такое XeroCode?", a: "Платформа-хаб для объединения ИИ-моделей в команду. Ставите цель — модели распределяют задачи, общаются и доставляют результат." },
    { q: "Какие модели поддерживаются?", a: "430+ моделей через 10 провайдеров: OpenAI (GPT-5.4), Anthropic (Claude Opus 4.6), Google (Gemini 2.5), xAI (Grok 4), Groq, Stability AI, OpenRouter, APIyi, Ollama и Custom API." },
    { q: "Нужен ли VPN из России?", a: "Нет. API-запросы проходят через наш защищённый прокси (VLESS+REALITY). Просто открываете сайт." },
    { q: "Как подключить свои модели?", a: "Настройки → провайдер → API-ключ → модель. Или используйте готовые пулы." },
    { q: "Можно попробовать бесплатно?", a: "Да! START, PRO и PRO PLUS включают 3 дня триала." },
    { q: "Что такое оркестрация?", a: "Автоматическое распределение задач между моделями по их сильным сторонам." },
    { q: "Как модели общаются?", a: "Через Communication Bus — платформа передаёт контекст и результаты между моделями." },
    { q: "Корпоративный тариф?", a: "Дашборд, Kanban, до 20 сотрудников, ревью, аудит, SSO, webhook." },
    { q: "Как оплатить?", a: "Карта, СБП, МИР. Юр. лицам — счёт + акт с НДС." },
    { q: "Безопасность API-ключей?", a: "AES-256 шифрование, JWT + refresh tokens, rate limiting." },
  ];
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2">Частые вопросы</motion.h2>
    <div className="space-y-3 max-w-[600px] mt-6">
      {items.map((it, i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <button onClick={() => setOp(op === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left"><span className="text-white text-sm font-medium">{it.q}</span><motion.div animate={{ rotate: op === i ? 180 : 0 }}><ChevronDown size={16} className="text-white/30" /></motion.div></button>
        <AnimatePresence>{op === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="px-4 pb-4 text-white/50 text-xs leading-relaxed">{it.a}</div></motion.div>}</AnimatePresence>
      </motion.div>))}
    </div>
  </div>);
}

function AboutContent() {
  const panels = [
    { icon: Code, label: "Код", desc: "Язык, фреймворк, тесты, стиль кода", color: "#3b82f6" },
    { icon: Palette, label: "Дизайн", desc: "SD 3.5, FLUX, стили, Img2Img, batch", color: "#a855f7" },
    { icon: Sparkles, label: "Ресёрч", desc: "Глубина, источники, цитаты APA/ГОСТ", color: "#2dd4bf" },
    { icon: FileText, label: "Текст", desc: "Тон, длина, SEO, платформа", color: "#f59e0b" },
    { icon: BarChart3, label: "Данные", desc: "CSV/SQL, графики, Python/R", color: "#10b981" },
    { icon: Users, label: "Менеджмент", desc: "Шаблоны, Jira/Notion, отчёты", color: "#f43f5e" },
    { icon: GraduationCap, label: "Обучение", desc: "Сократ, задачи, сложность", color: "#8b5cf6" },
  ];
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-6">О проекте</motion.h2>
    <div className="max-w-[600px] space-y-6">
      {/* Mission */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">Миссия</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-3">XeroCode создаёт будущее, где ИИ-модели работают как команда. Вместо выбора между GPT, Claude или Gemini — используйте все сразу, каждую для того, в чём она лучше.</p>
        <p className="text-white/60 text-sm leading-relaxed">BYOK (Bring Your Own Key) — вы подключаете свои API-ключи и платите только провайдерам. Мы оркестрируем, не перепродаём.</p>
      </motion.div>

      {/* 7 panels */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-4">7 профильных панелей</h3>
        <div className="grid grid-cols-2 gap-2">
          {panels.map(p => (
            <div key={p.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${p.color}15` }}>
                <p.icon size={14} style={{ color: p.color }} />
              </div>
              <div>
                <div className="text-white text-[11px] font-semibold">{p.label}</div>
                <div className="text-white/30 text-[9px]">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Arena */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="p-6 rounded-xl bg-white/[0.03] border border-[#f43f5e]/20">
        <div className="flex items-center gap-2 mb-3">
          <Swords size={18} color="#f43f5e" />
          <h3 className="text-white font-semibold">Эволюция — битва моделей</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { mode: "Дуэль", desc: "2 модели, 1 задача, вы судья" },
            { mode: "Эволюция", desc: "Модели улучшают ответы друг друга" },
            { mode: "Турнир", desc: "4 модели, bracket, финал" },
            { mode: "Слепой тест", desc: "Имена скрыты до голосования" },
          ].map(a => (
            <div key={a.mode} className="p-2 rounded-lg bg-white/[0.02]">
              <div className="text-white text-[11px] font-semibold">{a.mode}</div>
              <div className="text-white/30 text-[9px]">{a.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-[10px] mt-3">Elo-рейтинг обновляется после каждого голосования</p>
      </motion.div>

      {/* Providers */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-3">Провайдеры</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "OpenAI", models: "GPT-5.4, o3, DALL-E 3", color: "#10a37f" },
            { name: "Anthropic", models: "Claude Opus 4.6, Sonnet, Haiku", color: "#d4a27f" },
            { name: "Google", models: "Gemini 2.5 Pro/Flash, Nano Banana", color: "#4285f4" },
            { name: "xAI", models: "Grok 4, Grok Code Fast", color: "#1da1f2" },
            { name: "Groq", models: "Llama 3.3 70B (бесплатно)", color: "#f55036" },
            { name: "Stability AI", models: "SD 3.5, Ultra, Video, 3D", color: "#9333ea" },
            { name: "OpenRouter", models: "245+ моделей, fallback", color: "#6366f1" },
            { name: "APIyi", models: "430+ моделей", color: "#ec4899" },
            { name: "Ollama", models: "Любая локальная модель", color: "#888" },
            { name: "Custom", models: "Любой OpenAI-совместимый API", color: "#666" },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <div>
                <div className="text-white text-[11px] font-semibold">{p.name}</div>
                <div className="text-white/30 text-[9px]">{p.models}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contacts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-3">Контакты</h3>
        <div className="space-y-2 text-white/60 text-sm">
          <p>Тирских Владимир Сергеевич</p>
          <p>ИНН: 503015361714</p>
          <p>Email: <a href="mailto:support@xerocode.space" className="text-purple-400">support@xerocode.space</a></p>
          <p>Коммерческие: <a href="mailto:sales@xerocode.space" className="text-purple-400">sales@xerocode.space</a></p>
          <p>Телефон: <a href="tel:+79166859658" className="text-purple-400">+7 (916) 685-96-58</a></p>
          <p>Сайт: <a href="https://xerocode.space" className="text-purple-400">xerocode.space</a></p>
          <p>GitHub: <a href="https://github.com/SYL4R2k27/xerocode-ai-office" className="text-purple-400" target="_blank" rel="noopener">github.com/SYL4R2k27</a></p>
          <p>npm: <a href="https://npmjs.com/package/xerocode-agent" className="text-purple-400" target="_blank" rel="noopener">xerocode-agent</a></p>
        </div>
      </motion.div>
    </div>
  </div>);
}

function CorporateContent() {
  const tiers = [
    { team: "3-5 человек", price: "89 990₽/мес", color: "#F59E0B" },
    { team: "6-10 человек", price: "179 990₽/мес", color: "#F59E0B" },
    { team: "11-15 человек", price: "229 990₽/мес", color: "#F59E0B" },
    { team: "16-20 человек", price: "379 990₽/мес", color: "#F59E0B" },
  ];
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2">Для бизнеса</motion.h2>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/50 mb-8">Командная работа с ИИ для компаний от 3 до 20 сотрудников</motion.p>
    <div className="max-w-[600px] space-y-6">

      {/* Hero block */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-[#7C3AED]/10 border border-[#F59E0B]/20">
        <h3 className="text-lg font-bold text-white mb-3">Единое рабочее пространство</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">Руководитель ставит цели, менеджеры распределяют задачи, сотрудники работают с ИИ — всё в одном интерфейсе. Как Битрикс24, но с командой из 430+ ИИ-моделей.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { role: "Руководитель", desc: "Дашборд, аналитика, бюджеты", icon: "👔" },
            { role: "Менеджер", desc: "Kanban, задачи, ревью", icon: "📋" },
            { role: "Сотрудник", desc: "Чат с ИИ, инструменты", icon: "💻" },
          ].map(r => (
            <div key={r.role} className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-xl mb-1">{r.icon}</div>
              <div className="text-white text-[11px] font-semibold">{r.role}</div>
              <div className="text-white/30 text-[9px] mt-1">{r.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Features grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-4">Что входит</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "📊", t: "Командный дашборд", d: "Статистика использования, расходы по сотрудникам, ROI от ИИ" },
            { icon: "📋", t: "Kanban-доска", d: "Задачи с ревью — менеджер проверяет результаты ИИ перед отправкой" },
            { icon: "👥", t: "Роли и доступы", d: "Руководитель / Менеджер / Сотрудник — каждому свои права" },
            { icon: "📈", t: "Аналитика расходов", d: "Сколько токенов потратил каждый сотрудник, на какие задачи" },
            { icon: "🔒", t: "SSO (SAML/OIDC)", d: "Единый вход через корпоративный аккаунт (Google Workspace, AD)" },
            { icon: "📝", t: "Аудит-лог", d: "Полная история действий всех сотрудников для compliance" },
            { icon: "🔔", t: "Webhook-уведомления", d: "Интеграция с Telegram, Slack — уведомления о завершении задач" },
            { icon: "🎨", t: "Брендинг", d: "Логотип компании, фон рабочего пространства, цветовая схема" },
            { icon: "🤖", t: "Все 430+ моделей", d: "GPT-5, Claude Opus, Gemini, Grok, Stability AI — без ограничений" },
            { icon: "⚡", t: "Безлимитные задачи", d: "Никаких лимитов на задачи, агентов, изображения и токены" },
            { icon: "🛡️", t: "Шифрование ключей", d: "API-ключи шифруются Fernet, расшифровываются только при запросе" },
            { icon: "🌐", t: "Без VPN из РФ", d: "Прозрачный EU-прокси — сотрудники работают без настроек" },
          ].map(f => (
            <div key={f.t} className="p-3 rounded-lg bg-white/[0.02]">
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="text-white text-[11px] font-semibold">{f.t}</div>
                  <div className="text-white/30 text-[9px] mt-0.5 leading-relaxed">{f.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pricing tiers */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-4">Тарифы для команд</h3>
        <div className="space-y-2">
          {tiers.map(t => (
            <div key={t.team} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <Users size={14} style={{ color: t.color }} />
                <span className="text-white text-[12px] font-medium">{t.team}</span>
              </div>
              <span className="text-[13px] font-bold" style={{ color: t.color }}>{t.price}</span>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-[10px] mt-3">Только для юр. лиц. Оплата по счёту + акт с НДС.</p>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-white font-semibold mb-4">Как это работает</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "Регистрация организации", desc: "Создаёте workspace, приглашаете сотрудников по email" },
            { step: "2", title: "Настройка моделей", desc: "Подключаете API-ключи компании или используете наши (безлимит)" },
            { step: "3", title: "Распределение ролей", desc: "Руководитель → Менеджер → Сотрудник, каждому свои доступы" },
            { step: "4", title: "Работа с ИИ", desc: "Сотрудники ставят цели, ИИ-команда выполняет, менеджер ревьюит" },
            { step: "5", title: "Аналитика", desc: "Дашборд с расходами, эффективностью и ROI от использования ИИ" },
          ].map((s, i) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>{s.step}</div>
              <div>
                <div className="text-white text-[12px] font-semibold">{s.title}</div>
                <div className="text-white/30 text-[10px]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="p-6 rounded-xl bg-gradient-to-r from-[#F59E0B]/15 to-[#F59E0B]/5 border border-[#F59E0B]/20 text-center">
        <h3 className="text-white font-bold text-lg mb-2">Готовы подключить команду?</h3>
        <p className="text-white/50 text-sm mb-4">Напишите нам — настроим workspace за 1 день</p>
        <a href="mailto:sales@xerocode.space" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105" style={{ background: "#F59E0B", color: "#000" }}>
          sales@xerocode.space
        </a>
      </motion.div>
    </div>
  </div>);
}

function AgentContent() {
  return (<div className="h-full overflow-y-auto p-8">
    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2">Десктоп-агент</motion.h2>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/50 mb-8">Подключите компьютер к XeroCode — ИИ будет работать с вашими файлами напрямую</motion.p>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-[500px]">
      <AgentConnect />
    </motion.div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 max-w-[500px] space-y-4">
      <h3 className="text-white font-semibold text-sm">Что умеет агент</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { icon: "📝", t: "Создавать и редактировать файлы", d: "write_file, read_file" },
          { icon: "⚡", t: "Запускать команды", d: "npm install, git commit..." },
          { icon: "🔍", t: "Искать по коду", d: "grep по паттернам" },
          { icon: "📁", t: "Навигация по проекту", d: "list_files, структура" },
          { icon: "🔒", t: "Песочница", d: "38 опасных команд заблокировано" },
          { icon: "🔄", t: "Авто-переподключение", d: "При обрыве — через 3 сек" },
        ].map((f) => (
          <div key={f.t} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <span className="text-lg">{f.icon}</span>
              <div>
                <p className="text-white text-xs font-medium">{f.t}</p>
                <p className="text-white/30 text-[10px]">{f.d}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>);
}

const NAV = [
  { id: "features" as Section, icon: Sparkles, label: "Возможности" },
  { id: "pricing" as Section, icon: Star, label: "Тарифы" },
  { id: "agent" as Section, icon: Monitor, label: "Агент" },
  { id: "faq" as Section, icon: ChevronDown, label: "FAQ" },
  { id: "about" as Section, icon: Building2, label: "О нас" },
];

const CONTENT: Record<string, React.ReactNode> = { features: <FeaturesContent />, pricing: <PricingContent />, agent: <AgentContent />, faq: <FAQContent />, about: <AboutContent /> };

export function LandingPage({ onLogin }: LandingPageProps) {
  const [section, setSection] = useState<Section>(null);
  const [showBtns, setShowBtns] = useState(false);
  const [mob, setMob] = useState(false);
  const [legalPage, setLegalPage] = useState<"terms" | "privacy" | null>(null);
  const { displayed: brand, done: brandDone } = useTypewriter("XeroCode", 80);
  const { displayed: botMsg, done: botDone } = useTypewriter("Привет! Я XeroCode — платформа для командной работы ИИ-моделей.\n430+ моделей, 10 провайдеров, 7 профильных панелей.\n\nКуда хотите перейти?", 20, brandDone);
  useEffect(() => { if (botDone) setTimeout(() => setShowBtns(true), 200); }, [botDone]);
  const go = useCallback((s: Section) => { setSection(s); setMob(false); }, []);

  if (legalPage === "terms") return <TermsPage onBack={() => setLegalPage(null)} />;
  if (legalPage === "privacy") return <PrivacyPage onBack={() => setLegalPage(null)} />;

  return (<div className="fixed inset-0 bg-[#0A0A0F] overflow-hidden flex flex-col">
    <MeshBg />
    {/* Header */}
    <div className="relative z-20 flex items-center justify-between px-6 py-4">
      <button onClick={() => setSection(null)}><LogoFull height={28} /></button>
      <div className="hidden md:flex items-center gap-4">
        {NAV.map(n => <button key={n.id} onClick={() => go(n.id)} className={`text-xs transition-colors ${section === n.id ? "text-white" : "text-white/40 hover:text-white/70"}`}>{n.label}</button>)}
        <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/70 text-xs hover:bg-white/5"><LogIn size={14} />Войти</button>
      </div>
      <button onClick={() => setMob(!mob)} className="md:hidden text-white/60"><Menu size={20} /></button>
    </div>
    <AnimatePresence>{mob && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-16 left-4 right-4 z-30 p-4 rounded-xl bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10">
      {NAV.map(n => <button key={n.id} onClick={() => go(n.id)} className="w-full flex items-center gap-3 px-4 py-3 text-white/60 text-sm hover:text-white"><n.icon size={16} />{n.label}</button>)}
      <button onClick={() => { onLogin(); setMob(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-purple-400 text-sm"><LogIn size={16} />Войти</button>
    </motion.div>}</AnimatePresence>

    {/* Main */}
    <div className="relative z-10 flex-1 flex overflow-hidden">
      <AnimatePresence mode="wait">
        {section === null ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full flex items-center justify-center p-6">
            <div className="max-w-[550px] w-full">
              <motion.h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
                {brand}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-purple-400">|</motion.span>
              </motion.h1>
              {brandDone && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0"><Bot size={16} className="text-purple-400" /></div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{botMsg}</p>
                </div>
              </motion.div>}
              {showBtns && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onLogin} className="col-span-2 flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-medium hover:from-purple-500 hover:to-blue-400"><Rocket size={16} />Войти в сервис</motion.button>
                {NAV.map((n, i) => <motion.button key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }} onClick={() => go(n.id)} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 text-sm hover:text-white hover:bg-white/[0.06]"><n.icon size={14} />{n.label}</motion.button>)}
              </motion.div>}
            </div>
          </motion.div>
        ) : (
          <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex">
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className="hidden md:flex flex-col h-full border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex-shrink-0 overflow-hidden">
              <div className="p-6"><div className="mb-1"><LogoFull height={24} /></div><p className="text-white/30 text-[11px]">ИИ-команда для ваших задач</p></div>
              <div className="flex-1 px-3 space-y-1">
                {NAV.map(n => <button key={n.id} onClick={() => go(n.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${section === n.id ? "bg-white/[0.06] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"}`}><n.icon size={16} />{n.label}</button>)}
                <div className="my-3 border-t border-white/[0.06]" />
                <button onClick={onLogin} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10"><LogIn size={16} />Войти в сервис</button>
              </div>
              <div className="p-4"><button onClick={() => setSection(null)} className="flex items-center gap-2 text-white/30 text-xs hover:text-white/60"><ChevronLeft size={14} />Назад</button></div>
            </motion.div>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={section} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="h-full">
                  {section && CONTENT[section]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <div className="relative z-10 text-center py-3 text-white/20 text-[10px] space-y-1">
      <div>© 2026 XeroCode — Тирских Владимир Сергеевич · ИНН 503015361714</div>
      <div>
        <a href="mailto:support@xerocode.space" className="hover:text-white/40 transition-colors">support@xerocode.space</a> ·{" "}
        <button onClick={() => setLegalPage("terms")} className="underline hover:text-white/40 transition-colors">Оферта</button> ·{" "}
        <button onClick={() => setLegalPage("privacy")} className="underline hover:text-white/40 transition-colors">Конфиденциальность</button>
      </div>
    </div>
  </div>);
}
