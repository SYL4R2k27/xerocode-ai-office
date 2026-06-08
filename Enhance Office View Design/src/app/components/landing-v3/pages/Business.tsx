/* XeroCode Landing v3 — Бизнесу (sub-page).
   Re-skinned to v3 from V2 BusinessPage, enriched with the real CORP package
   (design-deepspec/CORP_functionality.md) + canonical pricing (backend/app/core/plans.py).
   16 модулей, 10 проф-ролей, RBAC, 1С/Битрикс24, Enterprise / Enterprise+. */
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";
import type { Toast } from "../Header";

const STATS = [
  { num: "27", lab: "модулей" },
  { num: "10", lab: "проф. ролей" },
  { num: "∞", lab: "seats (Ent+)" },
  { num: "152-ФЗ", lab: "данные в РФ" },
];

const ORG_ROLES = [
  { icon: "crown", h: "Руководитель", d: "Дашборд, аналитика, бюджеты, CRM, отчёты, управление ролями и правами.", perm: "ВСЁ · 17 модулей" },
  { icon: "briefcase", h: "Менеджер", d: "Kanban-менеджмент, распределение и ревью задач, CRM-сделки, документы, HR.", perm: "Команда + AI" },
  { icon: "user-check", h: "Сотрудник", d: "Чат с AI, задачи, документы, календарь — строго в рамках профессиональной роли.", perm: "По роли" },
];

const PROF_ROLES = [
  "Руководитель", "Главный бухгалтер", "Бухгалтер", "Менеджер по продажам",
  "Менеджер проектов", "Логист", "HR-менеджер", "Юрист", "Маркетолог", "Оператор",
];

const MODULES = [
  { icon: "trending-up", h: "CRM", d: "Воронка из 8 стадий (lead → won), карточки сделок, лента активностей, AI-квалификация лида." },
  { icon: "square-kanban", h: "Задачи · Kanban", d: "5 стадий с двойным ревью (оператор → менеджер), Gantt, дедлайны, чек-листы, соисполнители." },
  { icon: "scroll-text", h: "Документооборот", d: "Реестр (OUT-2026-0001), маршруты согласования юрист → бухгалтер → директор, версии, мультиподпись." },
  { icon: "file-stack", h: "ЭДО", d: "Диадок / СБИС: СФ · УПД · акты, подпись КЭП, архив. (Enterprise+)" },
  { icon: "calendar", h: "Календарь", d: "События, встречи, дедлайны задач и сделок, напоминания. Связь с CRM." },
  { icon: "message-square", h: "Каналы", d: "Корпоративный мессенджер: каналы по отделам, упоминания, AI прямо в обсуждении." },
  { icon: "user-check", h: "HR", d: "Оргструктура, карточки сотрудников, онбординг из базы знаний, отпуска и заявки." },
  { icon: "git-branch", h: "Workflows · DAG", d: "No-code конструктор сценариев: branching, autosave, webhook-триггеры, 5 шаблонов." },
  { icon: "book-open", h: "База знаний · RAG", d: "pgvector + embeddings, semantic-поиск, авто-инъекция контекста в промпт чата." },
  { icon: "search", h: "Deep Research", d: "Итеративный поиск 2–4 мин, Model Council, Sparkpage-отчёты в HTML." },
  { icon: "pie-chart", h: "Аналитика", d: "Отчёты по роли: воронка, задачи, активность, финансы — запрос на естественном языке." },
  { icon: "bar-chart-3", h: "Бюджет AI", d: "Контроль трат на AI по команде / участнику / модели, связь с квотами тарифа." },
  { icon: "zap", h: "Skills", d: "6 встроенных + кастомные AI-навыки одной кнопкой: КП, разбор входящих, отчёт за неделю." },
  { icon: "database", h: "Интеграции", d: "1С (OData REST) · Битрикс24 (OAuth) · WhatsApp / VK — импорт сделок, задач, контрагентов." },
  { icon: "folder-open", h: "Файлы", d: "Хранилище организации, папки, доступ по ролям, квота по тарифу." },
  { icon: "users", h: "Команда", d: "Участники, инвайты, смена org-роли и профессиональной роли, seats по тарифу." },
];

const B24 = ["Сделки и воронки", "Контакты и компании", "Задачи с чек-листами", "Проекты и пользователи"];
const ONE_C = ["Контрагенты (ИНН, КПП)", "Номенклатура", "Документы (счета, акты)", "Договоры"];

const SECURITY = [
  { icon: "lock", h: "Шифрование ключей", d: "API-ключи — AES-256 (Fernet), расшифровка только при запросе." },
  { icon: "shield-check", h: "Матрица прав", d: "30+ permissions: модуль × действие, точечные overrides на пользователя." },
  { icon: "file-text", h: "Аудит-лог", d: "Полная история действий команды." },
  { icon: "globe", h: "Без VPN из РФ", d: "EU-прокси (VLESS + REALITY) к OpenAI, Anthropic." },
  { icon: "database", h: "Изоляция · 152-ФЗ", d: "Данные в РФ, организации разделены по organization_id." },
  { icon: "palette", h: "Брендинг", d: "Фон workspace, тема оформления под компанию." },
];

const TIERS: { tier: string; amt: string; per: string; desc: string; feats: string[]; featured?: boolean }[] = [
  { tier: "Enterprise", amt: "24 990", per: "₽ / мес", desc: "Команда до 10: корп-воркспейс, роли, изоляция.", featured: true, feats: ["Корп: CRM · Kanban · HR · Каналы", "<b>RBAC · 5 ролей</b>", "1С · Битрикс24", "10 seats (+seat 4 990 ₽)", "SLA 99.9% · онбординг ×2"] },
  { tier: "Enterprise+", amt: "договор", per: "", desc: "Корпорация: безлимит, ЭДО и on-premise.", feats: ["Всё из Enterprise", "<b>+ ЭДО · WhatsApp / VK</b>", "RBAC ∞ · ∞ seats", "on-premise · SSO / SAML / LDAP", "white-label · fine-tune"] },
];

