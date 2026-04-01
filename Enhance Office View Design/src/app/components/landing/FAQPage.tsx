import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface FAQPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

const faqItems = [
  {
    q: "Что такое XeroCode?",
    a: "Инструмент, который ускоряет вашу работу с помощью AI. Вы описываете задачу — AI-команда выполняет: пишет тексты, готовит отчёты, отвечает клиентам, анализирует данные. Вместо часов — минуты.",
  },
  {
    q: "Как это ускоряет работу?",
    a: "AI берёт на себя рутину: типовые ответы, документы, анализ данных, контент. Вы фокусируетесь на стратегических задачах. Средний результат — экономия 20+ часов в неделю.",
  },
  {
    q: "Нужен ли VPN из России?",
    a: "Нет. Всё работает напрямую, без VPN и настроек. Просто открываете сайт и начинаете работать.",
  },
  {
    q: "Можно попробовать бесплатно?",
    a: "Да. Тарифы START, PRO и PRO PLUS включают 3 дня бесплатного доступа. Отмена в любой момент без обязательств.",
  },
  {
    q: "Какие задачи можно решать?",
    a: "Практически любые текстовые и аналитические: ответы клиентам, подготовка документов, создание контента, анализ данных, автоматизация процессов. AI подстраивается под вашу задачу.",
  },
  {
    q: "Безопасно ли хранить данные?",
    a: "Да. Все API-ключи шифруются AES-256 (Fernet). Авторизация через JWT + refresh tokens. Rate limiting. HTTPS. Мы не храним ваши диалоги после выполнения задачи.",
  },
  {
    q: "Что такое BYOK?",
    a: "Bring Your Own Key — вы подключаете свои API-ключи от провайдеров (OpenAI, Anthropic и др.) и платите им напрямую. Мы оркестрируем, не перепродаём. Это дешевле и прозрачнее.",
  },
  {
    q: "Есть корпоративный тариф?",
    a: "Да. Для команд от 3 до 20 человек — единый дашборд, Kanban, роли, аналитика расходов, SSO. Оплата по счёту + акт с НДС. Пишите на sales@xerocode.space.",
  },
  {
    q: "Как оплатить?",
    a: "Карта (Visa, MasterCard, МИР), СБП. Юр. лицам — оплата по счёту + закрывающие документы с НДС.",
  },
  {
    q: "Есть мобильная версия?",
    a: "Да. Веб-интерфейс адаптирован под мобильные устройства — работает в браузере телефона. Также доступен десктоп-агент для Mac, Windows и Linux.",
  },
];

export function FAQPage({ onBack, onLogin, hideHeader }: FAQPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
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

      <main className="max-w-[700px] mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Частые вопросы</h1>
          <p className="text-white/40 text-lg">Всё, что нужно знать перед стартом</p>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown size={16} className="text-white/30" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-white/50 text-sm leading-relaxed">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-white/30 text-sm mb-4">Не нашли ответ?</p>
          <a
            href="mailto:support@xerocode.space"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all"
          >
            support@xerocode.space
          </a>
        </motion.div>
      </main>
    </div>
  );
}
