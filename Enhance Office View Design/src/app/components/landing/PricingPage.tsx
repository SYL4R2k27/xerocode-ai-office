import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, X, Zap, Crown, Star, Rocket, Building2, ChevronDown, ArrowLeft,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface PricingPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

const plans = [
  {
    id: "start",
    name: "START",
    price: "290₽",
    period: "единоразово",
    desc: "Для знакомства с платформой",
    icon: Rocket,
    color: "#6B7280",
    popular: false,
    features: [
      "50 задач в месяц",
      "3 AI-агента одновременно",
      "Свои модели (BYOK)",
      "Tool-calling",
      "Локальный агент",
    ],
    excluded: [
      "Бесплатный пул моделей",
      "Генерация изображений",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: "1 990₽",
    period: "/ месяц",
    desc: "Для ежедневной работы с AI",
    icon: Star,
    color: "#10B981",
    popular: false,
    features: [
      "500 задач в месяц",
      "10 AI-агентов",
      "Бесплатный пул моделей",
      "100 изображений / мес",
      "Готовые пулы моделей",
      "Deep Research + Sparkpage",
    ],
    excluded: [
      "Премиум модели (GPT-5, Claude Opus)",
    ],
  },
  {
    id: "proplus",
    name: "PRO PLUS",
    price: "5 490₽",
    period: "/ месяц",
    desc: "Максимум возможностей",
    icon: Zap,
    color: "#818CF8",
    popular: true,
    features: [
      "2 000 задач в месяц",
      "15 AI-агентов",
      "Средние модели (Haiku, GPT-4.1 mini)",
      "100K премиум токенов / день",
      "500 изображений / мес",
      "Кастомные пулы",
      "Всё из PRO",
    ],
    excluded: [
      "Безлимитные задачи",
    ],
  },
  {
    id: "ultima",
    name: "ULTIMA",
    price: "19 990₽",
    period: "/ месяц",
    desc: "Без ограничений",
    icon: Crown,
    color: "#A855F7",
    popular: false,
    features: [
      "Безлимитные задачи и агенты",
      "ВСЕ премиум модели",
      "GPT-5.4, Claude Opus 4.6, o3-pro",
      "Безлимитные изображения",
      "Model Council + AI Analytics",
      "Docker Sandbox",
      "Всё из PRO PLUS",
    ],
    excluded: [],
  },
  {
    id: "corp",
    name: "CORPORATE",
    price: "от 14 990₽",
    period: "/ месяц",
    desc: "Корпоративная платформа для команд",
    icon: Building2,
    color: "#F59E0B",
    popular: false,
    hasSubmenu: true,
    features: [
      "3-20 профилей сотрудников",
      "CRM, Kanban, Документы, HR, Календарь",
      "Роли и права + Ревью workflow",
      "Интеграции: 1С, Битрикс24",
      "Deep Research + AI Analytics",
      "Оплата по счёту + акт с НДС",
    ],
    excluded: [],
  },
];

const corpSubPlans = [
  {
    id: "corp",
    name: "CORPORATE",
    price: "от 14 990₽",
    period: "/ месяц",
    desc: "Бесплатные AI модели",
    color: "#F59E0B",
    features: [
      "Бесплатные AI модели (Llama, DeepSeek, Qwen)",
      "CRM, Kanban, Документы, HR, Календарь",
      "Роли и права (10+ ролей)",
      "Интеграции: 1С, Битрикс24",
      "Ревью workflow (approve/reject)",
      "Всё из PRO PLUS (кроме премиум AI)",
    ],
    excluded: ["Премиум модели (GPT-5, Claude, o3)"],
  },
  {
    id: "corp_plus",
    name: "CORPORATE PLUS",
    price: "от 49 990₽",
    period: "/ месяц",
    desc: "Максимум для бизнеса",
    color: "#9333EA",
    badge: "Максимум",
    features: [
      "Всё из CORPORATE",
      "ВСЕ премиум модели без ограничений",
      "GPT-5.4, Claude Opus 4.6, o3-pro, Grok 4",
      "Deep Research + Model Council",
      "Приоритетная поддержка 24/7",
      "SSO, Webhook, Audit log",
    ],
    excluded: [],
  },
];

export function PricingPage({ onBack, onLogin, hideHeader }: PricingPageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [corpExpanded, setCorpExpanded] = useState(false);

  return (
    <div className="min-h-screen text-white">
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

      <main className="max-w-[1440px] mx-auto px-6 md:px-16 py-16 md:py-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Выбери свой{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">темп</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[500px] mx-auto">
            3 дня бесплатно для START, PRO и PRO PLUS. Отмена в любой момент.
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                plan.popular
                  ? "border-[#818CF8]/40 bg-[#818CF8]/[0.04] shadow-lg shadow-[#818CF8]/10"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#818CF8] text-white text-[11px] font-semibold">
                  Популярный
                </div>
              )}

              <div className="mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${plan.color}15` }}
                >
                  <plan.icon size={20} style={{ color: plan.color }} />
                </div>
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <p className="text-white/30 text-xs mt-1">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span className="text-2xl font-bold" style={{ color: plan.color }}>{plan.price}</span>
                <span className="text-white/30 text-sm ml-1">{plan.period}</span>
              </div>

              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/60">{f}</span>
                  </div>
                ))}
                {plan.excluded.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <X size={14} className="text-white/15 flex-shrink-0 mt-0.5" />
                    <span className="text-white/20">{f}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => (plan as any).hasSubmenu ? setCorpExpanded(!corpExpanded) : onLogin()}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                    : (plan as any).hasSubmenu
                    ? "bg-gradient-to-r from-amber-500 to-purple-600 text-white"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                {(plan as any).hasSubmenu ? (corpExpanded ? "Скрыть" : "Подробнее") : "Начать"}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Corporate submenu */}
        <AnimatePresence>
          {corpExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Корпоративные тарифы</h2>
                <p className="text-white/30 text-sm mt-1">Полный набор корп.функций — выбери уровень AI</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[700px] mx-auto">
                {corpSubPlans.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border p-6"
                    style={{ borderColor: `${sub.color}33`, background: `${sub.color}08` }}
                  >
                    {sub.badge && (
                      <div className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-3" style={{ background: sub.color, color: "#fff" }}>
                        {sub.badge}
                      </div>
                    )}
                    <h3 className="text-white font-bold text-lg">{sub.name}</h3>
                    <p className="text-white/30 text-xs mt-0.5 mb-3">{sub.desc}</p>
                    <div className="mb-5">
                      <span className="text-2xl font-bold" style={{ color: sub.color }}>{sub.price}</span>
                      <span className="text-white/30 text-sm ml-1">{sub.period}</span>
                    </div>
                    <div className="space-y-2 mb-5">
                      {sub.features.map(f => (
                        <div key={f} className="flex items-start gap-2 text-sm">
                          <Check size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/60">{f}</span>
                        </div>
                      ))}
                      {sub.excluded.map(f => (
                        <div key={f} className="flex items-start gap-2 text-sm">
                          <X size={14} className="text-white/15 flex-shrink-0 mt-0.5" />
                          <span className="text-white/20 line-through">{f}</span>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(`mailto:sales@xerocode.space?subject=${encodeURIComponent(sub.name)}`, "_blank")}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                      style={{ background: sub.color }}
                    >
                      Связаться с нами
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <button
            onClick={() => setExpanded(expanded ? null : "compare")}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            Подробное сравнение
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={16} />
            </motion.div>
          </button>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-8"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/40 pb-4 pr-4 font-medium">Функция</th>
                        {plans.map(p => (
                          <th key={p.id} className="text-center pb-4 px-2 font-semibold" style={{ color: p.color }}>{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-white/50">
                      {[
                        { label: "Задачи / мес", vals: ["50", "500", "2 000", "Безлимит", "Безлимит"] },
                        { label: "AI-агенты", vals: ["3", "10", "15", "Безлимит", "Безлимит"] },
                        { label: "Свои модели (BYOK)", vals: ["yes", "yes", "yes", "yes", "yes"] },
                        { label: "Бесплатный пул", vals: ["no", "yes", "yes", "yes", "yes"] },
                        { label: "Премиум модели", vals: ["no", "no", "Средние", "Все", "Все"] },
                        { label: "Изображения", vals: ["no", "100", "500", "Безлимит", "Безлимит"] },
                        { label: "Корпоративный дашборд", vals: ["no", "no", "no", "no", "yes"] },
                        { label: "SSO / Audit log", vals: ["no", "no", "no", "no", "yes"] },
                      ].map(row => (
                        <tr key={row.label} className="border-b border-white/[0.04]">
                          <td className="py-3 pr-4 text-white/60">{row.label}</td>
                          {row.vals.map((v, i) => (
                            <td key={i} className="text-center py-3 px-2">
                              {v === "yes" ? <Check size={14} className="text-green-400 mx-auto" /> :
                               v === "no" ? <X size={14} className="text-white/15 mx-auto" /> :
                               <span>{v}</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-white/20 text-sm space-y-1"
        >
          <p>Оплата: карта, СБП, МИР. Юр. лицам — счёт + акт с НДС.</p>
          <p>Отмена подписки в любой момент из личного кабинета.</p>
        </motion.div>
      </main>
    </div>
  );
}
