const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_16x9";
pres.author = "Vladimir Tirskikh";
pres.title = "XeroCode AI Office — Pitch & Business Plan";

// ── BRAND COLORS ──
const P = "8B5CF6"; // purple
const PD = "6D28D9"; // dark purple
const D = "0F0F11"; // dark bg
const D2 = "18181B"; // card bg
const W = "FFFFFF";
const G = "9CA3AF"; // gray text
const GR = "22C55E"; // green
const BL = "3B82F6"; // blue
const AM = "F59E0B"; // amber
const RD = "EF4444"; // red
const LP = "EDE9FE"; // light purple
const LB = "DBEAFE"; // light blue
const LG = "D1FAE5"; // light green
const LA = "FEF3C7"; // light amber

// ══════════════════════════════════════════════════════
// SLIDE 1: TITLE
// ══════════════════════════════════════════════════════
let s1 = pres.addSlide();
s1.background = { color: D };
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: P } });
s1.addText("XeroCode", { x: 0.8, y: 1.2, w: 8.4, h: 1.2, fontSize: 60, fontFace: "Arial Black", color: P, bold: true, margin: 0 });
s1.addText("AI Office Platform", { x: 0.8, y: 2.2, w: 8.4, h: 0.6, fontSize: 28, fontFace: "Arial", color: G, margin: 0 });
s1.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 2, h: 0.04, fill: { color: P } });
s1.addText("Команда ИИ вместо одного чат-бота.\nПодключи свои ключи — плати только провайдерам.", { x: 0.8, y: 3.5, w: 7, h: 0.9, fontSize: 16, fontFace: "Arial", color: G, italic: true, margin: 0 });
s1.addText("xerocode.space", { x: 0.8, y: 4.8, w: 4, h: 0.4, fontSize: 14, fontFace: "Arial", color: P, bold: true, margin: 0 });
s1.addText("Март 2026 | Владимир Тирских", { x: 5, y: 4.8, w: 4.2, h: 0.4, fontSize: 12, fontFace: "Arial", color: G, align: "right", margin: 0 });

// ══════════════════════════════════════════════════════
// SLIDE 2: PROBLEM
// ══════════════════════════════════════════════════════
let s2 = pres.addSlide();
s2.background = { color: W };
s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s2.addText("Проблема", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: D, bold: true, margin: 0 });

// Pain points as cards
const pains = [
  { icon: "🔒", title: "Замкнутые экосистемы", desc: "Каждый провайдер требует свой интерфейс, свою подписку, свой формат" },
  { icon: "💸", title: "5+ подписок", desc: "Программисты, копирайтеры, аналитики платят за ChatGPT, Claude, Gemini одновременно" },
  { icon: "🧩", title: "Нет командной работы", desc: "GPT пишет код, но не рисует. Claude анализирует, но не исполняет. Нет инструмента, объединяющего их" },
];
pains.forEach((p, i) => {
  const y = 1.3 + i * 1.3;
  s2.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y, w: 8.4, h: 1.1, fill: { color: "F9FAFB" }, rectRadius: 0.1, line: { color: "E5E7EB", width: 1 } });
  s2.addText(p.icon, { x: 1.0, y: y + 0.15, w: 0.6, h: 0.6, fontSize: 28, margin: 0 });
  s2.addText(p.title, { x: 1.7, y: y + 0.1, w: 7, h: 0.4, fontSize: 18, fontFace: "Arial", bold: true, color: D, margin: 0 });
  s2.addText(p.desc, { x: 1.7, y: y + 0.5, w: 7, h: 0.45, fontSize: 13, fontFace: "Arial", color: G, margin: 0 });
});

// ══════════════════════════════════════════════════════
// SLIDE 3: SOLUTION
// ══════════════════════════════════════════════════════
let s3 = pres.addSlide();
s3.background = { color: D };
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s3.addText("Решение: XeroCode", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: W, bold: true, margin: 0 });
s3.addText("Платформа-оркестратор. Ставишь цель — AI-команда решает.", { x: 0.8, y: 1.0, w: 8.4, h: 0.5, fontSize: 16, fontFace: "Arial", color: G, margin: 0 });

