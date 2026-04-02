import { useState } from "react";
import {
  X,
  Zap,
  Sparkles,
  Rocket,
  Crown,
  Building2,
  Check,
  X as XIcon,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface PricingPageProps {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
}

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */
const plans = [
  {
    id: "free",
    name: "FREE",
    price: "500 ₽",
    priceNote: "единоразово",
    icon: Zap,
    features: [
      "50 задач в месяц",
      "3 агента",
      "Свои модели (BYOK)",
      "Конструктор пулов",
      "Tool-calling",
      "Локальный агент",
      "Fallback OpenRouter",
    ],
    color: "#6E6E73",
    gradient: "linear-gradient(135deg, #48484A, #6E6E73)",
    glowColor: "rgba(110,110,115,0.15)",
    cta: "Активировать",
  },
  {
    id: "pro",
    name: "PRO",
    price: "1 990 ₽",
    priceNote: "/ месяц",
    icon: Sparkles,
    features: [
      "500 задач в месяц",
      "10 агентов",
      "Бесплатный пул моделей",
      "100 изображений / месяц",
      "Готовые пулы под задачи",
      "Всё из FREE",
    ],
    color: "#5ABFAD",
    gradient: "linear-gradient(135deg, #5ABFAD, #3EA88F)",
    glowColor: "rgba(90,191,173,0.15)",
    cta: "Выбрать",
  },
  {
    id: "pro_plus",
    name: "PRO PLUS",
    price: "5 490 ₽",
    priceNote: "/ месяц",
    badge: "Популярный",
    icon: Rocket,
    features: [
      "2 000 задач в месяц",
      "15 агентов",
      "Средние модели (Haiku, GPT-4.1 mini, Grok Fast)",
      "100K премиум токенов / день",
      "500 изображений + Nano Banana 2",
      "Кастомные пулы",
      "Всё из PRO",
    ],
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    glowColor: "rgba(59,130,246,0.2)",
    cta: "Выбрать",
  },
  {
    id: "ultima",
    name: "ULTIMA",
    price: "34 990 ₽",
    priceNote: "/ месяц",
    badge: "Безлимит",
    icon: Crown,
    features: [
      "Безлимитные задачи",
      "Безлимитные агенты",
      "ВСЕ премиум модели без ограничений",
      "GPT-5.4 Pro, Claude Opus 4.6, o3-pro",
      "Безлимитные изображения + Nano Banana Pro",
      "Docker Sandbox",
      "Всё из PRO PLUS",
    ],
    color: "#D4A054",
    gradient: "linear-gradient(135deg, #D4A054, #9333ea)",
    glowColor: "rgba(147,51,234,0.2)",
    cta: "Выбрать",
  },
  {
    id: "corporate",
    name: "CORPORATE",
    price: "от 89 990 ₽",
    priceNote: "/ месяц, счёт + НДС",
    icon: Building2,
    features: [
      "3-20 профилей",
      "Командный дашборд",
      "Роли: руководитель / менеджер / сотрудник",
      "Общие пулы на команду",
      "Ревью workflow (approve/reject)",
      "SSO, Audit log, Webhook",
      "Всё из ULTIMA",
    ],
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    glowColor: "rgba(245,158,11,0.15)",
    cta: "Связаться с нами",
  },
];

/* ------------------------------------------------------------------ */
/*  Comparison table data                                              */
/* ------------------------------------------------------------------ */
type CellValue = boolean | string;

interface ComparisonRow {
  label: string;
  values: [CellValue, CellValue, CellValue, CellValue, CellValue];
}

interface ComparisonSection {
  title: string;
  rows: ComparisonRow[];
}

const comparisonSections: ComparisonSection[] = [
  {
    title: "Модели и пулы",
    rows: [
      { label: "Свои модели (BYOK)", values: [true, true, true, true, true] },
      { label: "Бесплатный пул моделей", values: [false, true, true, true, true] },
      { label: "Готовые пулы под задачи", values: [false, true, true, true, true] },
      { label: "Кастомные пулы", values: [false, false, true, true, true] },
      { label: "Средние модели (Haiku, GPT-4.1 mini)", values: [false, false, true, true, true] },
      { label: "Премиум модели (GPT-5.4 Pro, Opus 4.6, o3-pro)", values: [false, false, false, true, true] },
      { label: "Fallback OpenRouter", values: [true, true, true, true, true] },
    ],
  },
  {
    title: "Лимиты",
    rows: [
      { label: "Задачи в месяц", values: ["50", "500", "2 000", "∞", "∞"] },
      { label: "Агенты", values: ["3", "10", "15", "∞", "∞"] },
      { label: "Изображения в месяц", values: [false, "100", "500", "∞", "∞"] },
      { label: "Премиум токены / день", values: [false, false, "100K", "∞", "∞"] },
    ],
  },
  {
    title: "Инструменты",
    rows: [
      { label: "Tool-calling", values: [true, true, true, true, true] },
      { label: "Конструктор пулов", values: [true, true, true, true, true] },
      { label: "Локальный агент", values: [true, true, true, true, true] },
      { label: "Генерация изображений", values: [false, true, true, true, true] },
      { label: "Nano Banana 2", values: [false, false, true, true, true] },
      { label: "Nano Banana Pro", values: [false, false, false, true, true] },
      { label: "Docker Sandbox", values: [false, false, false, true, true] },
    ],
  },
  {
    title: "Команда",
    rows: [
      { label: "Профили", values: ["1", "1", "1", "1", "3-20"] },
      { label: "Командный дашборд", values: [false, false, false, false, true] },
      { label: "Роли (руководитель / менеджер / сотрудник)", values: [false, false, false, false, true] },
      { label: "Общие пулы на команду", values: [false, false, false, false, true] },
      { label: "Ревью workflow (approve/reject)", values: [false, false, false, false, true] },
    ],
  },
  {
    title: "Безопасность",
    rows: [
      { label: "SSO", values: [false, false, false, false, true] },
      { label: "Audit log", values: [false, false, false, false, true] },
      { label: "Webhook", values: [false, false, false, false, true] },
    ],
  },
];

const planHeaders = ["FREE", "PRO", "PRO+", "ULTIMA", "CORP"];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CellDisplay({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(90,191,173,0.15)" }}>
        <Check size={12} style={{ color: "#5ABFAD" }} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(110,110,115,0.08)" }}>
        <XIcon size={10} style={{ color: "#48484A" }} />
      </div>
    );
  }
  return (
    <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
      {value}
    </span>
  );
}

