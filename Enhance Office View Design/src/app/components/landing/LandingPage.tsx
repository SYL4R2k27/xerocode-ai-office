import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  MessageSquare, FileText, BarChart3, Cog, Send, Bot,
  Clock, Zap, ArrowRight, Check, ChevronLeft,
  Users, TrendingUp, Headphones, ShoppingCart, FileCheck,
  PieChart, Megaphone, Settings, ChevronRight, LogIn, Menu, X,
  Swords, Terminal,
} from "lucide-react";

import { TermsPage } from "../legal/TermsPage";
import { PrivacyPage } from "../legal/PrivacyPage";
import { LogoFull } from "../shared/Logo";
import { PricingPage } from "./PricingPage";
import { FAQPage } from "./FAQPage";
import { AboutPage } from "./AboutPage";
import { AgentPage } from "./AgentPage";
import { BusinessPage } from "./BusinessPage";
import { ArenaPage } from "./ArenaPage";
import { FeaturesPage } from "./FeaturesPage";

/* ── Interfaces ── */
interface LandingPageProps { onLogin: () => void; }
type SubPage = null | "pricing" | "faq" | "about" | "agent" | "business" | "arena" | "features" | "terms" | "privacy";

/* ── Hooks ── */
function useTypewriter(text: string, speed = 40, start = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start) return;
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, start]);
  return { displayed, done };
}

function useCountUp(end: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return value;
}