const features = [
  { icon: "🔑", title: "BYOK", desc: "Свои API-ключи. Мы не перепродаём доступ", color: BL },
  { icon: "🤝", title: "Mixed-Model", desc: "Claude + GPT + Gemini в одном потоке", color: P },
  { icon: "⚔️", title: "Arena", desc: "Модели соревнуются и улучшают ответы", color: AM },
  { icon: "🎯", title: "7 панелей", desc: "Код, Дизайн, Ресёрч, Текст, Данные, Менеджмент, Обучение", color: GR },
];
features.forEach((f, i) => {
  const x = 0.5 + i * 2.35;
  s3.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: 2.15, h: 2.8, fill: { color: D2 }, rectRadius: 0.1, line: { color: "27272A", width: 1 } });
  s3.addShape(pres.shapes.RECTANGLE, { x, y: 1.8, w: 2.15, h: 0.06, fill: { color: f.color } });
  s3.addText(f.icon, { x, y: 2.1, w: 2.15, h: 0.6, fontSize: 32, align: "center", margin: 0 });
  s3.addText(f.title, { x: x + 0.15, y: 2.7, w: 1.85, h: 0.4, fontSize: 16, fontFace: "Arial", bold: true, color: W, align: "center", margin: 0 });
  s3.addText(f.desc, { x: x + 0.15, y: 3.2, w: 1.85, h: 1.0, fontSize: 11, fontFace: "Arial", color: G, align: "center", margin: 0 });
});

// ══════════════════════════════════════════════════════
// SLIDE 4: KPI
// ══════════════════════════════════════════════════════
let s4 = pres.addSlide();
s4.background = { color: W };
s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s4.addText("Продукт в цифрах", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: D, bold: true, margin: 0 });

const kpis = [
  { val: "34K", label: "строк кода", bg: LP },
  { val: "430+", label: "AI моделей", bg: LB },
  { val: "10", label: "провайдеров", bg: LG },
  { val: "81-100%", label: "маржа", bg: LA },
];
kpis.forEach((k, i) => {
  const x = 0.5 + i * 2.35;
  s4.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.3, w: 2.15, h: 1.6, fill: { color: k.bg }, rectRadius: 0.15 });
  s4.addText(k.val, { x, y: 1.4, w: 2.15, h: 0.9, fontSize: 36, fontFace: "Arial Black", bold: true, color: D, align: "center", margin: 0 });
  s4.addText(k.label, { x, y: 2.2, w: 2.15, h: 0.5, fontSize: 13, fontFace: "Arial", color: G, align: "center", margin: 0 });
});

// Tech stack
s4.addText("Стек", { x: 0.8, y: 3.2, w: 8.4, h: 0.5, fontSize: 20, fontFace: "Arial", bold: true, color: D, margin: 0 });
const techs = ["FastAPI", "React 19", "TypeScript", "Vite 6", "Tailwind", "Electron", "WebSocket", "SQLAlchemy", "10 AI-адаптеров"];
s4.addText(techs.join("  •  "), { x: 0.8, y: 3.7, w: 8.4, h: 0.5, fontSize: 12, fontFace: "Arial", color: G, margin: 0 });

// Links
s4.addText([
  { text: "xerocode.space", options: { hyperlink: { url: "https://xerocode.space" }, color: P, bold: true } },
  { text: "  |  " },
  { text: "GitHub", options: { hyperlink: { url: "https://github.com/SYL4R2k27/xerocode-ai-office" }, color: P } },
  { text: "  |  " },
  { text: "npm: xerocode-agent", options: { hyperlink: { url: "https://npmjs.com/package/xerocode-agent" }, color: P } },
], { x: 0.8, y: 4.5, w: 8.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: G, margin: 0 });

// ══════════════════════════════════════════════════════
// SLIDE 5: COMPETITORS
// ══════════════════════════════════════════════════════
let s5 = pres.addSlide();
s5.background = { color: W };
s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s5.addText("Конкуренты и наши отличия", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: D, bold: true, margin: 0 });

const compRows = [
  ["Конкурент", "Stars", "Слабость", ""],
  ["Open WebUI", "128K", "Нет мульти-агентов", LG],
  ["LobeHub", "72K", "Пивотят (угроза!)", LA],
  ["CrewAI", "46K", "Нет BYOK, фреймворк", LG],
  ["GitHub Squad", "—", "Только Copilot", LG],
];
const colW5 = [2.5, 1.2, 4.7, 0];
s5.addTable(compRows.map((r, ri) => r.slice(0, 3).map((c, ci) => ({
  text: c,
  options: {
    fontSize: ri === 0 ? 12 : 13,
    fontFace: "Arial",
    bold: ri === 0,
    color: ri === 0 ? W : D,
    fill: { color: ri === 0 ? P : (r[3] || W) },
    border: [{ color: "E5E7EB", pt: 0.5 }],
    margin: [4, 6, 4, 6],
  }
}))), { x: 0.8, y: 1.2, w: 8.4, colW: [2.5, 1.2, 4.7] });

