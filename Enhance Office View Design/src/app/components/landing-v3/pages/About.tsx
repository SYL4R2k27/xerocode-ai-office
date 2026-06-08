/* XeroCode Landing v3 — О нас / Контакты (sub-page).
   Re-skinned to v3 from V2 AboutPage. Real requisites & contacts preserved
   (Тирских В.С. · ИП · ИНН 503015361714), domain updated to xerocode.ru. */
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";

const VALUES = [
  { icon: "zap", h: "Скорость", p: "Задачи — в разы быстрее. Секунды вместо часов." },
  { icon: "shield-check", h: "Безопасность", p: "AES-256 (Fernet), JWT, rate limiting. Изоляция организаций." },
  { icon: "layers", h: "Мульти-модельность", p: "430+ моделей от 10 провайдеров. Каждая — для своей задачи." },
  { icon: "users", h: "Для команд", p: "От solo до команды 50 человек. Единое пространство." },
];

const STATS = [
  { num: "430+", lab: "AI-моделей" },
  { num: "14", lab: "в чате" },
  { num: "10", lab: "провайдеров" },
  { num: "152-ФЗ", lab: "данные в РФ" },
];

const CONTACTS = [
  { lab: "Поддержка", val: "support@xerocode.ru", icon: "mail", href: "mailto:support@xerocode.ru" },
  { lab: "Коммерческие", val: "sales@xerocode.ru", icon: "mail", href: "mailto:sales@xerocode.ru" },
  { lab: "Сайт", val: "xerocode.ru", icon: "globe", href: "https://xerocode.ru" },
  { lab: "GitHub", val: "github.com/SYL4R2k27", icon: "github", href: "https://github.com/SYL4R2k27" },
  { lab: "npm", val: "xerocode-agent", icon: "package", href: "https://www.npmjs.com/package/xerocode-agent" },
];

export function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="subpage">
      <SubHero
        eyebrow="О нас / Контакты"
        title="Оркеструем,"
        accent="не перепродаём."
        sub="XeroCode — продукт SYLAR. Вместо выбора между GPT, Claude или Gemini ты используешь все модели сразу — каждую для того, в чём она сильнее."
        onBack={onBack}
      />
      <div className="about-wrap">
        <div className="about-mission">
          <p>Мы создаём инструмент, который позволяет работать быстрее. <b>BYOK (Bring Your Own Key)</b> — ты подключаешь свои API-ключи и платишь только провайдерам. Мы оркеструем, не перепродаём.</p>
          <p>Один человек делает работу пятерых — не теряя времени и качества. Российский стек (Yandex GPT, GigaChat, Pollinations) и соответствие 152-ФЗ.</p>
        </div>

        <p className="about-cap">▸ Принципы</p>
        <div className="about-vals">
          {VALUES.map((v) => (
            <div className="val-card" key={v.h}>
              <div className="val-ico"><AppIcon name={v.icon} size={20} color="var(--xero)" /></div>
              <div className="val-h">{v.h}</div>
              <p className="val-p">{v.p}</p>
            </div>
          ))}
        </div>

        <p className="about-cap">▸ Платформа в цифрах</p>
        <div className="stack-stats" style={{ margin: 0 }}>
          {STATS.map((s) => (
            <div className="stack-stat" key={s.lab}>
              <span className="ss-num">{s.num}</span>
              <span className="ss-lab">{s.lab}</span>
            </div>
          ))}
        </div>

        <div className="about-contacts">
          <p className="about-cap" style={{ marginBottom: 18 }}>▸ Контакты</p>
          <div className="about-req">
            <div className="nm">Тирских В.С.</div>
            <div className="meta">ИП · ИНН 503015361714</div>
          </div>
          {CONTACTS.map((c) => (
            <a
              className="contact-row"
              key={c.lab}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              <AppIcon name={c.icon} size={16} color="var(--on-bg-dim)" />
              <div>
                <div className="c-lab">{c.lab}</div>
                <div className="c-val">{c.val}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
