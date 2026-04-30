/**
 * Безопасность — security policy / threat model.
 */
import { LegalLayout, type LegalSection } from "./LegalLayout";

interface Props { onBack: () => void; onCTA?: () => void; }

const SECTIONS: LegalSection[] = [
  {
    num: "1",
    title: "Шифрование",
    paragraphs: [
      "Все данные защищены многоуровневой системой шифрования. API-ключи и чувствительная информация — never in plain-text.",
    ],
    bullets: [
      "AES-256 (Fernet) — API-ключи провайдеров AI и BYOK ключи пользователей",
      "TLS 1.3 — все соединения между клиентом и сервером (HTTPS only)",
      "bcrypt cost=12 — хэширование паролей пользователей",
      "JWT (HS256) — авторизационные токены с TTL 1 час + refresh-токены 30 дней",
      "Шифрование at-rest — диски сервера зашифрованы LUKS2",
    ],
  },
  {
    num: "2",
    title: "Авторизация и доступ",
    bullets: [
      "OAuth 2.0 (Google, Yandex, GitHub, Telegram) с device-code flow для CLI",
      "Двухфакторная аутентификация (2FA) для тарифов Pro+",
      "RBAC — 5 ролей с матрицей прав на тарифе Enterprise",
      "Session token revocation при подозрительной активности",
      "OS Keychain (macOS Keychain / Windows Credential Manager / libsecret) для CLI",
    ],
  },
  {
    num: "3",
    title: "Сетевая безопасность",
    bullets: [
      "Rate limiting — защита от brute-force и DDoS (per-IP + per-user)",
      "Все вызовы AI-провайдеров идут через SOCKS5-прокси (изоляция от прямого выхода)",
      "WAF (Web Application Firewall) на уровне Cloudflare",
      "CSP (Content Security Policy) headers для защиты от XSS",
      "CORS только для разрешённых origin",
    ],
  },
  {
    num: "4",
    title: "Аудит и мониторинг",
    bullets: [
      "Audit-лог всех действий в корпоративном режиме (создание, редактирование, удаление)",
      "Логи безопасности — 3 года ретенции",
      "Real-time мониторинг через Sentry / OpenTelemetry / Grafana",
      "Алерты на подозрительные паттерны (авторизация из новой страны, массовая выгрузка данных)",
      "Регулярные пентесты — раз в полгода (внешний подрядчик)",
    ],
  },
  {
    num: "5",
    title: "Изоляция и резервирование",
    bullets: [
      "Multi-tenant изоляция через row-level security в PostgreSQL",
      "Daily бэкапы базы данных + 30-дневная ретенция",
      "Geo-redundant хранение критичных данных (Москва + резерв)",
      "Disaster recovery план — RTO 4 часа, RPO 24 часа",
      "Песочница (Docker isolation) для исполнения пользовательского кода",
    ],
  },
  {
    num: "6",
    title: "Compliance и стандарты",
    paragraphs: [
      "Мы соблюдаем требования российского и международного законодательства:",
    ],
    bullets: [
      "ФЗ-152 «О персональных данных» — обработка данных в РФ, согласие пользователя",
      "ФЗ-149 «Об информации» — лицензия на обработку",
      "GDPR (для пользователей из ЕС) — право на удаление, портабельность",
      "OWASP Top 10 — все известные уязвимости устранены",
      "ISO 27001 — внутренние процессы соответствуют (внешняя сертификация — Q4 2026)",
    ],
  },
  {
    num: "7",
    title: "Bug Bounty",
    paragraphs: [
      "Мы ценим ответственное раскрытие уязвимостей. Если вы нашли проблему безопасности — пишите на security@xerocode.space.",
    ],
    bullets: [
      "Critical (RCE, SQL injection, auth bypass) — до 200 000 ₽",
      "High (XSS, IDOR, неавторизованный доступ) — до 50 000 ₽",
      "Medium (information disclosure, CSRF) — до 15 000 ₽",
      "Low (UX-проблемы безопасности) — публичная благодарность + мерч",
      "Время первого ответа — 24 часа в рабочие дни",
    ],
  },
  {
    num: "8",
    title: "Инциденты",
    paragraphs: [
      "В случае нарушения безопасности (data breach) мы обязуемся:",
    ],
    bullets: [
      "Уведомить пострадавших пользователей в течение 72 часов",
      "Уведомить Роскомнадзор согласно требованиям ФЗ-152",
      "Опубликовать публичный пост-мортем с разбором инцидента",
      "Принять меры по предотвращению повторения",
    ],
  },
  {
    num: "9",
    title: "Контакты",
    paragraphs: [
      "Bug Bounty и репорты безопасности: security@xerocode.space",
      "PGP Key: доступен по запросу.",
    ],
  },
];

export function SecuritySubPage({ onBack, onCTA }: Props) {
  return (
    <LegalLayout
      num="10"
      title={<>Безопас<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>ность.</em></>}
      subtitle="Защита данных, шифрование, инциденты, bug bounty. Полная прозрачность по нашей security-модели."
      tagLabel="Security Policy · OWASP · ISO27001"
      tagAccent="#22C55E"
      effectiveDate="28 апреля 2026"
      sections={SECTIONS}
      onBack={onBack}
      onCTA={onCTA}
    />
  );
}