/* ── Section wrapper with scroll animation ── */
function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.section
      ref={ref} id={id}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`relative w-full max-w-[1440px] mx-auto px-6 md:px-16 ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ── Gradient mesh background ── */
function MeshBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute w-[600px] h-[600px] rounded-full" style={{ left: "10%", top: "5%", background: "radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute w-[500px] h-[500px] rounded-full" style={{ left: "65%", top: "30%", background: "radial-gradient(circle,rgba(79,124,255,0.06),transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute w-[400px] h-[400px] rounded-full" style={{ left: "30%", top: "70%", background: "radial-gradient(circle,rgba(6,182,212,0.05),transparent 70%)", filter: "blur(80px)" }} />
    </div>
  );
}

/* ── Simple AI chat responder ── */
const CHAT_RESPONSES: Array<{ patterns: RegExp; reply: string }> = [
  { patterns: /отчёт|отчет|report/i, reply: "Готово! Отчёт сформирован:\n\n• Выручка: 2.4M ₽ (+18%)\n• Новых клиентов: 47\n• Средний чек: 51K ₽\n\nФайл отправлен." },
  { patterns: /письмо|email|mail|написа/i, reply: "Письмо готово:\n\nТема: Предложение о сотрудничестве\nТон: деловой, дружелюбный\nДлина: 150 слов\n\nОтправить?" },
  { patterns: /текст|пост|контент|статья|blog/i, reply: "Контент создан:\n\n• SEO-оптимизирован\n• 800 слов, структурирован\n• Tone of voice: профессиональный\n\nМогу адаптировать под площадку." },
  { patterns: /анализ|данн|csv|excel|аналитик/i, reply: "Анализ завершён:\n\n• 1 247 строк обработано\n• 3 ключевых тренда найдено\n• Визуализация готова\n\nОткрыть дашборд?" },
  { patterns: /план|задач|стратег|roadmap/i, reply: "План готов:\n\n1. Аудит текущих процессов — 2 дня\n2. Автоматизация рутины — 1 неделя\n3. Внедрение AI — 3 дня\n\nИтого: экономия 15ч/нед." },
  { patterns: /привет|hello|здравст|хай/i, reply: "Привет! Я XeroCode AI — помогаю делать задачи в 10 раз быстрее.\n\nПопробуйте:\n• «Подготовь отчёт»\n• «Напиши письмо клиенту»\n• «Проанализируй данные»" },
  { patterns: /что (ты )?(умеешь|можешь)|помо(щь|ги)/i, reply: "Я ускоряю работу с AI:\n\n• Отчёты и документы\n• Ответы клиентам\n• Контент и тексты\n• Анализ данных\n• Автоматизация рутины\n\nПросто опишите задачу!" },
  { patterns: /цена|стоим|тариф|сколько/i, reply: "Тарифы XeroCode:\n\n• START — 500₽ (разово)\n• PRO — 1 990₽/мес\n• PRO PLUS — 5 490₽/мес\n\n3 дня бесплатно на любом тарифе." },
  { patterns: /договор|контракт|юрид|документ/i, reply: "Документ подготовлен:\n\n• Шаблон: стандартный договор\n• Реквизиты подставлены\n• Проверка юр. терминов ✓\n\nГотов к подписанию." },
  { patterns: /клиент|поддержк|support|ответ/i, reply: "Ответ клиенту готов:\n\n• Тон: вежливый и конкретный\n• Решение проблемы включено\n• Время подготовки: 3 сек\n\nОтправить?" },
];

function getAIReply(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Опишите задачу — я выполню за секунды.";
  for (const { patterns, reply } of CHAT_RESPONSES) {
    if (patterns.test(trimmed)) return reply;
  }
  return `Обрабатываю: "${trimmed.slice(0, 40)}${trimmed.length > 40 ? "..." : ""}"\n\nЗадача принята. AI-команда из 430+ моделей выполнит её за секунды.\n\nЗарегистрируйтесь, чтобы получить полный результат.`;
}

/* ── 1. HERO — Interactive Chat ── */
function HeroSection({ onLogin }: { onLogin: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [demoPlayed, setDemoPlayed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play demo on mount
  useEffect(() => {
    if (demoPlayed) return;
    const t1 = setTimeout(() => {
      setMessages([{ role: "user", text: "Подготовь отчёт по продажам за март" }]);
      setTyping(true);
    }, 800);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Готово! Отчёт по продажам за март:\n\n• Выручка: 2.4M ₽ (+18%)\n• Новых клиентов: 47\n• Средний чек: 51K ₽\n\nФайл отправлен в Google Sheets."
      }]);
      setDemoPlayed(true);
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [demoPlayed]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, typing]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: "bot", text: getAIReply(text) }]);
    }, 800 + Math.random() * 700);
  }, [input, typing]);

  return (
    <div className="min-h-[100vh] flex items-center py-20 md:py-0">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        {/* Left — Copy */}
        <div className="flex-1 max-w-[600px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl md:text-[56px] font-bold leading-[1.1] tracking-tight text-white mb-6">
              Делай задачи в{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                10 раз быстрее
              </span>{" "}
              с XeroCode
            </h1>
            <p className="text-lg md:text-xl text-white/50 leading-relaxed mb-8 max-w-[480px]">
              Автоматизируй рутину, ускоряй процессы и освобождай время для роста
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onLogin}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-400 transition-all shadow-lg shadow-purple-500/20"
              >
                Попробовать бесплатно
              </motion.button>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-6 py-3.5 rounded-xl border border-white/[0.1] text-white/70 font-medium text-sm hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                Как это работает
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Right — Interactive Chat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[520px] flex-shrink-0"
        >
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/20 overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">XeroCode AI</div>
                <div className="text-green-400 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Онлайн
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-3 min-h-[260px] max-h-[340px] overflow-y-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={msg.role === "user" ? "flex justify-end" : "flex gap-2.5"}
                >
                  {msg.role === "bot" && (
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={11} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-purple-500/20 border border-purple-500/20 text-white/90"
                      : "rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06] text-white/80"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={11} className="text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/[0.06]">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Interactive input */}
            <div className="px-5 pb-4">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] focus-within:border-purple-500/30 transition-colors"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Напишите задачу..."
                  className="flex-1 bg-transparent text-white/90 text-sm placeholder:text-white/30 outline-none"
                  disabled={typing}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="text-white/20 hover:text-purple-400 disabled:hover:text-white/20 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── 3. PAIN POINTS ── */
function PainPoints() {
  const cards = [
    { icon: MessageSquare, title: "Ответы клиентам", desc: "Часы на типовые вопросы, которые AI закрывает мгновенно", color: "#818CF8" },
    { icon: FileText, title: "Документы и отчёты", desc: "Ручное создание файлов, которые AI генерирует за секунды", color: "#5EEAD4" },
    { icon: BarChart3, title: "Аналитика данных", desc: "Дни на анализ, который AI делает за минуты", color: "#FBBF24" },
    { icon: Cog, title: "Рутинные задачи", desc: "Повторяющиеся процессы, которые AI автоматизирует", color: "#FB7185" },
  ];
  return (
    <Section className="py-24 md:py-32">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-4">
          <Clock size={12} />
          Проблема
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ты теряешь часы на рутину каждый день
        </h2>
        <p className="text-white/40 text-lg max-w-[500px] mx-auto">
          Это время можно вернуть прямо сейчас
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, borderColor: `${c.color}30` }}
            className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] transition-all cursor-default"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ background: `${c.color}12` }}
            >
              <c.icon size={22} style={{ color: c.color }} />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{c.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ── 4. BEFORE/AFTER METRICS ── */
function MetricsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const metrics = [
    { before: "2 часа", after: 5, unit: "минут", label: "Ответы клиентам", color: "#818CF8" },
    { before: "1 день", after: 30, unit: "минут", label: "Отчёты и документы", color: "#5EEAD4" },
    { before: "3 часа", after: 10, unit: "минут", label: "Анализ данных", color: "#FBBF24" },
  ];
  return (
    <Section className="py-24 md:py-32">
      <div ref={ref} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/[0.08] via-blue-500/[0.04] to-cyan-500/[0.06] border border-white/[0.06] p-8 md:p-16">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Сократи время выполнения задач в разы
          </h2>
          <p className="text-white/40 text-lg">Реальные метрики наших пользователей</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {metrics.map((m, i) => {
            const count = useCountUp(m.after, 1500, inView);
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-white/30 text-lg line-through mb-2">{m.before}</div>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold" style={{ color: m.color }}>
                    {count}
                  </span>
                  <span className="text-xl text-white/50">{m.unit}</span>
                </div>
                <div className="text-white/60 text-sm font-medium">{m.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ── 5. USE CASES ── */
function UseCases() {
  const cases = [
    { icon: MessageSquare, title: "Ответы и поддержка", desc: "Мгновенные ответы клиентам на основе вашей базы знаний", color: "#818CF8" },
    { icon: FileText, title: "Документы", desc: "Договоры, КП, отчёты — AI создаёт за секунды", color: "#5EEAD4" },
    { icon: Megaphone, title: "Контент", desc: "Посты, рассылки, SEO-тексты — в нужном тоне и стиле", color: "#FB7185" },
    { icon: PieChart, title: "Анализ данных", desc: "Загрузи CSV — получи инсайты, графики и выводы", color: "#FBBF24" },
    { icon: Cog, title: "Автоматизация", desc: "Повторяющиеся задачи выполняются без участия человека", color: "#34D399" },
    { icon: Settings, title: "Процессы", desc: "Онбординг, чек-листы, workflow — AI управляет цепочками", color: "#A78BFA" },
  ];
  return (
    <Section className="py-24 md:py-32">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Один инструмент — десятки задач
        </h2>
        <p className="text-white/40 text-lg max-w-[500px] mx-auto">
          XeroCode подстраивается под любую бизнес-задачу
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {cases.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${c.color}12` }}
            >
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <h3 className="text-white font-semibold mb-2">{c.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ── 6. AI FOR BUSINESS ── */
function BusinessSection() {
  const items = [
    { icon: Headphones, title: "Поддержка", metric: "-60% времени", desc: "Автоматические ответы и маршрутизация обращений", color: "#818CF8" },
    { icon: ShoppingCart, title: "Продажи", metric: "+35% конверсия", desc: "Персонализация предложений и follow-up писем", color: "#5EEAD4" },
    { icon: FileCheck, title: "Документооборот", metric: "-80% ручного труда", desc: "Генерация и проверка договоров, актов, КП", color: "#FBBF24" },
    { icon: PieChart, title: "Аналитика", metric: "x5 быстрее", desc: "Дашборды и отчёты из сырых данных за минуты", color: "#FB7185" },
    { icon: Megaphone, title: "Маркетинг", metric: "+200% контента", desc: "Посты, рассылки, лендинги — в 3 раза быстрее", color: "#34D399" },
    { icon: Settings, title: "Операции", metric: "-50% рутины", desc: "Автоматизация внутренних процессов и отчётности", color: "#A78BFA" },
  ];
  return (
    <Section className="py-24 md:py-32">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-4">
          <TrendingUp size={12} />
          Для бизнеса
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          AI для ускорения бизнеса
        </h2>
        <p className="text-white/40 text-lg max-w-[500px] mx-auto">
          Каждый отдел работает быстрее с AI-командой
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${item.color}12` }}
              >
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                {item.metric}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ── 7. HOW IT WORKS ── */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Выбери задачу", desc: "Опиши что нужно — текстом, голосом или файлом. AI поймёт контекст.", color: "#818CF8" },
    { num: "02", title: "Запусти AI", desc: "Команда из 430+ моделей распределяет работу и выполняет задачу.", color: "#5EEAD4" },
    { num: "03", title: "Получи результат", desc: "Готовый ответ, документ или анализ — за секунды вместо часов.", color: "#FBBF24" },
  ];
  return (
    <Section className="py-24 md:py-32" id="how-it-works">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Начать проще, чем кажется
        </h2>
        <p className="text-white/40 text-lg">Три шага до результата</p>
      </div>
      <div className="relative max-w-[800px] mx-auto">
        {/* Connection line */}
        <div className="hidden md:block absolute top-[60px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-[2px] bg-gradient-to-r from-[#818CF8]/30 via-[#5EEAD4]/30 to-[#FBBF24]/30" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center relative"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold relative z-10"
                style={{ background: `${s.color}15`, color: s.color, boxShadow: `0 0 24px ${s.color}15` }}
              >
                {s.num}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 8. WORK FASTER ── */
function WorkFaster() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <Section className="py-24 md:py-32">
      <div ref={ref} className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
        <div className="flex-1 max-w-[500px]">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Работай быстрее,{" "}
            <span className="text-white/40">не больше</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-6">
            AI берёт на себя рутину — ты фокусируешься на стратегии и росте. Скорость выполнения задач напрямую влияет на доход.
          </p>
          <div className="space-y-4">
            {[
              "Экономия 20+ часов в неделю на типовых задачах",
              "Результат в секундах — не в часах ожидания",
              "Масштабируй команду без найма новых сотрудников",
            ].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-400" />
                </div>
                <span className="text-white/70 text-sm">{t}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex-1 max-w-[450px] w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
          >
            <div className="text-white/30 text-xs mb-4 font-medium uppercase tracking-wider">Продуктивность команды</div>
            <div className="space-y-3">
              {[
                { label: "Без AI", w: "30%", color: "#71717A" },
                { label: "С XeroCode", w: "92%", color: "#818CF8" },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/60">{b.label}</span>
                    <span style={{ color: b.color }} className="font-semibold">{b.w}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: b.w } : {}}
                      transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">x3</span>
              <span className="text-white/40 text-sm">рост скорости работы</span>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ── 9. CASE STUDIES ── */
function CaseStudies() {
  const [active, setActive] = useState(0);
  const cases = [
    { metric: "x5", label: "продуктивность", desc: "Маркетинговое агентство генерирует контент-план на месяц за 30 минут вместо 3 дней", industry: "Маркетинг" },
    { metric: "20ч", label: "экономия / неделя", desc: "Юридическая фирма автоматизировала подготовку типовых договоров и экспертиз", industry: "Юриспруденция" },
    { metric: "x3", label: "скорость ответов", desc: "Интернет-магазин снизил время ответа поддержки с 2 часов до 5 минут", industry: "E-commerce" },
  ];
  const colors = ["#818CF8", "#5EEAD4", "#FBBF24"];

  useEffect(() => {
    const iv = setInterval(() => setActive(a => (a + 1) % cases.length), 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Section className="py-24 md:py-32">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Результаты, которые чувствует бизнес
        </h2>
        <p className="text-white/40 text-lg">Реальные кейсы наших клиентов</p>
      </div>
      <div className="max-w-[700px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] text-white/40 text-xs mb-6">
              {cases[active].industry}
            </div>
            <div className="flex items-baseline justify-center gap-3 mb-4">
              <span className="text-5xl md:text-6xl font-bold" style={{ color: colors[active] }}>
                {cases[active].metric}
              </span>
              <span className="text-xl text-white/50">{cases[active].label}</span>
            </div>
            <p className="text-white/50 text-base leading-relaxed max-w-[500px] mx-auto">
              {cases[active].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {cases.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="relative w-8 h-1.5 rounded-full overflow-hidden bg-white/[0.08] transition-all"
            >
              {i === active && (
                <motion.div
                  layoutId="case-indicator"
                  className="absolute inset-0 rounded-full"
                  style={{ background: colors[i] }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 10. FINAL CTA ── */
function FinalCTA({ onLogin }: { onLogin: () => void }) {
  return (
    <Section className="py-24 md:py-32">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/[0.1] via-blue-500/[0.06] to-transparent border border-white/[0.06] p-10 md:p-16 text-center">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <h2 className="relative text-3xl md:text-4xl font-bold text-white mb-4">
          Начни экономить время уже сегодня
        </h2>
        <p className="relative text-white/40 text-lg mb-8 max-w-[450px] mx-auto">
          Без сложной настройки. Работает сразу.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          className="relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-500 hover:to-blue-400 transition-all shadow-lg shadow-purple-500/25"
        >
          Попробовать бесплатно
          <ArrowRight size={18} />
        </motion.button>
        <p className="relative text-white/20 text-sm mt-6">
          Бесплатный доступ · 430+ AI-моделей · Без VPN из России
        </p>
      </div>
    </Section>
  );
}

/* ── Page label mapping ── */
const PAGE_LABELS: Record<string, string> = {
  pricing: "Тарифы",
  features: "Возможности",
  arena: "Арена",
  business: "Бизнесу",
  agent: "Агент",
  faq: "FAQ",
  about: "О нас",
  terms: "Оферта",
  privacy: "Конфиденциальность",
};

const MAIN_NAV: Array<{ label: string; page: SubPage }> = [
  { label: "Тарифы", page: "pricing" },
  { label: "Возможности", page: "features" },
  { label: "Арена", page: "arena" },
  { label: "Бизнесу", page: "business" },
  { label: "Агент", page: "agent" },
  { label: "FAQ", page: "faq" },
  { label: "О нас", page: "about" },
];

/* ── DYNAMIC HEADER ── */
function DynamicHeader({ currentPage, onLogin, onNavigate }: {
  currentPage: SubPage;
  onLogin: () => void;
  onNavigate: (page: SubPage) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);
  const isSubPage = currentPage !== null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on page change
  useEffect(() => setMob(false), [currentPage]);

  return (
    <motion.header
      layout
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || isSubPage ? "bg-[#0A0A0F]/85 backdrop-blur-2xl border-b border-white/[0.06]" : ""
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-center h-16">
        {/* Left zone */}
        <div className="flex items-center gap-3 min-w-0">
          <AnimatePresence mode="wait">
            {isSubPage && (
              <motion.button
                key="back"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors mr-2 flex-shrink-0"
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            layout
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => { onNavigate(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex-shrink-0"
          >
            <LogoFull height={26} />
          </motion.button>

          {/* Current page label */}
          <AnimatePresence mode="wait">
            {isSubPage && (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:flex items-center gap-2 ml-2"
              >
                <span className="text-white/15 text-sm">/</span>
                <span className="text-white/60 text-sm font-medium">{PAGE_LABELS[currentPage!] || ""}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center — nav (only on landing) */}
        <div className="flex-1 flex justify-center">
          <AnimatePresence mode="wait">
            {!isSubPage ? (
              <motion.nav
                key="main-nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:flex items-center gap-1"
              >
                {MAIN_NAV.map((n, i) => (
                  <motion.button
                    key={n.label}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    onClick={() => onNavigate(n.page)}
                    className="px-3 py-1.5 rounded-lg text-white/40 text-sm hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                  >
                    {n.label}
                  </motion.button>
                ))}
              </motion.nav>
            ) : (
              <motion.nav
                key="sub-nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:flex items-center gap-1"
              >
                {MAIN_NAV.filter(n => n.page !== currentPage).slice(0, 4).map((n, i) => (
                  <motion.button
                    key={n.label}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    onClick={() => onNavigate(n.page)}
                    className="px-3 py-1.5 rounded-lg text-white/25 text-xs hover:text-white/60 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    {n.label}
                  </motion.button>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Right — login */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <motion.button
            layout
            transition={{ duration: 0.3 }}
            onClick={onLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all"
          >
            <LogIn size={14} />
            Войти
          </motion.button>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setMob(!mob)} className="md:hidden text-white/60 ml-auto">
          <AnimatePresence mode="wait">
            {mob ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={20} />
              </motion.div>
            ) : (
              <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.04]"
          >
            <div className="p-3 bg-[#0A0A0F]/95 backdrop-blur-2xl">
              {isSubPage && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => { onNavigate(null); setMob(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-white/40 text-sm hover:text-white rounded-lg hover:bg-white/[0.03]"
                >
                  <ChevronLeft size={14} />
                  На главную
                </motion.button>
              )}
              {MAIN_NAV.map((n, i) => (
                <motion.button
                  key={n.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { onNavigate(n.page); setMob(false); }}
                  className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-all ${
                    currentPage === n.page
                      ? "text-white bg-white/[0.04]"
                      : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  {n.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => { onLogin(); setMob(false); }}
                className="w-full text-left px-4 py-3 text-purple-400 text-sm font-medium rounded-lg hover:bg-purple-500/5"
              >
                Войти
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ── FOOTER ── */
function Footer({ onNavigate }: { onNavigate: (page: SubPage) => void }) {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] mt-8">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/20 text-xs">
        <div>© 2026 XeroCode — Тирских Владимир Сергеевич · ИНН 503015361714</div>
        <div className="flex items-center gap-4">
          <a href="mailto:support@xerocode.space" className="hover:text-white/40 transition-colors">support@xerocode.space</a>
          <button onClick={() => onNavigate("terms")} className="underline hover:text-white/40 transition-colors">Оферта</button>
          <button onClick={() => onNavigate("privacy")} className="underline hover:text-white/40 transition-colors">Конфиденциальность</button>
        </div>
      </div>
    </footer>
  );
}

/* ── Sub-page content renderer ── */
function SubPageContent({ page, onBack, onLogin, onNavigate }: {
  page: SubPage;
  onBack: () => void;
  onLogin: () => void;
  onNavigate: (p: SubPage) => void;
}) {
  const content = (() => {
    switch (page) {
      case "terms": return <TermsPage onBack={onBack} />;
      case "privacy": return <PrivacyPage onBack={onBack} />;
      case "pricing": return <PricingPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "faq": return <FAQPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "about": return <AboutPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "agent": return <AgentPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "business": return <BusinessPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "arena": return <ArenaPage onBack={onBack} onLogin={onLogin} hideHeader />;
      case "features": return <FeaturesPage onBack={onBack} onLogin={onLogin} onNavigateArena={() => onNavigate("arena")} hideHeader />;
      default: return null;
    }
  })();
  return <>{content}</>;
}

/* ── MAIN LANDING PAGE ── */
export function LandingPage({ onLogin }: LandingPageProps) {
  const [subPage, setSubPage] = useState<SubPage>(null);

  const goBack = useCallback(() => { setSubPage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const navigate = useCallback((page: SubPage) => { setSubPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      <MeshBg />
      <DynamicHeader currentPage={subPage} onLogin={onLogin} onNavigate={navigate} />

      <AnimatePresence mode="wait">
        {subPage ? (
          <motion.div
            key={subPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 pt-16"
          >
            <SubPageContent page={subPage} onBack={goBack} onLogin={onLogin} onNavigate={navigate} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <main>
              <HeroSection onLogin={onLogin} />
              <PainPoints />
              <MetricsSection />
              <div id="use-cases"><UseCases /></div>
              <div id="business"><BusinessSection /></div>
              <HowItWorks />
              <WorkFaster />
              <div id="cases"><CaseStudies /></div>
              <FinalCTA onLogin={onLogin} />
            </main>
            <Footer onNavigate={navigate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
