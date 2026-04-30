/**
 * FAQ — все 10 вопросов из v2 в v3-дизайне.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
}

const FAQ_ITEMS = [
  {
    q: "Что такое XeroCode?",
    a: "Инструмент, который ускоряет вашу работу с помощью AI. Вы описываете задачу — AI-команда из 430+ моделей выполняет: пишет тексты, готовит отчёты, отвечает клиентам, анализирует данные, генерит изображения, видео и звук. Вместо часов — минуты.",
  },
  {
    q: "Как это ускоряет работу?",
    a: "AI берёт на себя рутину: типовые ответы, документы (PPTX/DOCX/XLSX готовые файлы), анализ данных, контент. Вы фокусируетесь на стратегических задачах. Средний результат — экономия 20+ часов в неделю.",
  },
  {
    q: "Нужен ли VPN из России?",
    a: "Нет. Всё работает напрямую через прокси (SOCKS5) — на стороне сервера. Просто открываете xerocode.ru и начинаете работать. Карты МИР / СБП поддерживаются.",
  },
  {
    q: "Можно попробовать бесплатно?",
    a: "Да. Тариф Free — навсегда бесплатный, BYOK без лимитов. Платные тарифы Go/Pro/Prime — 3 дня бесплатного доступа на старте. Отмена в любой момент без обязательств.",
  },
  {
    q: "Какие задачи можно решать?",
    a: "Практически любые: ответы клиентам, подготовка документов, создание контента (текст/картинки/видео/аудио), анализ данных, генерация кода, автоматизация процессов через DAG-оркестрацию. AI подстраивается под вашу задачу.",
  },
  {
    q: "Безопасно ли хранить данные?",
    a: "Да. Все API-ключи шифруются AES-256 (Fernet). Авторизация через JWT + refresh tokens. Rate limiting. HTTPS. Прокси-режим для всех вызовов AI-провайдеров. Мы не храним ваши диалоги после выполнения задачи (если не сохраните сами).",
  },
  {
    q: "Что такое BYOK?",
    a: "Bring Your Own Key — вы подключаете свои API-ключи от провайдеров (OpenAI, Anthropic, Google и др.) и платите им напрямую. Мы оркестрируем, не перепродаём. Это дешевле и прозрачнее. На любом тарифе BYOK = ∞ запросов.",
  },
  {
    q: "Как работает Cost-Tier система?",
    a: "Платные модели разделены на тиры: T0 Free (Llama, Pollinations), T1 Cheap (Haiku, mini), T2 Standard (Sonnet, GPT-4.1), T3 Premium (Opus, GPT-5.4), T4 Media (gpt-image-2, Veo, Suno). На каждом тарифе свои квоты по тирам. Free + BYOK всегда без ограничений.",
  },
  {
    q: "Есть корпоративный тариф?",
    a: "Да. Enterprise (24 990 ₽/мес) для команд до 10 человек — бесплатные AI + корп-модули (CRM, Kanban, документооборот, HR). Enterprise+ (от 79 990 ₽) — все 430+ моделей без ограничений + 1С, Битрикс24, ЭДО (Диадок/СБИС/КЭП), SSO, on-premise. Оплата по счёту + акт с НДС.",
  },
  {
    q: "Как оплатить?",
    a: "Карта (Visa, MasterCard, МИР), СБП. Юр. лицам — оплата по счёту + закрывающие документы с НДС. Подключение через ЮKassa / Tinkoff Acquiring.",
  },
];

export function FAQSubPage({ onBack, onCTA }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <SubPageHero
        num="07"
        title={<>Вопросы. <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>И ответы.</em></>}
        subtitle="Если не нашли свой — пишите в поддержку. Отвечаем в течение 24 часов на тарифах Pro+ и сразу для Enterprise."
        tag={{ icon: <MessageCircleQuestion size={12} />, label: "FAQ · 10 вопросов", accent: "var(--violet-500)" }}
        onBack={onBack}
      />

      <section style={{ padding: "80px 32px", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                style={{
                  background: isOpen ? "var(--void-800)" : "var(--void-800)",
                  border: `1px solid ${isOpen ? "var(--violet-500)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  transition: "border-color 250ms",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    padding: "20px 28px",
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      color: "var(--violet-500)",
                      flexShrink: 0,
                      width: 32,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-serif)",
                      fontSize: 19,
                      fontWeight: 700,
                      color: "var(--ink-50)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 28,
                      color: isOpen ? "var(--violet-500)" : "var(--text-muted)",
                      flexShrink: 0,
                      lineHeight: 1,
                      width: 24,
                      textAlign: "center",
                    }}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        style={{
                          padding: "0 28px 24px 76px",
                          color: "var(--ink-200)",
                          fontSize: 15,
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Не нашли ответ? */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginTop: 56 }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            ▸ Не нашли ответ?
          </p>
          <a
            href="mailto:support@xerocode.space"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: "var(--radius-sm)",
              background: "var(--void-800)",
              border: "1px solid var(--border)",
              color: "var(--ink-100)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              letterSpacing: "0.05em",
              textDecoration: "none",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--violet-500)";
              e.currentTarget.style.background = "rgba(124,92,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--void-800)";
            }}
          >
            <MessageCircleQuestion size={16} />
            support@xerocode.space
          </a>
        </motion.div>
      </section>

      <FinalCTA onCTA={onCTA} />
    </>
  );
}