// 3 key differences
s5.addText("3 ключевых отличия XeroCode:", { x: 0.8, y: 3.5, w: 8.4, h: 0.4, fontSize: 16, fontFace: "Arial", bold: true, color: D, margin: 0 });
const diffs = [
  "BYOK + Мульти-агент — хабы дают BYOK без мульти-агентов; фреймворки наоборот. Мы — оба.",
  "Mixed-model команды — Claude + GPT + Gemini в одном workflow.",
  "Arena (Эволюция) — модели видят ответы друг друга и улучшают. Ни у кого нет.",
];
s5.addText(diffs.map((d, i) => ({ text: `${i + 1}. ${d}`, options: { breakLine: true, fontSize: 12, fontFace: "Arial", color: "374151" } })), { x: 0.8, y: 3.95, w: 8.4, h: 1.3, margin: 0 });

// ══════════════════════════════════════════════════════
// SLIDE 6: TARIFFS
// ══════════════════════════════════════════════════════
let s6 = pres.addSlide();
s6.background = { color: D };
s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s6.addText("Тарифы", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 36, fontFace: "Arial Black", color: W, bold: true, margin: 0 });

const plans = [
  { name: "START", price: "500₽", sub: "разово", color: G, agents: "3", tasks: "50" },
  { name: "PRO", price: "1 990₽", sub: "/мес", color: BL, agents: "10", tasks: "500" },
  { name: "PRO+", price: "5 490₽", sub: "/мес", color: P, agents: "15", tasks: "2 000" },
  { name: "ULTIMA", price: "34 990₽", sub: "/мес", color: AM, agents: "∞", tasks: "∞" },
];
plans.forEach((p, i) => {
  const x = 0.4 + i * 2.4;
  s6.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 2.2, h: 3.6, fill: { color: D2 }, rectRadius: 0.1, line: { color: "27272A", width: 1 } });
  s6.addShape(pres.shapes.RECTANGLE, { x, y: 1.2, w: 2.2, h: 0.06, fill: { color: p.color } });
  s6.addText(p.name, { x, y: 1.5, w: 2.2, h: 0.4, fontSize: 16, fontFace: "Arial", bold: true, color: p.color, align: "center", margin: 0 });
  s6.addText(p.price, { x, y: 1.95, w: 2.2, h: 0.5, fontSize: 28, fontFace: "Arial Black", bold: true, color: W, align: "center", margin: 0 });
  s6.addText(p.sub, { x, y: 2.4, w: 2.2, h: 0.3, fontSize: 11, fontFace: "Arial", color: G, align: "center", margin: 0 });
  s6.addText([
    { text: `${p.agents} агентов`, options: { breakLine: true, fontSize: 12, color: "D1D5DB" } },
    { text: `${p.tasks} задач/мес`, options: { breakLine: true, fontSize: 12, color: "D1D5DB" } },
    { text: i >= 2 ? "Премиум модели" : "Бесплатные API", options: { fontSize: 12, color: "D1D5DB" } },
  ], { x: x + 0.2, y: 3.0, w: 1.8, h: 1.4, fontFace: "Arial", margin: 0, valign: "top" });
});

// ══════════════════════════════════════════════════════
// SLIDE 7: FINANCIALS
// ══════════════════════════════════════════════════════
let s7 = pres.addSlide();
s7.background = { color: W };
s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s7.addText("Финансовая модель", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: D, bold: true, margin: 0 });