export function BusinessPage({ onBack, onToast }: { onBack: () => void; onToast: Toast }) {
  return (
    <div className="subpage">
      <SubHero
        eyebrow="Бизнесу"
        title="Корпоративный AI-офис"
        accent="вместо зоопарка."
        sub="CRM, задачи, документооборот с согласованием и ЭДО, каналы, календарь, HR, аналитика — поверх системы из 10 профессиональных ролей. Один AI-офис вместо связки Битрикс24 + 1С + почта + мессенджеры. Рутину делает AI."
        onBack={onBack}
      />
      <div className="pg-wrap">
        <div className="stack-stats" style={{ marginTop: 0, marginBottom: 52 }}>
          {STATS.map((s) => (
            <div className="stack-stat" key={s.lab}>
              <span className="ss-num">{s.num}</span>
              <span className="ss-lab">{s.lab}</span>
            </div>
          ))}
        </div>

        <p className="pg-cap">▸ Три уровня доступа</p>
        <div className="biz-roles">
          {ORG_ROLES.map((r) => (
            <div className="role-card" key={r.h}>
              <div className="role-ico"><AppIcon name={r.icon} size={20} color="var(--xero)" /></div>
              <div className="role-h">{r.h}</div>
              <p className="role-d">{r.d}</p>
              <span className="role-perm">{r.perm}</span>
            </div>
          ))}
        </div>
        <div className="biz-prof">
          {PROF_ROLES.map((p) => <span className="prof-chip" key={p}>{p}</span>)}
        </div>
        <div className="biz-note">
          <AppIcon name="layers" size={17} color="var(--xero)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Сайдбар и дашборд — <b>динамические</b>: собираются из прав роли. Бухгалтер видит финансы и ЭДО, но не CRM; директор — все 17 модулей.</span>
        </div>

        <p className="pg-cap" style={{ marginTop: 56 }}>▸ Модули — всё, что есть в Битрикс24, плюс AI</p>
        <div className="mod-grid">
          {MODULES.map((m) => (
            <div className="mod-card" key={m.h}>
              <div className="mod-top">
                <span className="mod-ico"><AppIcon name={m.icon} size={17} color="var(--xero)" /></span>
                <div className="mod-h">{m.h}</div>
              </div>
              <p className="mod-d">{m.d}</p>
            </div>
          ))}
        </div>

        <p className="pg-cap" style={{ marginTop: 56 }}>▸ Импорт из Битрикс24 и 1С — за 5 минут</p>
        <div className="biz-band">
          <div className="band-card">
            <div className="band-head"><span className="band-badge">Б24</span><span className="band-h">Битрикс24</span></div>
            <div className="band-list">
              {B24.map((x) => <div className="band-row" key={x}><span className="ck"><AppIcon name="check" size={14} /></span>{x}</div>)}
            </div>
          </div>
          <div className="band-card">
            <div className="band-head"><span className="band-badge">1С</span><span className="band-h">1С:Предприятие</span></div>
            <div className="band-list">
              {ONE_C.map((x) => <div className="band-row" key={x}><span className="ck"><AppIcon name="check" size={14} /></span>{x}</div>)}
            </div>
          </div>
        </div>

        <p className="pg-cap" style={{ marginTop: 56 }}>▸ Безопасность и контроль</p>
        <div className="biz-sec">
          {SECURITY.map((s) => (
            <div className="sec-card" key={s.h}>
              <span className="sec-ico"><AppIcon name={s.icon} size={17} /></span>
              <div className="sec-h">{s.h}</div>
              <p className="sec-d">{s.d}</p>
            </div>
          ))}
        </div>

        <p className="pg-cap" style={{ marginTop: 56 }}>▸ Тарифы для команд</p>
        <div className="biz-tiers">
          {TIERS.map((p) => (
            <div className={"price" + (p.featured ? " featured" : "")} key={p.tier}>
              <span className="price-tier">{p.tier}</span>
              <div className="price-amt">{p.amt} {p.per && <span>{p.per}</span>}</div>
              <p className="price-desc">{p.desc}</p>
              <ul>
                {p.feats.map((f, i) => (
                  <li key={i}><span className="price-check"><AppIcon name="check" size={15} /></span><span dangerouslySetInnerHTML={{ __html: f }} /></li>
                ))}
              </ul>
              <button className="price-btn" onClick={() => onToast(p.tier)}>Связаться</button>
            </div>
          ))}
        </div>
        <p className="pay-note">Юрлицам — <b>счёт + акт с НДС</b>. Настроим workspace и импортируем данные из 1С / Битрикс24 <b>за 1 день</b>. BYOK = ∞ токенов: платишь за функции и seats, не за объём.</p>

        <div className="cta-panel" style={{ marginTop: 64 }}>
          <p className="hero-eyebrow" style={{ justifyContent: "center" }}>Готовы подключить команду?</p>
          <h2 className="cta-title">Весь офис.<br /><span className="accent">Один AI-слой.</span></h2>
          <p className="cta-sub">Покажем CORP на ваших данных и настроим оргструктуру под ваши роли.</p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => onToast("sales@xerocode.ru")}>Написать в продажи</button>
            <button className="btn-ghost" onClick={() => onToast("Демо CORP")}>Демо корп-режима</button>
          </div>
          <p className="cta-trust">Enterprise · Enterprise+ · 152-ФЗ · счёт + НДС · onboarding</p>
        </div>
      </div>
    </div>
  );
}
