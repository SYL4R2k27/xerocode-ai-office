/**
 * Business — корпоративный режим. Полная v2-структура в дизайне v3.
 * 3 уровня доступа · 10 проф-ролей · 12 модулей · Битрикс/1С · security · 4 corp tiers · CTA
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Crown, ClipboardList, Bot, Check, ChevronDown,
  TrendingUp, KanbanSquare, FileText, Calendar, MessageSquare,
  UserCheck, GitBranch, BookOpen, Search, PieChart, Plug, Zap,
  Lock, FileCheck, Shield, Globe, Bell, Palette,
} from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { SectionHeader } from "../shared/SectionHeader";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
}

const ROLES = [
  { role: "Руководитель", desc: "Дашборд, аналитика, бюджеты, CRM, отчёты, управление ролями и правами", icon: Crown,           accent: "#FFB547", perms: "Полный доступ ко всем модулям" },
  { role: "Менеджер",     desc: "Kanban, распределение задач, ревью, CRM сделки, документы, HR",          icon: ClipboardList,  accent: "#7C5CFF", perms: "Управление командой + AI" },
  { role: "Сотрудник",    desc: "Чат с AI, задачи, документы, календарь. 10 проф. ролей",                 icon: Bot,            accent: "#00D4FF", perms: "Работа в рамках роли" },
];

const PROF_ROLES = [
  "Директор", "Главный бухгалтер", "Бухгалтер", "Менеджер продаж",
  "Менеджер проектов", "Логист", "HR-менеджер", "Юрист", "Маркетолог", "Оператор",
];

const MODULES = [
  { icon: TrendingUp,    title: "CRM",            desc: "Воронка продаж, сделки с timeline, контакты, аналитика конверсий",         accent: "#22C55E" },
  { icon: KanbanSquare,  title: "Задачи",         desc: "Kanban + Список + Сроки. Чек-листы, подзадачи, соисполнители",              accent: "#7C5CFF" },
  { icon: FileText,      title: "Документооборот",desc: "Реестр, auto-numbering, маршруты согласования, шаблоны",                    accent: "#FF6BFF" },
  { icon: Calendar,      title: "Календарь",      desc: "Встречи, дедлайны, события. Привязка к задачам и сделкам",                  accent: "#FFB547" },
  { icon: MessageSquare, title: "Каналы",         desc: "Корпоративный мессенджер — каналы по отделам и проектам",                   accent: "#00D4FF" },
  { icon: UserCheck,     title: "HR",             desc: "Сотрудники, отпуска, больничные, onboarding-чеклисты",                      accent: "#FF3B5C" },
  { icon: GitBranch,     title: "Workflows",      desc: "Визуальный конструктор автоматизаций (DAG), шаблоны, webhook",              accent: "#22C55E" },
  { icon: BookOpen,      title: "База знаний",    desc: "PDF/DOCX/TXT загрузка, векторный поиск, RAG-инъекция в AI",                 accent: "#7C5CFF" },
  { icon: Search,        title: "Deep Research",  desc: "Итеративный AI-поиск (2-4 мин), Model Council, Sparkpage HTML",             accent: "#00D4FF" },
  { icon: PieChart,      title: "AI Аналитика",   desc: "Автоотчёты из CRM/задач. Запрос на естественном языке",                     accent: "#FF3B5C" },
  { icon: Plug,          title: "Интеграции",     desc: "1С (OData REST) + Битрикс24 (webhook/OAuth). Импорт сделок и контактов",     accent: "#FFB547" },
  { icon: Zap,           title: "Skills",         desc: "Встроенные и кастомные AI-навыки. Запуск одной кнопкой",                    accent: "#FF6BFF" },
];

const SECURITY = [
  { icon: Lock,      title: "Шифрование ключей", desc: "API-ключи — Fernet AES-256" },
  { icon: FileCheck, title: "Аудит-лог",         desc: "Полная история действий" },
  { icon: Shield,    title: "Матрица прав",      desc: "30+ permissions, модуль+действие" },
  { icon: Globe,     title: "Без VPN из РФ",     desc: "EU-прокси к OpenAI, Anthropic" },
  { icon: Bell,      title: "Webhook + API",     desc: "Интеграция с любой системой" },
  { icon: Palette,   title: "Брендинг",          desc: "Фон workspace, тема оформления" },
];

const CORP_TIERS = [
  { team: "Enterprise (до 10 чел.)",       price: "24 990 ₽/мес", desc: "Базовый — Free + T1 + T2/T3 пул",   accent: "#22C55E" },
  { team: "Enterprise+ (до 20 чел.)",      price: "79 990 ₽/мес", desc: "Все 430+ моделей, без лимитов",     accent: "#FF3B5C" },
  { team: "Enterprise+ (до 50 чел.)",      price: "от 149 990 ₽", desc: "Custom AI · Dedicated manager",     accent: "#FF3B5C" },
  { team: "Enterprise+ (50+ чел.)",        price: "договорная",   desc: "On-premise · SSO · LDAP · custom",  accent: "#FF3B5C" },
];

export function BusinessSubPage({ onBack, onCTA }: Props) {
  const [showAllModules, setShowAllModules] = useState(false);
  const visibleModules = showAllModules ? MODULES : MODULES.slice(0, 6);

  return (
    <>
      <SubPageHero
        num="03"
        title={<>Биз<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>несу.</em></>}
        subtitle="Битрикс24 + 1С + 430 AI-моделей. CRM, задачи, документооборот, HR, календарь — всё в одном. Plus AI-команда для автоматизации рутины."
        tag={{ icon: <Building2 size={12} />, label: "Корпоративная платформа", accent: "#00D4FF" }}
        onBack={onBack}
      />

      {/* Stats banner */}
      <section style={{ padding: "48px 32px 0", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginBottom: 64,
          }}
        >
          {[
            { label: "от 24 990 ₽/мес",  accent: "var(--aurora)" },
            { label: "до 50 сотрудников", accent: "var(--ink-300)" },
            { label: "Счёт + НДС",         accent: "var(--ink-300)" },
            { label: "Настройка за 1 день",accent: "var(--ink-300)" },
          ].map((t, i) => (
            <span
              key={i}
              style={{
                padding: "8px 16px",
                borderRadius: 9999,
                background: i === 0 ? "rgba(34,197,94,0.10)" : "var(--void-800)",
                border: `1px solid ${i === 0 ? "rgba(34,197,94,0.30)" : "var(--border-subtle)"}`,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: t.accent,
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* 3 уровня доступа */}
      <section style={{ padding: "0 32px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="03.A"
          title={<>3 уровня <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>доступа.</em></>}
          align="center"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="xc-roles-grid"
        >
          {ROLES.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, borderColor: r.accent }}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 28,
                position: "relative",
                overflow: "hidden",
                transition: "border-color 250ms",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: r.accent }} />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: `${r.accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <r.icon size={22} color={r.accent} strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--ink-50)",
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                {r.role}
              </h3>
              <p style={{ color: "var(--ink-300)", fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
                {r.desc}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  background: `${r.accent}15`,
                  color: r.accent,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {r.perms}
              </span>
            </motion.div>
          ))}
        </div>

        {/* 10 prof roles */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            ▸ 10 профессиональных ролей
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PROF_ROLES.map((r) => (
              <span
                key={r}
                style={{
                  padding: "6px 14px",
                  borderRadius: 9999,
                  background: "var(--void-700)",
                  color: "var(--ink-200)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 12 модулей */}
      <section
        style={{
          padding: "80px 32px",
          background: "var(--void-950)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionHeader
            num="03.B"
            title={<>12 <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>модулей.</em></>}
            subtitle="Всё что есть в Битрикс24, плюс AI-суперсилы. Подключаются по тарифу Enterprise / Enterprise+."
            align="center"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
            className="xc-modules-grid"
          >
            <AnimatePresence>
              {visibleModules.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  whileHover={{ y: -3, borderColor: m.accent }}
                  style={{
                    background: "var(--void-800)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: 20,
                    transition: "border-color 200ms",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-sm)",
                      background: `${m.accent}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <m.icon size={18} color={m.accent} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink-50)",
                        marginBottom: 4,
                      }}
                    >
                      {m.title}
                    </h4>
                    <p style={{ color: "var(--ink-300)", fontSize: 12, lineHeight: 1.5 }}>
                      {m.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {!showAllModules && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={() => setShowAllModules(true)}
                data-mascot-trigger
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--ink-200)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--violet-500)"; e.currentTarget.style.color = "var(--ink-50)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--ink-200)"; }}
              >
                Показать все 12 модулей
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Импорт Битрикс24 + 1С */}
      <section style={{ padding: "80px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="03.C"
          title={<>Импорт из <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>Битрикс24 и 1С.</em></>}
          subtitle="Подключите за 5 минут — данные перенесутся автоматически."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
          className="xc-import-grid"
        >
          {[
            {
              brand: "Б24",
              title: "Битрикс24",
              brandColor: "#00D4FF",
              items: [
                "Сделки и воронки продаж",
                "Контакты и компании",
                "Задачи с чек-листами",
                "Проекты и пользователи",
                "Webhook + OAuth 2.0",
              ],
            },
            {
              brand: "1С",
              title: "1С:Предприятие",
              brandColor: "#FFB547",
              items: [
                "Контрагенты (ИНН, КПП)",
                "Номенклатура товаров и услуг",
                "Документы (счета, акты)",
                "Договоры",
                "OData REST · двусторонний sync",
              ],
            },
          ].map((b) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: `${b.brandColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: b.brandColor,
                    }}
                  >
                    {b.brand}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "var(--ink-50)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {b.title}
                </h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {b.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "var(--ink-200)",
                      fontSize: 14,
                    }}
                  >
                    <Check size={14} color="var(--aurora)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section
        style={{
          padding: "80px 32px",
          background: "var(--void-950)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionHeader
            num="03.D"
            title={<>Безопасность и <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>контроль.</em></>}
            align="center"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
            className="xc-sec-grid"
          >
            {SECURITY.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                style={{
                  background: "var(--void-800)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: 20,
                }}
              >
                <s.icon size={18} color="var(--ink-300)" strokeWidth={1.75} style={{ marginBottom: 10 }} />
                <h4
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    color: "var(--ink-50)",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {s.title}
                </h4>
                <p style={{ color: "var(--ink-300)", fontSize: 11, lineHeight: 1.5 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tariffs */}
      <section style={{ padding: "80px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="03.E"
          title={<>Тарифы для <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>команд.</em></>}
          subtitle="Enterprise — базовый AI-набор + корп-модули. Enterprise+ — все 430+ моделей без лимитов."
          align="center"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            maxWidth: 720,
            margin: "0 auto",
          }}
          className="xc-tiers-grid"
        >
          {CORP_TIERS.map((t, i) => (
            <motion.div
              key={t.team}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${t.accent}`,
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <div style={{ color: "var(--ink-50)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                  {t.team}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                    marginTop: 4,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t.desc}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  fontSize: 16,
                  color: t.accent,
                  letterSpacing: "-0.01em",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {t.price}
              </span>
            </motion.div>
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 24,
          }}
        >
          Юр.лица · Оплата по счёту + акт с НДС · Настройка за 1 день
        </p>
      </section>

      <style>{`
        @media (max-width: 920px) {
          .xc-roles-grid, .xc-modules-grid, .xc-import-grid, .xc-tiers-grid { grid-template-columns: 1fr !important; }
          .xc-sec-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .xc-sec-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <FinalCTA
        onCTA={onCTA}
        title="Готовы подключить команду?"
        subtitle="Настроим workspace · импортируем Б24 / 1С · настройка за 1 день"
        buttonText="sales@xerocode.space →"
      />
    </>
  );
}
