import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LandingPageProps {
  onLogin: () => void;
}

type PageId = "menu" | "features" | "pricing" | "faq" | "about";

/* ------------------------------------------------------------------ */
/*  useTypewriter hook                                                 */
/* ------------------------------------------------------------------ */
function useTypewriter(text: string, speed: number = 30, active: boolean = true) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }
    setDisplayed("");
    setIsDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  return { displayed, isDone };
}

/* ------------------------------------------------------------------ */
/*  TypingIndicator                                                    */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3">
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: "#9B8EC4", animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: "#9B8EC4", animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: "#9B8EC4", animationDelay: "300ms" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BotMessage                                                         */
/* ------------------------------------------------------------------ */
function BotMessage({
  text,
  speed = 10,
  onDone,
  children,
  skipAnimation,
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
  children?: React.ReactNode;
  skipAnimation?: boolean;
}) {
  const { displayed, isDone } = useTypewriter(text, speed, !skipAnimation);

  useEffect(() => {
    if (isDone && onDone) onDone();
  }, [isDone, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 items-start max-w-[90%]"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] shrink-0 mt-1"
        style={{ backgroundColor: "rgba(155,126,196,0.2)" }}
      >
        <span role="img" aria-label="bot">&#x1F916;</span>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        <div
          className="rounded-2xl rounded-tl-md px-4 py-3 text-[14px] leading-relaxed"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F5F5F7",
          }}
        >
          <span style={{ whiteSpace: "pre-wrap" }}>{displayed}</span>
          {!isDone && (
            <span className="inline-block w-[2px] h-[16px] ml-0.5 animate-pulse" style={{ backgroundColor: "#9B8EC4", verticalAlign: "text-bottom" }} />
          )}
        </div>
        {isDone && children && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  UserMessage                                                        */
/* ------------------------------------------------------------------ */
function UserMessage({ text, speed = 20 }: { text: string; speed?: number }) {
  const { displayed, isDone } = useTypewriter(text, speed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end"
    >
      <div
        className="rounded-2xl rounded-tr-md px-4 py-3 text-[14px] leading-relaxed max-w-[80%]"
        style={{
          background: "linear-gradient(135deg, #6B46C1, #553C9A)",
          color: "#F5F5F7",
        }}
      >
        {displayed}
        {!isDone && (
          <span className="inline-block w-[2px] h-[16px] ml-0.5 animate-pulse" style={{ backgroundColor: "#fff", verticalAlign: "text-bottom" }} />
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  NavigationButtons                                                  */
/* ------------------------------------------------------------------ */
const NAV_ITEMS: { id: PageId | "login"; label: string; emoji: string; userText: string }[] = [
  { id: "login", label: "Войти в сервис", emoji: "\u{1F680}", userText: "" },
  { id: "features", label: "Что мы можем", emoji: "\u{1F4A1}", userText: "Расскажи, что вы умеете?" },
  { id: "pricing", label: "Тарифы и подписки", emoji: "\u{1F4B0}", userText: "Какие у вас тарифы?" },
  { id: "faq", label: "Частые вопросы", emoji: "\u{2753}", userText: "У меня есть вопросы" },
  { id: "about", label: "О нас", emoji: "\u{1F465}", userText: "Расскажи о себе" },
];

function NavigationButtons({
  onSelect,
  onLogin,
}: {
  onSelect: (id: PageId, userText: string) => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      {NAV_ITEMS.map((item, idx) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.3 }}
          onClick={() => {
            if (item.id === "login") {
              onLogin();
            } else {
              onSelect(item.id as PageId, item.userText);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            backgroundColor: "rgba(155,126,196,0.1)",
            border: "1px solid rgba(155,126,196,0.2)",
            color: "#D4C6F0",
          }}
          whileHover={{ backgroundColor: "rgba(155,126,196,0.2)" }}
        >
          <span className="text-[16px]">{item.emoji}</span>
          {item.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FeaturesContent                                                    */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { emoji: "\u{1F9E0}", title: "Мульти-агентная оркестрация", desc: "3 режима: Менеджер, Обсуждение, Авто" },
  { emoji: "\u{1F50C}", title: "9 провайдеров", desc: "OpenAI, Claude, Gemini, Grok, Groq, Stability, Ollama, OpenRouter, Custom" },
  { emoji: "\u{1F916}", title: "60+ моделей", desc: "GPT-5, Claude Opus, Grok 4, Nano Banana Pro и другие" },
  { emoji: "\u{26A1}", title: "Tool-calling", desc: "Модели пишут код, создают файлы, запускают команды" },
  { emoji: "\u{1F3A8}", title: "Генерация изображений", desc: "Nano Banana Pro, Stable Diffusion, FLUX" },
  { emoji: "\u{1F3E2}", title: "Корпоративный режим", desc: "Дашборд, Kanban, команды до 20 человек" },
  { emoji: "\u{1F512}", title: "Безопасность", desc: "Шифрование, JWT, rate limiting, HTTPS" },
  { emoji: "\u{1F30D}", title: "Работа из РФ", desc: "Без VPN, через защищённый прокси" },
];

function FeaturesContent({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="rounded-xl p-3.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-[20px] shrink-0">{f.emoji}</span>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: "#F5F5F7" }}>{f.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#A1A1A6" }}>{f.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[13px] mt-2"
        style={{ color: "#A1A1A6" }}
      >
        Хотите попробовать? Регистрация занимает 30 секунд.
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        onClick={onLogin}
        className="self-start px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #6B46C1, #553C9A)",
          color: "#fff",
          border: "none",
        }}
      >
        Начать бесплатно
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PricingContent                                                     */
/* ------------------------------------------------------------------ */
interface PlanData {
  name: string;
  price: string;
  badge?: string;
  badgeColor?: string;
  trial: boolean;
  keyFeatures: string[];
  allFeatures: { text: string; included: boolean }[];
}

const PLANS: PlanData[] = [
  {
    name: "START",
    price: "500\u20BD разово",
    trial: true,
    keyFeatures: ["50 задач", "3 агента", "BYOK (свои ключи)"],
    allFeatures: [
      { text: "50 задач", included: true },
      { text: "3 агента одновременно", included: true },
      { text: "BYOK (свои API-ключи)", included: true },
      { text: "3 дня бесплатного триала", included: true },
      { text: "Базовые модели", included: true },
      { text: "Email-поддержка", included: true },
      { text: "Бесплатный пул моделей", included: false },
      { text: "Средние и премиум модели", included: false },
      { text: "Корпоративные функции", included: false },
      { text: "Приоритетная поддержка", included: false },
    ],
  },
  {
    name: "PRO",
    price: "1 990\u20BD/мес",
    trial: true,
    keyFeatures: ["500 задач", "10 агентов", "Бесплатный пул"],
    allFeatures: [
      { text: "500 задач в месяц", included: true },
      { text: "10 агентов одновременно", included: true },
      { text: "Бесплатный пул моделей", included: true },
      { text: "3 дня бесплатного триала", included: true },
      { text: "BYOK + пул моделей", included: true },
      { text: "Расширенная аналитика", included: true },
      { text: "Приоритетная поддержка", included: true },
      { text: "Средние модели (Claude Sonnet, GPT-4o)", included: false },
      { text: "Премиум модели", included: false },
      { text: "Корпоративные функции", included: false },
    ],
  },
  {
    name: "PRO PLUS",
    price: "5 490\u20BD/мес",
    badge: "Популярный",
    badgeColor: "#6B46C1",
    trial: true,
    keyFeatures: ["2000 задач", "Средние модели", "Все из PRO"],
    allFeatures: [
      { text: "2000 задач в месяц", included: true },
      { text: "15 агентов одновременно", included: true },
      { text: "Средние модели (Claude Sonnet, GPT-4o)", included: true },
      { text: "3 дня бесплатного триала", included: true },
      { text: "BYOK + пул моделей", included: true },
      { text: "Расширенная аналитика", included: true },
      { text: "Приоритетная поддержка", included: true },
      { text: "Tool-calling", included: true },
      { text: "Генерация изображений", included: true },
      { text: "Премиум модели (Claude Opus, GPT-5)", included: false },
      { text: "Корпоративные функции", included: false },
    ],
  },
  {
    name: "ULTIMA",
    price: "34 990\u20BD/мес",
    badge: "Безлимит",
    badgeColor: "#D4A054",
    trial: false,
    keyFeatures: ["Безлимит задач", "Все модели", "Все премиум"],
    allFeatures: [
      { text: "Безлимитные задачи", included: true },
      { text: "Неограниченные агенты", included: true },
      { text: "Все модели (включая премиум)", included: true },
      { text: "Claude Opus, GPT-5, Grok 4", included: true },
      { text: "BYOK + полный пул", included: true },
      { text: "Расширенная аналитика", included: true },
      { text: "Приоритетная поддержка 24/7", included: true },
      { text: "Tool-calling без ограничений", included: true },
      { text: "Генерация изображений без лимитов", included: true },
      { text: "Ранний доступ к новым моделям", included: true },
    ],
  },
  {
    name: "CORPORATE",
    price: "от 89 990\u20BD/мес",
    trial: false,
    keyFeatures: ["3-20 профилей", "Kanban, Дашборд", "SSO, аудит"],
    allFeatures: [
      { text: "3-20 профилей в команде", included: true },
      { text: "Все из ULTIMA для каждого", included: true },
      { text: "Kanban-доска задач", included: true },
      { text: "Корпоративный дашборд", included: true },
      { text: "Управление командой", included: true },
      { text: "SSO-интеграция", included: true },
      { text: "Аудит действий", included: true },
      { text: "Выделенный менеджер", included: true },
      { text: "SLA 99.9%", included: true },
      { text: "Индивидуальные интеграции", included: true },
    ],
  },
];

function PlanCard({ plan }: { plan: PlanData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: plan.badge ? `1px solid ${plan.badgeColor}40` : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[15px] font-bold" style={{ color: "#F5F5F7" }}>{plan.name}</span>
          {plan.badge && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${plan.badgeColor}30`, color: plan.badgeColor }}
            >
              {plan.badge}
            </span>
          )}
        </div>
        <div className="text-[18px] font-bold mb-3" style={{ color: "#D4C6F0" }}>{plan.price}</div>
        {plan.trial && (
          <div className="text-[11px] mb-2 px-2 py-1 rounded-md inline-block" style={{ backgroundColor: "rgba(90,191,173,0.15)", color: "#5ABFAD" }}>
            3 дня бесплатного триала
          </div>
        )}
        <ul className="flex flex-col gap-1.5 mt-2">
          {plan.keyFeatures.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: "#A1A1A6" }}>
              <span style={{ color: "#5ABFAD" }}>{"\u2713"}</span> {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          style={{ color: "#9B8EC4", background: "none", border: "none" }}
        >
          {expanded ? "Свернуть \u25B2" : "Подробнее \u25BC"}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-2 flex flex-col gap-1.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {plan.allFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: f.included ? "#A1A1A6" : "#48484A" }}>
                  <span style={{ color: f.included ? "#5ABFAD" : "#48484A" }}>{f.included ? "\u2705" : "\u274C"}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PricingContent() {
  return (
    <div className="flex flex-col gap-3">
      {PLANS.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <PlanCard plan={p} />
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQContent                                                         */
/* ------------------------------------------------------------------ */
const FAQ_ITEMS = [
  { q: "Что такое XeroCode?", a: "Платформа-хаб для объединения ИИ-моделей в команду. Вы ставите задачу, а несколько моделей работают над ней параллельно, каждая в своей роли." },
  { q: "Какие модели поддерживаются?", a: "60+ моделей от 9 провайдеров: OpenAI (GPT-5, GPT-4o), Anthropic (Claude Opus, Sonnet), Google (Gemini), xAI (Grok 4), Groq, Stability AI, Ollama (локальные), OpenRouter и кастомные эндпоинты." },
  { q: "Нужен ли VPN для работы из России?", a: "Нет, все API работают через наш защищённый прокси-сервер. Подключение стабильное и быстрое без дополнительных настроек." },
  { q: "Как подключить свои модели?", a: "В настройках выберите провайдера, введите API-ключ. Модель появится в списке доступных агентов за несколько секунд." },
  { q: "Можно ли попробовать бесплатно?", a: "Да, тарифы START, PRO и PRO PLUS включают 3 дня бесплатного триала. Карта не требуется." },
  { q: "Что такое оркестрация?", a: "Платформа распределяет задачи между моделями по их сильным сторонам. Например, Claude анализирует текст, GPT пишет код, а Stable Diffusion создаёт изображения." },
  { q: "Как модели общаются между собой?", a: "Через Communication Bus \u2014 платформа передаёт контекст и результаты между агентами, организуя совместную работу." },
  { q: "Что входит в корпоративный тариф?", a: "Дашборд, Kanban, управление командой до 20 человек, аудит действий, SSO-интеграция и выделенный менеджер." },
  { q: "Как оплатить?", a: "Банковская карта, СБП, МИР. Для юридических лиц \u2014 счёт + акт." },
  { q: "Безопасно ли хранить API-ключи?", a: "Да, ключи шифруются AES-256 (Fernet), хранятся только на нашем сервере. Никто, кроме вас, не имеет к ним доступа." },
];

function FAQContent() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {FAQ_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
            style={{ background: "none", border: "none", color: "#F5F5F7" }}
          >
            <span className="text-[13px] font-medium">{item.q}</span>
            <span
              className="text-[12px] shrink-0 ml-2 transition-transform"
              style={{
                color: "#9B8EC4",
                transform: openIdx === i ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              {"\u25BC"}
            </span>
          </button>
          <AnimatePresence>
            {openIdx === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="px-4 pb-3 text-[12px] leading-relaxed"
                  style={{ color: "#A1A1A6", borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AboutContent                                                       */
/* ------------------------------------------------------------------ */
function AboutContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(155,126,196,0.08)", border: "1px solid rgba(155,126,196,0.15)" }}
      >
        <div className="text-[13px] font-semibold mb-2" style={{ color: "#D4C6F0" }}>
          {"\u{1F3AF}"} Миссия
        </div>
        <div className="text-[13px] leading-relaxed" style={{ color: "#A1A1A6" }}>
          Мы создаём будущее, где ИИ работает не поодиночке, а командой.
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-[13px] font-semibold mb-2" style={{ color: "#D4C6F0" }}>
          {"\u{1F4BB}"} Что мы делаем
        </div>
        <div className="text-[13px] leading-relaxed" style={{ color: "#A1A1A6" }}>
          XeroCode \u2014 платформа для командной работы ИИ-агентов. Мы объединяем 60+ моделей от 9 провайдеров в единую экосистему. Платформа сама распределяет задачи, организует взаимодействие между моделями и выдаёт результат. Работает из России без VPN.
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-[13px] font-semibold mb-2" style={{ color: "#D4C6F0" }}>
          {"\u{1F6E0}\uFE0F"} Технологии
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {["Python", "React", "PostgreSQL", "WebSocket", "FastAPI", "TypeScript"].map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{ backgroundColor: "rgba(94,158,214,0.12)", color: "#5E9ED6" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-[13px] font-semibold mb-2" style={{ color: "#D4C6F0" }}>
          {"\u{1F4E7}"} Контакты
        </div>
        <div className="text-[13px] leading-relaxed" style={{ color: "#A1A1A6" }}>
          <div>xerocode.space</div>
          <div className="mt-1">support@xerocode.space</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  AppMockupBackground                                                */
/* ------------------------------------------------------------------ */
function AppMockupBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ filter: "blur(8px)", opacity: 0.15 }}>
      {/* Sidebar mockup */}
      <div className="absolute left-0 top-0 bottom-0 w-[240px]" style={{ backgroundColor: "#242426" }}>
        <div className="p-4 flex flex-col gap-3">
          <div className="w-[80px] h-[12px] rounded" style={{ backgroundColor: "#9B8EC4" }} />
          <div className="w-[140px] h-[8px] rounded mt-4" style={{ backgroundColor: "#38383A" }} />
          <div className="w-[120px] h-[8px] rounded" style={{ backgroundColor: "#38383A" }} />
          <div className="w-[160px] h-[8px] rounded" style={{ backgroundColor: "#38383A" }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "#2C2C2E" }}>
              <div className="w-[100px] h-[8px] rounded" style={{ backgroundColor: "#48484A" }} />
              <div className="w-[60px] h-[6px] rounded mt-2" style={{ backgroundColor: "#38383A" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area mockup */}
      <div className="absolute left-[240px] right-[280px] top-0 bottom-0" style={{ backgroundColor: "#1C1C1E" }}>
        <div className="p-6 flex flex-col gap-4">
          <div className="h-[48px] rounded-xl flex items-center px-4" style={{ backgroundColor: "#242426" }}>
            <div className="w-[200px] h-[10px] rounded" style={{ backgroundColor: "#38383A" }} />
          </div>
          {/* Chat bubbles */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              <div
                className="rounded-xl p-3 max-w-[60%]"
                style={{
                  backgroundColor: i % 2 === 0 ? "#2A3A50" : "#2C2C2E",
                }}
              >
                <div className="w-[180px] h-[8px] rounded" style={{ backgroundColor: "#48484A" }} />
                <div className="w-[120px] h-[8px] rounded mt-2" style={{ backgroundColor: "#38383A" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel mockup */}
      <div className="absolute right-0 top-0 bottom-0 w-[280px]" style={{ backgroundColor: "#242426" }}>
        <div className="p-4 flex flex-col gap-3">
          <div className="w-[100px] h-[10px] rounded" style={{ backgroundColor: "#48484A" }} />
          <div className="mt-2 h-[120px] rounded-xl" style={{ backgroundColor: "#2C2C2E" }} />
          <div className="h-[80px] rounded-xl" style={{ backgroundColor: "#2C2C2E" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StickyHeader                                                       */
/* ------------------------------------------------------------------ */
function StickyHeader({ onLogin, scrolled }: { onLogin: () => void; scrolled: boolean }) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(28,28,30,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div
        className="text-[18px] font-bold"
        style={{
          background: "linear-gradient(135deg, #9B8EC4, #6B46C1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        XeroCode
      </div>
      <button
        onClick={onLogin}
        className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
        style={{
          backgroundColor: "rgba(155,126,196,0.15)",
          border: "1px solid rgba(155,126,196,0.25)",
          color: "#D4C6F0",
        }}
      >
        Войти
      </button>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <div
      className="text-center py-6 mt-6 text-[11px] leading-relaxed"
      style={{ color: "#6E6E73", borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div>&copy; 2026 XeroCode &mdash; Vladimir Tirskikh</div>
      <div className="mt-0.5">ИНН 503015361714 &middot; Владимир Тирских</div>
      <div className="mt-0.5">xerocode.space</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat state machine                                                 */
/* ------------------------------------------------------------------ */
type ChatPhase =
  | "brand-typing"
  | "bot-greeting"
  | "menu"
  | "user-typing"
  | "bot-typing"
  | "page-content";

interface ChatMessage {
  type: "bot" | "user" | "brand" | "typing";
  text: string;
  pageId?: PageId;
  done?: boolean;
}

/* ------------------------------------------------------------------ */
/*  LandingPage (main export)                                          */
/* ------------------------------------------------------------------ */
export function LandingPage({ onLogin }: LandingPageProps) {
  const [phase, setPhase] = useState<ChatPhase>("brand-typing");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState<PageId>("menu");
  const [showNav, setShowNav] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll tracking for header
  useEffect(() => {
    const handleScroll = () => {
      const container = chatRef.current?.parentElement;
      if (container) {
        setScrolled(container.scrollTop > 20);
      }
    };
    const container = chatRef.current?.parentElement;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      const container = chatRef.current.parentElement;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        });
      }
    }
  }, [messages, phase, showNav, showContent]);

  // Initial sequence: brand typing
  const brandText = "XeroCode";
  const { displayed: brandDisplayed, isDone: brandDone } = useTypewriter(brandText, 80, phase === "brand-typing");

  useEffect(() => {
    if (brandDone && phase === "brand-typing") {
      const timer = setTimeout(() => setPhase("bot-greeting"), 500);
      return () => clearTimeout(timer);
    }
  }, [brandDone, phase]);

  // Bot greeting
  const greetingText = "Привет! Я XeroCode \u2014 платформа для командной работы ИИ-агентов.\n\nКуда хотите перейти?";
  const handleGreetingDone = useCallback(() => {
    setShowNav(true);
    setPhase("menu");
  }, []);

  // When user clicks a nav button
  const handleNavSelect = useCallback((pageId: PageId, userText: string) => {
    setShowNav(false);
    setShowContent(false);
    setCurrentPage(pageId);
    setPhase("user-typing");

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: userText }]);

    // After user message "types", show bot typing
    setTimeout(() => {
      setPhase("bot-typing");
      // Add bot response after typing indicator
      setTimeout(() => {
        setPhase("page-content");
        setMessages((prev) => [...prev, { type: "bot", text: getBotResponse(pageId), pageId }]);
      }, 800);
    }, userText.length * 20 + 400);
  }, []);

  // Back to menu
  const handleBack = useCallback(() => {
    setShowNav(false);
    setShowContent(false);
    setPhase("user-typing");
    setMessages((prev) => [...prev, { type: "user", text: "Назад к меню" }]);

    setTimeout(() => {
      setPhase("bot-typing");
      setTimeout(() => {
        setPhase("menu");
        setCurrentPage("menu");
        setMessages((prev) => [...prev, { type: "bot", text: "Куда хотите перейти?" }]);
        setTimeout(() => setShowNav(true), 300);
      }, 600);
    }, 600);
  }, []);

  function getBotResponse(pageId: PageId): string {
    switch (pageId) {
      case "features":
        return "XeroCode объединяет любые ИИ-модели в одну команду. Вот что мы умеем:";
      case "pricing":
        return "Вот наши тарифы. У START, PRO и PRO PLUS есть 3 дня бесплатного триала.";
      case "faq":
        return "Отвечу на популярные вопросы:";
      case "about":
        return "Расскажу о нас:";
      default:
        return "";
    }
  }

  function renderPageContent(pageId: PageId) {
    switch (pageId) {
      case "features":
        return <FeaturesContent onLogin={onLogin} />;
      case "pricing":
        return <PricingContent />;
      case "faq":
        return <FAQContent />;
      case "about":
        return <AboutContent />;
      default:
        return null;
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ backgroundColor: "#0A0A0B" }}>
      {/* Background layer */}
      <AppMockupBackground />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.70)" }} />

      {/* Sticky header */}
      <StickyHeader onLogin={onLogin} scrolled={scrolled} />

      {/* Main scrollable area */}
      <div className="relative z-10 h-full overflow-y-auto pt-16 pb-8 px-4">
        {/* Chat container */}
        <div className="mx-auto w-full max-w-[700px]">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Chat header */}
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#5ABFAD" }}
              />
              <span className="text-[13px] font-medium" style={{ color: "#A1A1A6" }}>
                XeroCode AI
              </span>
            </div>

            {/* Messages */}
            <div className="p-5 flex flex-col gap-4 min-h-[400px]" ref={chatRef}>
              {/* Brand name typing */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div
                  className="text-[48px] sm:text-[56px] font-bold leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #D4C6F0, #9B8EC4, #6B46C1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {phase === "brand-typing" ? (
                    <>
                      {brandDisplayed}
                      <span
                        className="inline-block w-[3px] h-[48px] ml-1 animate-pulse"
                        style={{
                          backgroundColor: "#9B8EC4",
                          verticalAlign: "text-bottom",
                          WebkitBackgroundClip: "unset",
                          WebkitTextFillColor: "unset",
                        }}
                      />
                    </>
                  ) : (
                    brandText
                  )}
                </div>
                <div className="text-[13px] mt-2" style={{ color: "#6E6E73" }}>
                  AI-первая платформа для командной работы
                </div>
              </motion.div>

              {/* Bot greeting */}
              {phase !== "brand-typing" && (
                <BotMessage
                  text={greetingText}
                  speed={15}
                  onDone={handleGreetingDone}
                  skipAnimation={phase !== "bot-greeting"}
                >
                  {showNav && (
                    <NavigationButtons onSelect={handleNavSelect} onLogin={onLogin} />
                  )}
                </BotMessage>
              )}

              {/* Conversation messages */}
              {messages.map((msg, idx) => {
                if (msg.type === "user") {
                  return <UserMessage key={idx} text={msg.text} speed={20} />;
                }
                if (msg.type === "bot") {
                  const isLast = idx === messages.length - 1;
                  return (
                    <BotMessage
                      key={idx}
                      text={msg.text}
                      speed={12}
                      skipAnimation={!isLast || phase !== "page-content"}
                      onDone={isLast && msg.pageId ? () => setShowContent(true) : undefined}
                    >
                      {/* Page content appears after typing */}
                      {showContent && msg.pageId && isLast && (
                        <div className="mt-3">
                          {renderPageContent(msg.pageId)}
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={handleBack}
                            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#A1A1A6",
                            }}
                          >
                            {"\u2190"} Назад к меню
                          </motion.button>
                        </div>
                      )}
                      {/* Navigation for menu-type bot messages (after "back") */}
                      {showNav && msg.text === "Куда хотите перейти?" && isLast && (
                        <NavigationButtons onSelect={handleNavSelect} onLogin={onLogin} />
                      )}
                    </BotMessage>
                  );
                }
                return null;
              })}

              {/* Typing indicator */}
              {phase === "bot-typing" && (
                <div className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] shrink-0"
                    style={{ backgroundColor: "rgba(155,126,196,0.2)" }}
                  >
                    <span role="img" aria-label="bot">&#x1F916;</span>
                  </div>
                  <TypingIndicator />
                </div>
              )}
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