function ComparisonSectionBlock({ section }: { section: ComparisonSection }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
      >
        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {section.title}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} style={{ color: "var(--text-tertiary)" }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Table header - plan names */}
            <div className="grid items-center px-4 py-2" style={{ gridTemplateColumns: "1fr repeat(5, 64px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div />
              {planHeaders.map((h) => (
                <div key={h} className="text-center text-[10px] font-bold tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  {h}
                </div>
              ))}
            </div>

            {section.rows.map((row, i) => (
              <div
                key={i}
                className="grid items-center px-4 py-2.5"
                style={{
                  gridTemplateColumns: "1fr repeat(5, 64px)",
                  backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}
              >
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {row.label}
                </span>
                {row.values.map((v, j) => (
                  <div key={j} className="flex items-center justify-center">
                    <CellDisplay value={v} />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PricingPage Component                                              */
/* ------------------------------------------------------------------ */
export function PricingPage({ open, onClose, currentPlan }: PricingPageProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col"
          style={{
            background: "linear-gradient(180deg, #0F0F12 0%, #131318 50%, #0F0F12 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <motion.div
            className="flex items-center justify-between px-6 md:px-10 py-5 flex-shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={16} />
              Назад
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:bg-white/5"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={20} />
            </button>
          </motion.div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Title */}
            <motion.div
              className="text-center px-6 pt-2 pb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h1
                className="text-[28px] md:text-[36px] font-bold mb-3"
                style={{
                  background: "linear-gradient(135deg, #fff 30%, #9333ea 70%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Выберите ваш тариф
              </h1>
              <p className="text-[14px] md:text-[16px] max-w-lg mx-auto" style={{ color: "var(--text-tertiary)" }}>
                От личного использования до корпоративных решений. Масштабируйте ИИ под свои задачи.
              </p>
            </motion.div>

            {/* Plan cards */}
            <div className="px-4 md:px-10 pb-12">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none md:grid md:grid-cols-5 md:overflow-visible max-w-[1400px] mx-auto">
                {plans.map((plan, index) => {
                  const Icon = plan.icon;
                  const isCurrent = currentPlan === plan.id;
                  const isUltima = plan.id === "ultima";
                  const isProPlus = plan.id === "pro_plus";

                  return (
                    <motion.div
                      key={plan.id}
                      className="relative flex-shrink-0 w-[280px] md:w-auto snap-center rounded-2xl p-[1px] group"
                      style={{
                        background: isUltima
                          ? "linear-gradient(135deg, rgba(147,51,234,0.4), rgba(212,160,84,0.4))"
                          : isProPlus
                          ? "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))"
                          : "rgba(255,255,255,0.06)",
                      }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      {/* Glow effect on hover */}
                      <div
                        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                        style={{
                          background: isUltima
                            ? "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(212,160,84,0.3))"
                            : isProPlus
                            ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.25))"
                            : plan.glowColor,
                        }}
                      />

                      <div
                        className="relative rounded-2xl p-5 h-full flex flex-col"
                        style={{ backgroundColor: "#18181D" }}
                      >
                        {/* Badge */}
                        {plan.badge && (
                          <div
                            className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: plan.gradient,
                              color: "#fff",
                              boxShadow: `0 2px 8px ${plan.glowColor}`,
                            }}
                          >
                            {plan.badge}
                          </div>
                        )}

                        {/* Current badge */}
                        {isCurrent && (
                          <div
                            className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: "rgba(147,51,234,0.15)",
                              color: "#9333ea",
                              border: "1px solid rgba(147,51,234,0.3)",
                            }}
                          >
                            <Check size={10} />
                            Текущий
                          </div>
                        )}

                        {/* Icon + name */}
                        <div className="flex items-center gap-3 mb-5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: plan.gradient }}
                          >
                            <Icon size={20} color="#fff" />
                          </div>
                          <span className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                            {plan.name}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className="text-[26px] font-extrabold"
                              style={{
                                color: "var(--text-primary)",
                              }}
                            >
                              {plan.price}
                            </span>
                          </div>
                          <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                            {plan.priceNote}
                          </span>
                        </div>

                        {/* Features */}
                        <div className="space-y-2.5 flex-1 mb-6">
                          {plan.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: `${plan.color}20` }}
                              >
                                <Check size={9} style={{ color: plan.color }} />
                              </div>
                              <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                {f}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        {isCurrent ? (
                          <div
                            className="w-full py-2.5 rounded-xl text-center text-[13px] font-semibold"
                            style={{
                              backgroundColor: "rgba(147,51,234,0.08)",
                              color: "#9333ea",
                              border: "1px solid rgba(147,51,234,0.2)",
                            }}
                          >
                            Текущий план
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => {
                              if (plan.id === "corporate") {
                                window.open("mailto:sales@xerocode.space?subject=Corporate%20план", "_blank");
                              } else {
                                alert(`Оплата тарифа "${plan.name}" будет доступна в ближайшем обновлении.\n\nПо вопросам: sales@xerocode.space`);
                              }
                            }}
                            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                            style={{
                              background: isUltima || isProPlus ? plan.gradient : "rgba(255,255,255,0.08)",
                              color: isUltima || isProPlus ? "#fff" : "var(--text-primary)",
                              border: isUltima || isProPlus ? "none" : "1px solid rgba(255,255,255,0.1)",
                            }}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: `0 4px 20px ${plan.glowColor}`,
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {plan.cta}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Comparison table */}
            <motion.div
              className="max-w-[900px] mx-auto px-4 md:px-10 pb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2
                className="text-[20px] font-bold mb-6 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                Сравнение тарифов
              </h2>

              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {comparisonSections.map((section, i) => (
                  <ComparisonSectionBlock key={i} section={section} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
