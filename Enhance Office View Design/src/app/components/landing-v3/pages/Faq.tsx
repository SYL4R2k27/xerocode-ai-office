/* XeroCode Landing v3 — FAQ (sub-page).
   Re-skinned to v3 from V2 FAQPage, facts updated (6 тарифов, домен xerocode.ru,
   Free навсегда, оплата карта/СБП/МИР + счёт/НДС). Reuses home .faq-* accordion. */
import { useState } from "react";
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";

const QA = [
  { q: "Что такое XeroCode?", a: "AI-офис, который ускоряет работу: восемь воркспейсов (чат, текст, код, картинки, видео, звук, корпоратив, оркестрация) и 14 моделей в одном окне. Описываешь задачу — команда моделей её выполняет." },
  { q: "Чем это отличается от подписки на ChatGPT?", a: "Это не один чат, а восемь рабочих мест с 14 моделями и AI-роутером, который сам собирает команду под задачу. Плюс российский стек, корп-режим и BYOK на любом тарифе." },
  { q: "Что такое BYOK и зачем он мне?", a: "Bring Your Own Key — подключаешь свой ключ провайдера (OpenAI, Anthropic, Yandex, GigaChat) и платишь напрямую ему. Лимиты запросов при этом снимаются: BYOK = ∞ токенов на любом тарифе. Мы оркеструем, не перепродаём." },
  { q: "Нужен ли VPN из России?", a: "Нет. Премиальные модели идут через защищённый EU-прокси (VLESS + REALITY), российские работают напрямую. Просто открываешь сайт и работаешь — без настроек." },
  { q: "Можно попробовать бесплатно?", a: "Да. Тариф Free — навсегда и без карты: чат с 14 моделями, российские модели (GigaChat, Yandex GPT) и генерация картинок через Pollinations." },
  { q: "Мои данные уходят за рубеж?", a: "Нет. Платформа соответствует 152-ФЗ: данные хранятся в России. Ключи шифруются AES-256 (Fernet), организации изолированы по organization_id." },
  { q: "Какие задачи можно решать?", a: "Текст и документы (PPTX / DOCX / XLSX), код с исполнением в песочнице, картинки и видео, аналитику данных, ответы клиентам, автоматизацию процессов через no-code DAG. AI подстраивается под задачу." },
  { q: "Сколько стоит?", a: "Шесть тарифов: Free 0 ₽, Go 490 ₽, Pro 1 990 ₽, Prime 9 990 ₽, Enterprise 24 990 ₽, Enterprise+ (договор). Годовая оплата — скидка до 25 %. С BYOK запросы не ограничены на любом из них." },
  { q: "Есть корпоративный тариф?", a: "Да — Enterprise и Enterprise+: корп-воркспейс с CRM, Kanban, документооборотом, ролями (RBAC), HR и аналитикой, изоляция данных по организации, интеграции 1С и Битрикс24. Оплата по счёту + акт с НДС." },
  { q: "Как оплатить?", a: "Карта (Visa, MasterCard, МИР), СБП. Юрлицам — счёт + закрывающие документы с НДС, чек по ФЗ-54." },
  { q: "Безопасно ли хранить данные?", a: "Да. API-ключи шифруются AES-256 (Fernet), авторизация — JWT + refresh, есть rate limiting и HTTPS. Диалоги не хранятся после выполнения задачи." },
  { q: "Где ещё работает XeroCode?", a: "Веб-интерфейс адаптирован под мобильные. Есть Telegram-бот (@xerocode_bot), CLI (xerocode-cli — brew / npm) и Desktop Agent для macOS, Windows и Linux." },
];

export function FaqPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="subpage">
      <SubHero
        eyebrow="FAQ"
        title="Частые"
        accent="вопросы."
        sub="Всё, что нужно знать перед стартом. Не нашёл ответа — напиши в поддержку."
        onBack={onBack}
      />
      <div className="faq-page-wrap">
        <div className="faq-list">
          {QA.map((f, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={i} onClick={() => setOpen(open === i ? -1 : i)}>
              <div className="faq-q">
                <span>{f.q}</span>
                <AppIcon name="chevron-down" size={18} style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform 240ms var(--ease)", flexShrink: 0 }} />
              </div>
              <div className="faq-a-wrap"><p className="faq-a">{f.a}</p></div>
            </div>
          ))}
        </div>
        <div className="qa-foot">
          <p>Не нашёл ответа?</p>
          <a href="mailto:support@xerocode.ru"><AppIcon name="mail" size={15} /> support@xerocode.ru</a>
        </div>
      </div>
    </div>
  );
}