// Revenue table
const finRows = [
  ["Месяц", "Юзеров", "Выручка", "Расходы", "Прибыль", ""],
  ["1", "10", "15 900₽", "3 083₽", "+12 817₽", LG],
  ["3", "50", "109 500₽", "22 233₽", "+87 267₽", LG],
  ["6", "100", "484 400₽", "55 343₽", "+429 057₽", LG],
  ["12", "200", "968 800₽", "110 686₽", "+858 114₽", LG],
];
s7.addTable(finRows.map((r, ri) => r.slice(0, 5).map((c, ci) => ({
  text: c,
  options: {
    fontSize: ri === 0 ? 11 : 12,
    fontFace: "Arial",
    bold: ri === 0 || ci === 4,
    color: ri === 0 ? W : (ci === 4 ? "166534" : D),
    fill: { color: ri === 0 ? P : (r[5] || W) },
    border: [{ color: "E5E7EB", pt: 0.5 }],
    margin: [3, 5, 3, 5],
  }
}))), { x: 0.8, y: 1.1, w: 8.4, colW: [1.0, 1.2, 2.0, 2.0, 2.2] });

// Breakeven
s7.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 3.2, w: 4, h: 1.5, fill: { color: LP }, rectRadius: 0.1 });
s7.addText("Точка безубыточности", { x: 1.0, y: 3.3, w: 3.6, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: PD, margin: 0 });
s7.addText("2 PRO юзера", { x: 1.0, y: 3.7, w: 3.6, h: 0.5, fontSize: 28, fontFace: "Arial Black", color: D, margin: 0 });
s7.addText("Фикс расходы: 3 083₽/мес\nСредний чек: ~2 500₽/мес", { x: 1.0, y: 4.2, w: 3.6, h: 0.4, fontSize: 11, fontFace: "Arial", color: G, margin: 0 });

// Margins
s7.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 3.2, w: 4, h: 1.5, fill: { color: LG }, rectRadius: 0.1 });
s7.addText("Маржинальность", { x: 5.4, y: 3.3, w: 3.6, h: 0.4, fontSize: 14, fontFace: "Arial", bold: true, color: "166534", margin: 0 });
s7.addText([
  { text: "START: 100% | PRO: 100%", options: { breakLine: true, fontSize: 14, bold: true, color: D } },
  { text: "PRO+: 93% | ULTIMA: 91%", options: { breakLine: true, fontSize: 14, bold: true, color: D } },
  { text: "CORP: 81%", options: { fontSize: 14, bold: true, color: D } },
], { x: 5.4, y: 3.75, w: 3.6, h: 0.9, fontFace: "Arial", margin: 0 });

// ══════════════════════════════════════════════════════
// SLIDE 8: INVESTMENT
// ══════════════════════════════════════════════════════
let s8 = pres.addSlide();
s8.background = { color: D };
s8.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s8.addText("Инвестиционное предложение", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: W, bold: true, margin: 0 });

// Total ask
s8.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 1.2, w: 8.4, h: 1.0, fill: { color: D2 }, rectRadius: 0.1, line: { color: P, width: 2 } });
s8.addText("800 000₽ (~$8 500)", { x: 0.8, y: 1.25, w: 5, h: 0.9, fontSize: 36, fontFace: "Arial Black", bold: true, color: P, valign: "middle", margin: [0, 0, 0, 20] });
s8.addText("Окупаемость: 3-6 мес", { x: 5.5, y: 1.25, w: 3.5, h: 0.9, fontSize: 16, fontFace: "Arial", color: GR, align: "right", valign: "middle", margin: [0, 20, 0, 0] });

// Breakdown
const inv = [
  ["API-ключи (6 мес, 100 юзеров)", "500 000₽"],
  ["Сервер мощнее (4CPU/8GB)", "60 000₽"],
  ["Маркетинг (Habr, TG, YouTube)", "100 000₽"],
  ["ЮKassa + 54-ФЗ", "30 000₽"],
  ["Резерв", "110 000₽"],
];
inv.forEach((r, i) => {
  const y = 2.5 + i * 0.42;
  s8.addText(r[0], { x: 1.0, y, w: 5.5, h: 0.38, fontSize: 13, fontFace: "Arial", color: "D1D5DB", margin: 0 });
  s8.addText(r[1], { x: 6.5, y, w: 2.5, h: 0.38, fontSize: 13, fontFace: "Arial", color: W, bold: true, align: "right", margin: 0 });
});

// What investor gets
s8.addText("Что получает инвестор:", { x: 0.8, y: 4.7, w: 8.4, h: 0.35, fontSize: 14, fontFace: "Arial", bold: true, color: P, margin: 0 });
s8.addText("Готовый продукт (34K LOC) • Маржа 81-100% • 2 юзера до безубыточности • Уникальные фичи без аналогов", { x: 0.8, y: 5.05, w: 8.4, h: 0.35, fontSize: 11, fontFace: "Arial", color: G, margin: 0 });

