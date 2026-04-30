/**
 * XEROCODE Plans — frontend mirror of backend/app/core/plans.py
 * Single source of truth for prices and quotas in UI.
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 23
 */

export type PlanName = "free" | "go" | "pro" | "prime" | "enterprise" | "enterprise_plus";
export type Segment = "b2c" | "b2b";

export interface PlanFeature {
  text: string;
  type?: "highlight" | "dim";
}

export interface Plan {
  id: PlanName;
  displayName: string;
  segment: Segment;
  audience: string;
  priceRub: number;
  priceUsd: number;
  yearlyDiscount: number;
  isNegotiable: boolean;
  marginPercent: number;
  accent: string;
  highlight?: boolean;
  tag: string;
  features: PlanFeature[];
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    displayName: "Free",
    segment: "b2c",
    audience: "Попробовать",
    priceRub: 0,
    priceUsd: 0,
    yearlyDiscount: 0,
    isNegotiable: false,
    marginPercent: 0,
    accent: "#A0A0CC",
    tag: "▸ B2C · Trial",
    features: [
      { text: "BYOK · все модели через свой ключ", type: "highlight" },
      { text: "Free models (Llama, Pollinations)", type: "highlight" },
      { text: "50 сообщений / мес" },
      { text: "3 документа / день" },
      { text: "Premium модели", type: "dim" },
      { text: "Картинки / Видео / Звук", type: "dim" },
      { text: "1 user · 100 MB · 7 дней истории" },
    ],
    cta: "Начать бесплатно",
  },
  {
    id: "go",
    displayName: "Go",
    segment: "b2c",
    audience: "Новичок",
    priceRub: 490,
    priceUsd: 5,
    yearlyDiscount: 15,
    isNegotiable: false,
    marginPercent: 39,
    accent: "#00D4FF",
    tag: "▸ B2C · Entry",
    features: [
      { text: "BYOK · Free models", type: "highlight" },
      { text: "T1 Cheap 200k tok/мес (Haiku, gpt-4o-mini)" },
      { text: "500 сообщений / мес" },
      { text: "10 документов / день" },
      { text: "10 картинок / мес" },
      { text: "Workspace: Chat · Text · Code" },
      { text: "Telegram Bot" },
      { text: "1 user · 2 GB · 30 дней истории" },
    ],
    cta: "Выбрать Go",
  },
  {
    id: "pro",
    displayName: "Pro",
    segment: "b2c",
    audience: "Соло-проф ⭐",
    priceRub: 1990,
    priceUsd: 19,
    yearlyDiscount: 20,
    isNegotiable: false,
    marginPercent: 37,
    accent: "#7C5CFF",
    tag: "▸ B2C · Main",
    features: [
      { text: "BYOK · Free · T1 Cheap ∞", type: "highlight" },
      { text: "T2 Standard 500k tok (Sonnet 4.6)" },
      { text: "T3 Premium 50k tok (Opus 4.7, GPT-5.4)" },
      { text: "30 картинок / мес (gpt-image-1.5)" },
      { text: "50 документов / день · 50 deep research" },
      { text: "Workspace: + Images full" },
      { text: "5 параллельных DAG · MCP server" },
      { text: "1 user · 20 GB · история ∞" },
      { text: "Slack · Discord · Google Workspace" },
    ],
    cta: "Выбрать Pro",
  },
  {
    id: "prime",
    displayName: "Prime",
    segment: "b2c",
    audience: "Power-user ⭐⭐",
    priceRub: 9990,
    priceUsd: 99,
    yearlyDiscount: 25,
    isNegotiable: false,
    marginPercent: 36,
    accent: "#FFB547",
    highlight: true,
    tag: "▸ B2C · TOP",
    features: [
      { text: "BYOK · Free · T1 ∞", type: "highlight" },
      { text: "T2 Standard 2M tok" },
      { text: "T3 Premium 200k tok" },
      { text: "200 картинок + gpt-image-2 ⭐" },
      { text: "20 sec Video (Sora, Veo, Runway)" },
      { text: "3 min Audio (Suno, ElevenLabs)" },
      { text: "200 документов / день · 300 research" },
      { text: "Workspace: + Video · Sound" },
      { text: "20 параллельных DAG" },
      { text: "1 user · 100 GB · 100k API/день" },
      { text: "Chat priority 8ч · SLA 99.5%" },
    ],
    cta: "Стать Prime",
  },
  {
    id: "enterprise",
    displayName: "Enterprise",
    segment: "b2b",
    audience: "Команда до 10",
    priceRub: 24990,
    priceUsd: 249,
    yearlyDiscount: 25,
    isNegotiable: false,
    marginPercent: 38,
    accent: "#22C55E",
    tag: "▸ B2B · Team",
    features: [
      { text: "BYOK · Free · T1", type: "highlight" },
      { text: "T2 5M tok (shared pool)" },
      { text: "T3 500k tok (shared)" },
      { text: "500 картинок · Video · Audio" },
      { text: "Workspace: + Corporate" },
      { text: "CRM · Каналы · Задачи · HR" },
      { text: "1С · Битрикс24 · amoCRM" },
      { text: "5 ролей RBAC · Профроли" },
      { text: "до 10 seats (+4 990₽ extra)" },
      { text: "200 GB · Chat 4ч · SLA 99.9%" },
    ],
    cta: "Связаться",
  },
  {
    id: "enterprise_plus",
    displayName: "Enterprise+",
    segment: "b2b",
    audience: "Корпорация",
    priceRub: 79990,
    priceUsd: 799,
    yearlyDiscount: 25,
    isNegotiable: true,
    marginPercent: 38,
    accent: "#FF3B5C",
    tag: "▸ B2B · TOP",
    features: [
      { text: "Всё ∞ — без лимитов", type: "highlight" },
      { text: "Custom AI квоты · кастомные модели" },
      { text: "ЭДО Диадок · СБИС · КЭП" },
      { text: "WhatsApp · VK · Avito интеграции" },
      { text: "On-premise · Docker · Helm" },
      { text: "SSO · SAML · LDAP · AD" },
      { text: "Fine-tune custom моделей" },
      { text: "White Label · свой домен" },
      { text: "∞ seats · ∞ storage · API ∞" },
      { text: "Dedicated manager · SLA 99.95%" },
    ],
    cta: "Договорная",
  },
];

export function getPlan(id: PlanName): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
