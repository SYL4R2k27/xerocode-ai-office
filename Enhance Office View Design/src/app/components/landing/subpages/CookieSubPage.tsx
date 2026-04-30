/**
 * Cookie Policy.
 */
import { LegalLayout, type LegalSection } from "./LegalLayout";

interface Props { onBack: () => void; onCTA?: () => void; }

const SECTIONS: LegalSection[] = [
  {
    num: "1",
    title: "Что такое cookie",
    paragraphs: [
      "Cookie — это небольшие текстовые файлы, которые сохраняются в браузере при посещении сайта. Они позволяют сайту запоминать ваши действия и предпочтения (логин, язык, тему оформления) на определённый срок.",
      "XeroCode использует cookie для обеспечения работы сервиса, безопасности и улучшения пользовательского опыта. Большинство cookie — функциональные, без них сервис работать не сможет.",
    ],
  },
  {
    num: "2",
    title: "Какие cookie мы используем",
    paragraphs: [
      "Мы используем 4 категории cookie:",
    ],
    bullets: [
      "Строго необходимые — авторизация (JWT), CSRF-защита, session ID. Отключить нельзя",
      "Функциональные — выбранная тема (dark/light), язык, состояние UI (свёрнутый sidebar и т.д.)",
      "Аналитические — Yandex Metrika для понимания, как используется сервис. Деперсонализированы",
      "Маркетинговые — мы НЕ используем сторонние маркетинговые/рекламные cookie",
    ],
  },
  {
    num: "3",
    title: "Конкретные cookie",
    paragraphs: [
      "Полный список cookie, которые устанавливает xerocode.ru:",
    ],
    bullets: [
      "ai_office_token — JWT токен авторизации, TTL 1 час, httpOnly, secure",
      "ai_office_refresh — refresh токен, TTL 30 дней, httpOnly, secure, sameSite=strict",
      "ai-office-theme — выбранная тема (dark/light/system), TTL 1 год",
      "ai-office-locale — выбранный язык интерфейса (ru/en), TTL 1 год",
      "ai-office-onboarding-done — флаг прохождения онбординга, TTL без срока",
      "xerocode-mascot-disabled — отключён ли маскот Xero (опционально), TTL без срока",
      "_ym_uid, _ym_d — Yandex Metrika, TTL до 1 года, деперсонализированы",
    ],
  },
  {
    num: "4",
    title: "Сторонние сервисы",
    paragraphs: [
      "При использовании отдельных функций сервиса cookie могут устанавливаться сторонними сервисами:",
    ],
    bullets: [
      "ЮKassa / Tinkoff Acquiring — для проведения платежа (только на странице оплаты)",
      "Google / Yandex / GitHub / Telegram OAuth — при входе через соц-сети",
      "Cloudflare — security/CDN cookie на уровне инфраструктуры",
    ],
  },
  {
    num: "5",
    title: "Управление cookie",
    paragraphs: [
      "Вы можете управлять cookie через настройки браузера: блокировать, удалять, разрешать конкретные.",
      "Внимание: блокировка строго необходимых cookie (авторизация) приведёт к невозможности использовать сервис.",
    ],
    bullets: [
      "Chrome: Настройки → Конфиденциальность → Файлы cookie",
      "Firefox: Настройки → Приватность → Куки и данные сайтов",
      "Safari: Настройки → Конфиденциальность → Управление данными сайтов",
      "Edge: Настройки → Cookies и разрешения сайтов",
    ],
  },
  {
    num: "6",
    title: "Изменения политики",
    paragraphs: [
      "Мы можем обновлять Cookie Policy в случае добавления новых функций или изменения подхода. О существенных изменениях сообщаем уведомлением в интерфейсе.",
      "Дата последнего обновления указана в шапке документа.",
    ],
  },
  {
    num: "7",
    title: "Контакты",
    paragraphs: [
      "Вопросы по cookie: privacy@xerocode.space",
    ],
  },
];

export function CookieSubPage({ onBack, onCTA }: Props) {
  return (
    <LegalLayout
      num="11"
      title={<>Cookie <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>политика.</em></>}
      subtitle="Какие cookie мы используем, зачем и как ими управлять."
      tagLabel="Cookie Policy"
      tagAccent="#FFB547"
      effectiveDate="28 апреля 2026"
      sections={SECTIONS}
      onBack={onBack}
      onCTA={onCTA}
    />
  );
}