// ══════════════════════════════════════════════════════
// SLIDE 9: ROADMAP
// ══════════════════════════════════════════════════════
let s9 = pres.addSlide();
s9.background = { color: W };
s9.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: P } });
s9.addText("Roadmap на 3 месяца", { x: 0.8, y: 0.3, w: 8.4, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: D, bold: true, margin: 0 });

const roadmap = [
  { time: "Неделя 1", task: "ЮKassa + оплата + OAuth", kpi: "Первый платёж", color: GR },
  { time: "Неделя 2", task: "Email SMTP + каталог 430+ моделей", kpi: "Каталог в UI", color: BL },
  { time: "Неделя 3-4", task: "Arena (Дуэль + Эволюция + Турнир)", kpi: "50 баттлов", color: P },
  { time: "Месяц 2", task: "Маркетплейс пулов + рейтинг + маркетинг", kpi: "100 юзеров", color: AM },
  { time: "Месяц 3", task: "Docker + мониторинг + масштабирование", kpi: "200 юзеров", color: GR },
];
roadmap.forEach((r, i) => {
  const y = 1.2 + i * 0.82;
  // Timeline dot and line
  s9.addShape(pres.shapes.OVAL, { x: 0.95, y: y + 0.15, w: 0.22, h: 0.22, fill: { color: r.color } });
  if (i < roadmap.length - 1) {
    s9.addShape(pres.shapes.RECTANGLE, { x: 1.03, y: y + 0.37, w: 0.06, h: 0.65, fill: { color: "E5E7EB" } });
  }
  s9.addText(r.time, { x: 1.4, y: y, w: 1.6, h: 0.35, fontSize: 13, fontFace: "Arial", bold: true, color: D, margin: 0 });
  s9.addText(r.task, { x: 3.0, y: y, w: 4.2, h: 0.35, fontSize: 13, fontFace: "Arial", color: "374151", margin: 0 });
  s9.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.4, y: y + 0.02, w: 1.8, h: 0.32, fill: { color: r.color }, rectRadius: 0.08 });
  s9.addText(r.kpi, { x: 7.4, y: y + 0.02, w: 1.8, h: 0.32, fontSize: 10, fontFace: "Arial", bold: true, color: W, align: "center", margin: 0 });
});

// ══════════════════════════════════════════════════════
// SLIDE 10: CONTACTS
// ══════════════════════════════════════════════════════
let s10 = pres.addSlide();
s10.background = { color: D };
s10.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: P } });
s10.addText("Спасибо!", { x: 0.8, y: 1.2, w: 8.4, h: 0.9, fontSize: 48, fontFace: "Arial Black", color: P, bold: true, margin: 0 });
s10.addText("Готовы обсудить инвестиции и сотрудничество", { x: 0.8, y: 2.1, w: 8.4, h: 0.5, fontSize: 18, fontFace: "Arial", color: G, margin: 0 });
s10.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.8, w: 3, h: 0.04, fill: { color: P } });

s10.addText([
  { text: "xerocode.space", options: { breakLine: true, fontSize: 16, bold: true, color: P, hyperlink: { url: "https://xerocode.space" } } },
  { text: "github.com/SYL4R2k27/xerocode-ai-office", options: { breakLine: true, fontSize: 14, color: G, hyperlink: { url: "https://github.com/SYL4R2k27/xerocode-ai-office" } } },
  { text: "npm: xerocode-agent", options: { breakLine: true, fontSize: 14, color: G, hyperlink: { url: "https://npmjs.com/package/xerocode-agent" } } },
], { x: 0.8, y: 3.2, w: 8.4, h: 1.5, fontFace: "Arial", margin: 0 });

s10.addText("Владимир Тирских | Март 2026", { x: 0.8, y: 4.8, w: 8.4, h: 0.4, fontSize: 12, fontFace: "Arial", color: G, margin: 0 });

// ── GENERATE ──
const outPath = "/Users/vladimirtirs/Desktop/\u0418\u0418 \u041E\u0424\u0418\u0421 /XeroCode_Pitch.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("Created:", outPath);
}).catch(err => {
  console.error("Error:", err);
});
