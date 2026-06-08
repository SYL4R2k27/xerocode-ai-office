/* XeroCode Landing v3 — Тарифы (sub-page).
   Re-skinned to v3 from the V2 PricingPage, content updated to the REAL 6 plans
   from backend/app/core/plans.py (Free / Go / Pro / Prime / Enterprise / Enterprise+). */
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";
import type { Toast } from "../Header";

const PLANS: { tier: string; amt: string; per: string; desc: string; feats: string[]; cta: string; featured?: boolean }[] = [
  {
    tier: "Free", amt: "0", per: "₽ / мес", desc: "Старт без карты. Российские модели и Pollinations.",
    feats: ["Чат · 14 моделей", "GigaChat · Yandex GPT", "Pollinations картинки", "<b>BYOK — свои ключи</b>"],
    cta: "Начать",
  },
  {
    tier: "Go", amt: "490", per: "₽ / мес", desc: "Первые задачи: текст и код.",
    feats: ["+ Текст · Код", "200K токенов / мес", "10 картинок · 5 Deep Research", "DAG ×1"],
    cta: "Выбрать Go",
  },
  {
    tier: "Pro", amt: "1 990", per: "₽ / мес", desc: "Все воркспейсы и премиум-модели для solo.", featured: true,
    feats: ["<b>+ Картинки · Оркестрация</b>", "Claude · GPT · Gemini · Grok", "30 картинок · DAG ×5", "∞ дешёвых + 500K std + 50K premium", "MCP-сервер · webhooks"],
    cta: "Попробовать Pro",
  },
  {
    tier: "Prime", amt: "9 990", per: "₽ / мес", desc: "Power-user: видео и звук.",
    feats: ["+ Видео · Звук", "200 картинок · 20с видео · 3 мин звук", "2M std + 200K premium", "DAG ×20 · 300 Deep Research"],
    cta: "Выбрать Prime",
  },
  {
    tier: "Enterprise", amt: "24 990", per: "₽ / мес", desc: "Команда до 10: корп-воркспейс, роли, изоляция.",
    feats: ["Корп: CRM · Kanban · HR", "<b>RBAC · 5 ролей</b>", "1С · Битрикс24", "10 seats (+seat 4 990 ₽)", "SOC 2 · 152-ФЗ"],
    cta: "Связаться",
  },
  {
    tier: "Enterprise+", amt: "договор", per: "", desc: "Корпорация: безлимит и on-premise.",
    feats: ["Всё из Enterprise", "<b>+ ЭДО · WhatsApp/VK</b>", "RBAC ∞ · ∞ seats", "on-premise · SSO/SAML", "white-label · fine-tune"],
    cta: "Связаться",
  },
];

const CMP_COLS = ["Free", "Go", "Pro", "Prime", "Enterprise", "Enterprise+"];
const CMP_ROWS: { feat: string; vals: string[] }[] = [
  { feat: "Цена / мес", vals: ["0 ₽", "490 ₽", "1 990 ₽", "9 990 ₽", "24 990 ₽", "договор"] },
  { feat: "Seats", vals: ["1", "1", "1", "1", "10", "∞"] },
  { feat: "Воркспейсы", vals: ["Чат", "+Текст·Код", "+Картинки·Оркестр.", "+Видео·Звук", "+Корпоратив", "всё"] },
  { feat: "Картинки / мес", vals: ["0", "10", "30", "200", "500", "∞"] },
  { feat: "Deep Research / мес", vals: ["—", "5", "50", "300", "1 000", "∞"] },
  { feat: "DAG параллельно", vals: ["0", "1", "5", "20", "50", "∞"] },
  { feat: "Корп-модули", vals: ["no", "no", "no", "no", "CRM·HR·RBAC5·1С·Б24", "+ЭДО·WhatsApp·RBAC∞"] },
  { feat: "BYOK = ∞ токенов", vals: ["yes", "yes", "yes", "yes", "yes", "yes"] },
  { feat: "Поддержка", vals: ["docs", "email", "email·24ч", "chat", "chat·4ч·SLA", "dedicated"] },
];

function Cell({ v }: { v: string }) {
  if (v === "yes") return <AppIcon name="check" size={15} color="var(--ws-code)" />;
  if (v === "no") return <span className="no">—</span>;
  return <>{v}</>;
}

export function PricingPage({ onBack, onToast }: { onBack: () => void; onToast: Toast }) {
  return (
    <div className="subpage">
      <SubHero
        eyebrow="Тарифы"
        title="Шесть тарифов."
        accent="BYOK = ∞."
        sub="Со своими ключами (BYOK) запросы не ограничены на любом тарифе — платишь только провайдеру модели. Российские модели и картинки доступны даже на Free."
        onBack={onBack}
      />
      <div className="pricing-wrap">
        <div className="price-grid">
          {PLANS.map((p) => (
            <div className={"price" + (p.featured ? " featured" : "")} key={p.tier}>
              <span className="price-tier">{p.tier}</span>
              <div className="price-amt">{p.amt} {p.per && <span>{p.per}</span>}</div>
              <p className="price-desc">{p.desc}</p>
              <ul>
                {p.feats.map((f, i) => (
                  <li key={i}><span className="price-check"><AppIcon name="check" size={15} /></span><span dangerouslySetInnerHTML={{ __html: f }} /></li>
                ))}
              </ul>
              <button className="price-btn" onClick={() => onToast(p.tier)}>{p.cta}</button>
            </div>
          ))}
        </div>

        <p className="cmp-cap" style={{ marginTop: 56 }}>▸ Подробное сравнение</p>
        <div className="cmp-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th className="feat">Функция</th>
                {CMP_COLS.map((c, i) => <th key={c} className={i === 2 ? "hl" : undefined}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {CMP_ROWS.map((row) => (
                <tr key={row.feat}>
                  <td className="feat">{row.feat}</td>
                  {row.vals.map((v, i) => <td key={i}><Cell v={v} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="pay-note">
          Оплата: <b>карта · СБП · МИР</b>. Юрлицам — <b>счёт + акт с НДС</b> (чек по ФЗ-54). Годовая оплата — скидка до 25 %. Отмена в любой момент из личного кабинета. <b>BYOK = ∞ запросов</b> на любом тарифе — платишь только провайдеру модели.
        </p>
      </div>
    </div>
  );
}
