/* XeroCode — Landing v3 (L01).
   Faithful port of the Claude Design handoff UI kit (ui_kits/xerocode-landing/*).
   14 sections: Nav · Hero (karaoke) · ProductShot · Stack · Workspaces (cream) ·
   Steps · Models+BYOK · Knowledge · Orchestration · Security (cream) · Pricing ·
   Telegram · FAQ · FinalCTA · Footer.

   Mounted on the review route ?view=landing-v3 (see App.tsx). All v3 tokens are
   scoped under .x3l so they never leak into the production app theme. */
import { useState, useEffect, useRef, Fragment, type CSSProperties, type FC } from "react";
import { AppIcon } from "./Icon";
import { Header, type SubPage, type Toast } from "./Header";
import { PricingPage } from "./pages/Pricing";
import { FeaturesPage } from "./pages/Features";
import { BusinessPage } from "./pages/Business";
import { ArenaPage } from "./pages/Arena";
import { TerminalPage } from "./pages/Terminal";
import { FaqPage } from "./pages/Faq";
import { AboutPage } from "./pages/About";
import "../../../styles/xerocode-v3-landing.css";
import "../../../styles/xerocode-v3-landing-pages.css";
import "../../../styles/xerocode-v3-page-content.css";
import "../../../styles/xerocode-v3-pages2.css";

// Единый навигатор лендинга: переход на страницу · «Возможности» с авто-раскрытием категории · скролл к секции главной.
type Nav = { go: (p: SubPage) => void; feature: (c: string) => void; scroll: (id: string) => void };

/* ── Hero (karaoke scroll-reveal) ────────────────────────────────── */
const HERO_LINES: { t: string; a?: boolean }[][] = [
  [{ t: "Один" }, { t: "человек." }],
  [{ t: "Восемь", a: true }, { t: "воркспейсов." }],
  [{ t: "Любая" }, { t: "задача" }, { t: "за" }, { t: "минуты." }],
];

function Hero({ onToast }: { onToast: Toast }) {
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const hero = heroRef.current;
    const scroller = document.getElementById("scroller");
    if (!hero) return;
    const words = hero.querySelectorAll(".w");
    const total = words.length;
    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const scrolled = -rect.top;
      const totalScroll = hero.offsetHeight - viewportH;
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll));
      const litCount = Math.floor(Math.min(1, progress * 1.5) * total);
      words.forEach((w, i) => w.classList.toggle("lit", i < litCount));
    };
    const target: HTMLElement | Window = scroller || window;
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => target.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-sticky">
        <div>
          <p className="hero-eyebrow">AI-офис для одного человека</p>
          <h1 className="hero-text">
            {HERO_LINES.map((line, li) => (
              <span className="line" key={li}>
                {line.map((w, wi) => (
                  <span key={wi} className={"w" + (w.a ? " accent" : "")}>{w.t}</span>
                ))}
              </span>
            ))}
          </h1>
        </div>
        <div className="hero-bottom">
          <p className="hero-sub">Чат, документы, картинки, видео, код, звук — в одном интерфейсе. <strong>14 моделей.</strong> BYOK на всех тарифах. Российский стек: Yandex GPT, GigaChat, Pollinations.</p>
          <div className="hero-meta">
            <span><strong>Часть SYLAR</strong></span>
            <span>B2C · SMB ≤ 50 seats</span>
            <span>Сделано в России</span>
          </div>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => { window.location.href = "/"; }}>Начать бесплатно</button>
            <button className="btn-ghost" onClick={() => { window.location.href = "mailto:sales@xerocode.ru?subject=Demo%20XeroCode"; }}>Посмотреть демо</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [02] Product shot — per-workspace mocks ─────────────────────── */
const PS_TABS = [
  { id: "chat", nm: "Чат", c: "var(--ws-chat)" },
  { id: "text", nm: "Текст", c: "var(--ws-text)" },
  { id: "img", nm: "Картинки", c: "var(--ws-images)" },
  { id: "code", nm: "Код", c: "var(--ws-code)" },
  { id: "orch", nm: "Оркестрация", c: "var(--ws-orchestr)" },
];
const PS_CAPTION: Record<string, string> = {
  chat: "Чат · команда моделей под лид-оркестратором, видимый процесс, хэндофф в воркспейсы.",
  text: "Текст · прямой редактор длинных документов с AI-помощником на лету.",
  img: "Картинки · промпт, стили и размеры, грид с вариациями и лайтбоксом.",
  code: "Код · паттерн «AI предлагает diff → ты применяешь», CLI и code-review.",
  orch: "Оркестрация · no-code DAG: триггеры, AI-ноды, ветвления, запуск по расписанию.",
};
const PS_CODE_HTML = [
  '<span class="psc"># JWT authentication with refresh rotation</span>',
  '<span class="psk">def</span> <span class="psf">refresh</span>(token: str):',
  '    data = jwt.<span class="psf">decode</span>(token, SECRET)',
  '    <span class="psc"># TODO: rotate refresh token</span>',
  '    <span class="psk">return</span> <span class="psf">create_token</span>(data[<span class="pss">"sub"</span>])',
].join("\n");

const PSCode: FC<{ onToast: Toast }> = ({ onToast }) => (
  <div className="ps-content ps-code">
    <div className="ps-code-bar">
      <span className="ps-code-title">main.py <i className="ps-dirty"></i></span>
      <div className="ps-code-acts">
        <button onClick={() => onToast("Run")}><AppIcon name="play" size={12} /> Run</button>
        <button onClick={() => onToast("Показать diff")}><AppIcon name="git-compare" size={12} /> Diff</button>
        <button className="apply" onClick={() => onToast("Apply changes")}><AppIcon name="check" size={13} color="var(--cream)" /> Apply</button>
      </div>
    </div>
    <div className="ps-code-tabs">
      <span className="on"><AppIcon name="file-code" size={12} color="var(--on-bg-dim)" /> main.py</span>
      <span><AppIcon name="file-code" size={12} color="var(--on-bg-dim)" /> auth.py</span>
      <span><AppIcon name="file-code" size={12} color="var(--on-bg-dim)" /> config.py</span>
    </div>
    <div className="ps-code-body">
      <div className="ps-code-lines">{[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}</div>
      <pre className="ps-code-src"><code dangerouslySetInnerHTML={{ __html: PS_CODE_HTML }} /></pre>
    </div>
    <div className="ps-ai-sug">
      <span className="ps-ai-av">AI</span>
      <div className="ps-ai-bd">
        <span className="ps-ai-cat"><AppIcon name="shield-check" size={11} color="var(--xero)" /> Security</span>
        <h4 className="ps-ai-t">Добавить ротацию refresh-токенов</h4>
        <p className="ps-ai-d">При каждом refresh — новый pair access+refresh и инвалидация старого с reuse-detection.</p>
        <div className="ps-ai-btns">
          <button className="apply" onClick={() => onToast("Применить")}><AppIcon name="check" size={12} color="var(--cream)" /> Применить</button>
          <button onClick={() => onToast("Показать diff")}><AppIcon name="git-compare" size={12} /> Diff <b className="ps-diffstat">+5 −1</b></button>
          <button className="ghost" onClick={() => onToast("Отклонить")}>Отклонить</button>
        </div>
      </div>
    </div>
  </div>
);

const PSDag: FC<{ onToast: Toast }> = ({ onToast }) => (
  <div className="ps-content ps-dag">
    <div className="ps-dag-tb">
      <span className="ps-dag-name"><AppIcon name="git-branch" size={13} color="var(--ws-orchestr)" /> Daily research → дайджест · 8 нод</span>
      <button onClick={() => onToast("Запустить DAG")}><AppIcon name="play" size={11} color="var(--cream)" /> Run</button>
    </div>
    <div className="ps-dag-canvas">
      <div className="ps-stage">
        <div className="ps-node trig" onClick={() => onToast("Cron 09:00")}><AppIcon name="clock" size={14} color="var(--xero)" /><span>Cron 09:00</span></div>
      </div>
      <div className="ps-link"><AppIcon name="chevron-right" size={14} color="var(--on-bg-dim)" /></div>
      <div className="ps-stage">
        <div className="ps-node" onClick={() => onToast("Web Search")}><AppIcon name="search" size={14} color="var(--xero)" /><span>Web Search</span></div>
        <div className="ps-node ai" onClick={() => onToast("AI · Opus")}><AppIcon name="zap" size={14} color="var(--cream)" /><span>AI · Opus</span></div>
      </div>
      <div className="ps-link fork"><span className="ps-fork-lab">развилка</span><AppIcon name="git-branch" size={15} color="var(--ws-orchestr)" /></div>
      <div className="ps-stage">
        <div className="ps-node" onClick={() => onToast("Фильтр: важное")}><AppIcon name="filter" size={13} color="var(--xero)" /><span>Важное</span></div>
        <div className="ps-node" onClick={() => onToast("Тренды рынка")}><AppIcon name="trending-up" size={13} color="var(--xero)" /><span>Тренды</span></div>
        <div className="ps-node" onClick={() => onToast("РФ-контекст · Yandex")}><AppIcon name="globe" size={13} color="var(--sylar)" /><span>РФ · Yandex</span></div>
      </div>
      <div className="ps-link merge"><span className="ps-fork-lab">слияние</span><AppIcon name="git-merge" size={15} color="var(--ws-orchestr)" /></div>
      <div className="ps-stage">
        <div className="ps-node" onClick={() => onToast("Свод · GPT")}><AppIcon name="layers" size={13} color="var(--xero)" /><span>Свод</span></div>
      </div>
      <div className="ps-link"><AppIcon name="chevron-right" size={14} color="var(--on-bg-dim)" /></div>
      <div className="ps-stage">
        <div className="ps-node out" onClick={() => onToast("Email")}><AppIcon name="mail" size={13} color="var(--ws-code)" /><span>Email</span></div>
        <div className="ps-node out" onClick={() => onToast("Telegram")}><AppIcon name="send" size={13} color="var(--ws-code)" /><span>Telegram</span></div>
      </div>
    </div>
  </div>
);

const PSChat: FC<{ onToast: Toast }> = ({ onToast }) => (
  <div className="ps-content ps-chat">
    <div className="ps-chat-msgs">
      <div className="ps-msg me">Сделай 10-страничную презентацию для инвесторов SYLAR. Тон серьёзный.</div>
      <div className="ps-msg ai">
        <span className="ps-route">▸ Команда «Документ» · лид Claude</span>
        Собрал структуру из 10 слайдов и черновик. Запускаю в Documents.
        <span className="ps-handoff" style={{ "--ws": "var(--ws-text)" } as CSSProperties} onClick={() => onToast("Открыть в Documents")}>
          <AppIcon name="file-text" size={13} color="var(--ws-text)" /> Презентация · PPTX · 10 слайдов <b>ГОТОВО</b>
        </span>
      </div>
    </div>
    <aside className="ps-rail">
      <div className="ps-rail-h">▸ Авто-роутер</div>
      <div className="ps-rail-card">
        <span className="ps-pick">Команда «Документ»</span>
        <span className="ps-why">многошаговый документ — нужна команда</span>
        <div className="ps-chips"><span className="lead">Claude · лид</span><span>GPT</span><span>Sonnet</span></div>
      </div>
    </aside>
  </div>
);

const PS_TXT_TOOLS = [
  { i: "heading", t: "Заголовок" }, { i: "bold", t: "Жирный" }, { i: "italic", t: "Курсив" },
  { i: "list", t: "Список" }, { i: "link-2", t: "Ссылка" },
];
const PSText: FC<{ onToast: Toast }> = ({ onToast }) => (
  <div className="ps-content ps-doc">
    <div className="ps-doc-tb">
      <span className="ps-doc-file"><AppIcon name="file-text" size={14} color="var(--ws-text)" /> Пост — запуск XeroCode</span>
      <div className="ps-doc-tools">
        {PS_TXT_TOOLS.map((b, i) => (
          <button key={i} title={b.t} onClick={() => onToast(b.t)}><AppIcon name={b.i} size={14} /></button>
        ))}
        <span className="ps-doc-div"></span>
        <button className="ps-doc-aibtn" onClick={() => onToast("AI-помощник")}><AppIcon name="zap" size={13} color="var(--xero)" /> AI</button>
      </div>
      <span className="ps-doc-meta">920 знаков · сохранено</span>
    </div>
    <div className="ps-doc-scroll">
      <div className="ps-doc-page">
        <h3 className="ps-doc-h">Запускаем XeroCode — AI-офис для одного</h3>
        <p className="ps-doc-p">Восемь рабочих мест и 14 моделей в одном окне: чат, документы, картинки, код — без переключения вкладок и десятка подписок.</p>
        <p className="ps-doc-p sel">Российский стек и BYOK на любом тарифе — подключаешь свой ключ, и лимиты снимаются.
          <span className="ps-doc-cursor"></span>
        </p>
        <div className="ps-doc-popover">
          <button className="on" onClick={() => onToast("Переписать")}><AppIcon name="zap" size={11} color="var(--xero)" /> Переписать</button>
          <button onClick={() => onToast("Короче")}>Короче</button>
          <button onClick={() => onToast("Серьёзнее")}>Серьёзнее</button>
        </div>
        <p className="ps-doc-p muted">Попробовать бесплатно, без карты →</p>
      </div>
    </div>
  </div>
);

const PS_TILES: { s: string; load?: boolean }[] = [{ s: "editorial" }, { s: "photo", load: true }, { s: "3d" }, { s: "iso" }];
const PSImg: FC<{ onToast: Toast }> = ({ onToast }) => (
  <div className="ps-content ps-img">
    <div className="ps-img-prompt">
      <AppIcon name="image" size={15} color="var(--ws-images)" />
      <span>Баннер для лендинга: тёмный фон, фиолетовый акцент…</span>
      <button onClick={() => onToast("Сгенерировать")}>Сгенерировать</button>
    </div>
    <div className="ps-img-pills">
      <span className="on">Editorial</span>
      <span>1024 × 1024</span>
      <span>gpt-image-2</span>
    </div>
    <div className="ps-img-grid">
      {PS_TILES.map((t, i) => (
        <div key={i} className={"ps-tile" + (t.load ? " load" : "")}>
          {t.load
            ? <Fragment><span className="ps-tile-bar"><i></i></span><span className="ps-tile-lab">генерация · 64%</span></Fragment>
            : <span className="ps-tile-lab">{t.s}.png</span>}
        </div>
      ))}
    </div>
  </div>
);

const PS_BODIES: Record<string, FC<{ onToast: Toast }>> = { chat: PSChat, text: PSText, img: PSImg, code: PSCode, orch: PSDag };

function ProductShot({ onToast }: { onToast: Toast }) {
  const [tab, setTab] = useState("chat");
  const active = PS_TABS.find((t) => t.id === tab)!;
  const Body = PS_BODIES[tab];
  return (
    <section className="section" id="product">
      <div className="section-num">Как это выглядит</div>
      <div className="section-head">
        <h2 className="section-title">Восемь рабочих мест<br /><span className="accent">в одном окне.</span></h2>
        <p className="section-sub">У каждого воркспейса — свой интерфейс под свою задачу. Переключай — контекст едет за тобой.</p>
      </div>

      <div className="ps-tabs">
        {PS_TABS.map((t) => (
          <button key={t.id} className={"ps-tab" + (t.id === tab ? " on" : "")} onClick={() => setTab(t.id)}>
            <span className="ps-dot" style={{ background: t.c }}></span>{t.nm}
          </button>
        ))}
      </div>

      <div className="ps-frame">
        <div className="ps-bar">
          <span className="ps-lights"><i></i><i></i><i></i></span>
          <span className="ps-url">app.xerocode.ru/{tab}</span>
        </div>
        <div className="ps-body">
          <aside className="ps-side">
            <div className="ps-brand">XeroCode<span></span></div>
            {PS_TABS.map((t) => (
              <div key={t.id} className={"ps-navitem" + (t.id === tab ? " on" : "")}>
                <span className="ps-navdot" style={{ background: t.c }}></span>{t.nm}
              </div>
            ))}
          </aside>
          <Body onToast={onToast} />
        </div>
      </div>
      <p className="ps-caption"><span className="ps-cdot" style={{ background: active.c }}></span> {PS_CAPTION[tab]}</p>
      <div className="ps-cta-row"><button className="ps-cta" onClick={() => { window.location.href = "/"; }}>Открыть в приложении <AppIcon name="arrow-right" size={15} color="var(--xero)" /></button></div>
    </section>
  );
}

/* ── [03] Stack — honest social proof ────────────────────────────── */
const STACK = ["1С:Предприятие", "Bitrix24", "Диадок", "СБИС", "Notion", "Confluence", "SharePoint", "Telegram", "Yandex GPT", "GigaChat"];
function Stack() {
  return (
    <section className="section stack-sec">
      <p className="stack-lead">Работает с вашим стеком — без миграций и переучивания команды</p>
      <div className="stack-row">
        {STACK.map((s) => <span className="stack-chip" key={s}>{s}</span>)}
      </div>
      <div className="stack-stats">
        <div className="stack-stat"><span className="ss-num">8</span><span className="ss-lab">воркспейсов</span></div>
        <div className="stack-stat"><span className="ss-num">14</span><span className="ss-lab">моделей</span></div>
        <div className="stack-stat"><span className="ss-num">∞</span><span className="ss-lab">запросов с BYOK</span></div>
        <div className="stack-stat"><span className="ss-num">152-ФЗ</span><span className="ss-lab">данные в РФ</span></div>
      </div>
    </section>
  );
}

/* ── [04] Workspaces (cream) ─────────────────────────────────────── */
const WS = [
  { n: "01", name: "Чат", tag: "14 моделей", c: "var(--ws-chat)", icon: "message-square" },
  { n: "02", name: "Текст", tag: "редактор + AI", c: "var(--ws-text)", icon: "file-text" },
  { n: "03", name: "Картинки", tag: "gpt-image-2", c: "var(--ws-images)", icon: "image" },
  { n: "04", name: "Код", tag: "CLI · review", c: "var(--ws-code)", icon: "terminal" },
  { n: "05", name: "Видео", tag: "Sora · Veo", c: "var(--ws-video)", icon: "film" },
  { n: "06", name: "Звук", tag: "Suno · TTS", c: "var(--ws-sound)", icon: "music" },
  { n: "07", name: "Корпорат.", tag: "Enterprise", c: "var(--ws-corp)", icon: "building-2" },
  { n: "08", name: "Оркестрация", tag: "no-code DAG", c: "var(--ws-orchestr)", icon: "network" },
];
function Workspaces({ nav }: { nav: Nav }) {
  return (
    <section className="section cream" id="ws">
      <div className="section-num">Восемь воркспейсов</div>
      <div className="section-head">
        <h2 className="section-title">Восемь модулей.<br /><span className="accent">Один интерфейс.</span></h2>
        <p className="section-sub">Каждый воркспейс — полноценное рабочее пространство со своими моделями и инструментами. Переключение в один клик, контекст переносится.</p>
      </div>
      <div className="ws-grid">
        {WS.map((w) => (
          <div className="ws" key={w.n} onClick={() => nav.feature("ws")}>
            <div className="ws-icon" style={{ background: w.c }}><AppIcon name={w.icon} size={20} color="var(--cream)" /></div>
            <span className="ws-num">{w.n}</span>
            <span className="ws-name">{w.name}</span>
            <span className="ws-tag">▸ {w.tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [06] Steps ──────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", icon: "message-square", h: "Опиши задачу", p: "Обычными словами, без выбора модели. «Сделай отчёт», «найди клиентов», «напиши код»." },
  { n: "02", icon: "zap", h: "Роутер соберёт команду", p: "Классификатор сам подберёт воркспейс и модель — или команду с лид-оркестратором." },
  { n: "03", icon: "layers", h: "Получи результат", p: "Готовый артефакт в нужном воркспейсе: документ, картинка, код, DAG. Открывается в один клик." },
];
function Steps() {
  return (
    <section className="section" id="how">
      <div className="section-num">Как это работает</div>
      <div className="section-head">
        <h2 className="section-title">Один делает<br /><span className="accent">работу пятерых.</span></h2>
        <p className="section-sub">Ты не управляешь моделями вручную — ставишь задачу, остальное собирает AI-роутер.</p>
      </div>
      <div className="steps-row">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <div className="step-top"><span className="step-ico"><AppIcon name={s.icon} size={20} color="var(--xero)" /></span><span className="step-n">{s.n}</span></div>
            <h3 className="step-h">{s.h}</h3>
            <p className="step-p">{s.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [07] Models + BYOK ──────────────────────────────────────────── */
const MODELS_L: Record<string, string[]> = {
  Premium: ["Claude Opus 4.7", "GPT-5.4", "Gemini 2.5 Ultra", "Grok 4"],
  Standard: ["Sonnet 4.6", "GPT-5.4 mini", "Gemini 2.5 Flash", "DeepSeek V4", "Llama 4 Maverick"],
  "Российские": ["YandexGPT 5 Pro", "GigaChat Max", "T-Pro"],
  Free: ["GigaChat Lite", "Qwen 3 8B"],
};
const MODEL_FACTS: Record<string, string> = {
  "Claude Opus 4.7": "Anthropic · флагман для сложных рассуждений, кода и длинных документов.",
  "GPT-5.4": "OpenAI · сильный универсал, мультимодальный,tool-calling.",
  "Gemini 2.5 Ultra": "Google · гигантский контекст и мультимодальность для аналитики.",
  "Grok 4": "xAI · быстрый, со свежими данными и рассуждением.",
  "Sonnet 4.6": "Anthropic · баланс цена/качество — рабочая лошадка под большинство задач.",
  "GPT-5.4 mini": "OpenAI · быстрый и недорогой, для массовых операций.",
  "Gemini 2.5 Flash": "Google · сверхбыстрый, большой контекст, дёшево.",
  "DeepSeek V4": "DeepSeek · сильные код и математика, открытые веса.",
  "Llama 4 Maverick": "Meta · открытая и гибкая, для self-host и кастома.",
  "YandexGPT 5 Pro": "Яндекс · русский язык, данные в РФ, 152-ФЗ.",
  "GigaChat Max": "Сбер · русскоязычная, на инфраструктуре РФ.",
  "T-Pro": "Т-Технологии · русская модель под бизнес-домен.",
  "GigaChat Lite": "Сбер · бесплатная быстрая русскоязычная.",
  "Qwen 3 8B": "Alibaba · бесплатная открытая, многоязычная.",
};
function Models({ nav }: { nav: Nav }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <section className="section" id="models">
      <div className="section-num">Модели и ключи</div>
      <div className="section-head">
        <h2 className="section-title">Четырнадцать моделей.<br /><span className="accent">Свои ключи.</span></h2>
        <p className="section-sub">Премиальные, российские и бесплатные — в одном чате. Подключи свой ключ (BYOK) и плати только провайдеру.</p>
      </div>
      <div className="models-cols">
        {Object.entries(MODELS_L).map(([grp, list]) => (
          <div className="models-col" key={grp}>
            <div className="models-grp">{grp}</div>
            {list.map((m) => <span className={"model-chip" + (sel === m ? " on" : "")} key={m} onClick={() => setSel(sel === m ? null : m)}>{m}</span>)}
          </div>
        ))}
      </div>
      {sel && (
        <div className="model-detail">
          <span className="md-name">{sel}</span>
          <span className="md-fact">{MODEL_FACTS[sel] ?? "Доступна в каталоге XeroCode — добавь свой ключ и пользуйся."}</span>
          <button className="md-more" onClick={() => nav.feature("models")}>Все 283 модели в каталоге <AppIcon name="arrow-right" size={13} color="var(--xero)" /></button>
        </div>
      )}
      <div className="byok-callout">
        <AppIcon name="key-round" size={22} color="var(--xero)" />
        <div className="byok-text"><strong>BYOK = ∞ запросов.</strong> Свой ключ OpenAI, Anthropic, Yandex или GigaChat — лимиты снимаются на любом тарифе, даже на Free.</div>
        <button className="byok-btn" onClick={() => { window.location.href = "/"; }}>Подключить ключ</button>
      </div>
    </section>
  );
}

/* ── [08] Knowledge — RU connectors ──────────────────────────────── */
const CONNECTORS = [
  { nm: "1С DocFlow", icon: "database", note: "договоры, акты, счета" },
  { nm: "Bitrix24", icon: "building-2", note: "CRM, сделки, контакты" },
  { nm: "Диадок", icon: "scroll-text", note: "ЭДО, входящие УПД" },
  { nm: "Notion", icon: "book-open", note: "вики, базы знаний" },
  { nm: "Confluence", icon: "file-stack", note: "проектная документация" },
  { nm: "SharePoint", icon: "server", note: "корпоративные файлы" },
];
function Knowledge({ nav }: { nav: Nav }) {
  return (
    <section className="section" id="knowledge">
      <div className="section-num">База знаний</div>
      <div className="section-head">
        <h2 className="section-title">RAG-поиск<br /><span className="accent">по вашим системам.</span></h2>
        <p className="section-sub">Подключи российские источники — XeroCode находит ответ с цитатами и прикрепляет контекст прямо в чат.</p>
      </div>
      <div className="conn-grid">
        {CONNECTORS.map((c) => (
          <div className="conn-card" key={c.nm} onClick={() => nav.feature("corp")}>
            <span className="conn-ico"><AppIcon name={c.icon} size={18} color="var(--xero)" /></span>
            <div className="conn-body"><span className="conn-nm">{c.nm}</span><span className="conn-note">{c.note}</span></div>
            <span className="conn-status"><span className="cs-dot"></span>RAG</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [09] Orchestration mini-DAG ─────────────────────────────────── */
const DAG_NODES = [
  { icon: "clock", lab: "Cron · 09:00 MSK", kind: "trigger" },
  { icon: "search", lab: "Web Search", kind: "action" },
  { icon: "zap", lab: "AI-анализ · Opus", kind: "ai" },
  { icon: "mail", lab: "Email digest", kind: "action" },
];
function Orchestration({ nav }: { nav: Nav }) {
  return (
    <section className="section" id="orchestration">
      <div className="section-num">Оркестрация</div>
      <div className="section-head">
        <h2 className="section-title">Соедини шаги<br /><span className="accent">в автопилот.</span></h2>
        <p className="section-sub">No-code DAG: триггер, поиск, AI-нода, ветвления и доставка. Собирается мышкой, запускается по расписанию.</p>
      </div>
      <div className="dag-strip">
        {DAG_NODES.map((n, i) => (
          <Fragment key={i}>
            <div className={"dag-node " + n.kind}>
              <span className="dn-ico"><AppIcon name={n.icon} size={17} color={n.kind === "ai" ? "var(--cream)" : "var(--xero)"} /></span>
              <span className="dn-lab">{n.lab}</span>
            </div>
            {i < DAG_NODES.length - 1 && <span className="dag-edge"><AppIcon name="arrow-right" size={16} color="var(--on-bg-dim)" /></span>}
          </Fragment>
        ))}
      </div>
      <p className="dag-note">Эталонный шаблон «Daily research → Email digest» · 5 шаблонов в комплекте · человек-в-цикле и бюджет токенов</p>
      <div className="dag-cta-row"><button className="dag-cta" onClick={() => nav.feature("orch")}>Как собрать свой сценарий <AppIcon name="arrow-right" size={15} color="var(--xero)" /></button></div>
    </section>
  );
}

/* ── [10] Security (cream) ───────────────────────────────────────── */
const TRUST = [
  { icon: "shield-check", h: "SOC 2 · в процессе", p: "Аудит безопасности и контроль доступа по отраслевым практикам." },
  { icon: "scroll-text", h: "152-ФЗ", p: "Персональные данные хранятся и обрабатываются на территории России." },
  { icon: "key-round", h: "BYOK", p: "Свои ключи провайдеров — запросы идут напрямую, мы не храним содержимое." },
  { icon: "lock", h: "Изоляция данных", p: "Организации разделены по organization_id на каждом запросе." },
];
function Security() {
  return (
    <section className="section cream" id="security">
      <div className="section-num">Безопасность</div>
      <div className="section-head">
        <h2 className="section-title">Российский стек.<br /><span className="accent">Твои данные — твои.</span></h2>
        <p className="section-sub">Сделано для рынка РФ: соответствие 152-ФЗ, изоляция организаций и BYOK без хранения переписки.</p>
      </div>
      <div className="trust-grid">
        {TRUST.map((t) => (
          <div className="trust-card" key={t.h}>
            <span className="trust-ico"><AppIcon name={t.icon} size={20} color="var(--xero)" /></span>
            <h3 className="trust-h">{t.h}</h3>
            <p className="trust-p">{t.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [11] Pricing ────────────────────────────────────────────────── */
const PLANS = [
  { tier: "Free", amt: "0", per: "₽ / мес", desc: "Старт без карты. Российские модели и Pollinations.", feats: ["GigaChat · Yandex GPT", "Pollinations картинки", "Чат · 14 моделей", "BYOK — свои ключи"], cta: "Начать" },
  { tier: "Pro", amt: "1 990", per: "₽ / мес", desc: "Все воркспейсы и премиум-модели для solo.", feats: ["<b>Картинки · Оркестрация</b>", "Claude · GPT · Gemini · Grok", "30 картинок · DAG ×5", "<b>BYOK = ∞ запросов</b>"], cta: "Попробовать Pro", featured: true },
  { tier: "Enterprise", amt: "24 990", per: "₽ / мес", desc: "Команда до 10: корп-воркспейс, роли, изоляция.", feats: ["Всё из Pro", "Корп: CRM · Kanban · HR", "RBAC · 1С · Битрикс24", "10 seats · SOC 2 · ФЗ-152"], cta: "Связаться" },
];
function Pricing({ onNavigate }: { onNavigate: (p: SubPage) => void }) {
  return (
    <section className="section" id="pricing">
      <div className="section-num">Тарифы</div>
      <div className="section-head">
        <h2 className="section-title">Шесть тарифов.<br /><span className="accent">BYOK = ∞.</span></h2>
        <p className="section-sub">Со своими ключами (BYOK) запросы не ограничены на любом тарифе — платишь только провайдеру модели.</p>
      </div>
      <div className="price-grid">
        {PLANS.map((p) => (
          <div className={"price" + (p.featured ? " featured" : "")} key={p.tier}>
            <span className="price-tier">{p.tier}</span>
            <div className="price-amt">{p.amt} <span>{p.per}</span></div>
            <p className="price-desc">{p.desc}</p>
            <ul>
              {p.feats.map((f, i) => (
                <li key={i}><span className="price-check"><AppIcon name="check" size={15} /></span><span dangerouslySetInnerHTML={{ __html: f }} /></li>
              ))}
            </ul>
            <button className="price-btn" onClick={() => { if (p.tier === "Enterprise") { window.location.href = "mailto:sales@xerocode.ru?subject=Enterprise"; } else { window.location.href = "/"; } }}>{p.cta}</button>
          </div>
        ))}
      </div>
      <p className="price-more" onClick={() => onNavigate("pricing")}>
        Ещё уровни: <b>Go · 490 ₽</b> · <b>Prime · 9 990 ₽</b> · <b>Enterprise+ · договор</b> — 6 тарифов под любой масштаб →
      </p>
    </section>
  );
}

/* ── [12] Telegram teaser ────────────────────────────────────────── */
function Telegram({ onToast }: { onToast: Toast }) {
  return (
    <section className="section" id="telegram">
      <div className="tg-wrap">
        <div className="tg-left">
          <div className="section-num">Telegram-бот</div>
          <h2 className="section-title">XeroCode<br /><span className="accent">в кармане.</span></h2>
          <p className="tg-sub">Ставь задачи, проверяй статус сделок и получай уведомления прямо в Telegram. Тяжёлое — открывается в вебе по ссылке.</p>
          <ul className="tg-cmds">
            <li><code>/task</code> поставить задачу боту</li>
            <li><code>/deals</code> срез по сделкам из CRM</li>
            <li><code>/status</code> что сейчас в работе</li>
          </ul>
          <button className="btn-primary" onClick={() => window.open("https://t.me/xerocode_bot", "_blank", "noopener")}>Открыть @xerocode_bot</button>
        </div>
        <div className="tg-phone">
          <div className="tg-screen">
            <div className="tg-bar"><span className="tg-av">XC</span><div><div className="tg-name">XeroCode bot</div><div className="tg-on">в сети · печатает…</div></div></div>
            <div className="tg-msgs">
              <div className="tg-msg in">Привет! Я твой AI-офис. Что сделать?</div>
              <div className="tg-msg out">/task собери отчёт по продажам за май</div>
              <div className="tg-msg in">Принял. Собираю в воркспейсе Документы — пришлю PPTX через ~2 мин. <span className="tg-link">Открыть в XeroCode →</span></div>
              <div className="tg-msg out">/deals</div>
              <div className="tg-msg in">В работе 12 сделок на 4,8 млн ₽. Топ-стадия — «Согласование» (5).</div>
            </div>
            <div className="tg-input"><span>Сообщение</span><AppIcon name="send" size={15} color="var(--xero)" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [13] FAQ ────────────────────────────────────────────────────── */
const FAQ = [
  { q: "Чем XeroCode отличается от подписки на ChatGPT?", a: "Это не один чат, а восемь рабочих мест с 14 моделями и AI-роутером, который сам собирает команду под задачу. Плюс российский стек и BYOK на любом тарифе." },
  { q: "Что такое BYOK и зачем он мне?", a: "Bring Your Own Key — подключаешь свой ключ провайдера (OpenAI, Anthropic, Yandex, GigaChat). Лимиты запросов снимаются, ты платишь напрямую провайдеру по его цене." },
  { q: "Мои данные уходят за рубеж?", a: "Нет. Платформа соответствует 152-ФЗ: данные хранятся в России. Российские модели работают полностью локально, премиальные — через защищённый прокси." },
  { q: "Подходит для команды?", a: "Да, на тарифах Enterprise и Enterprise+: корпоративный воркспейс с CRM, Kanban, ролями (RBAC) и изоляцией данных по организации." },
  { q: "Нужно ли платить, чтобы попробовать?", a: "Нет. На Free доступны российские модели, генерация картинок и чат с 14 моделями. Карта не нужна." },
];
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="section-num">Вопросы</div>
      <div className="section-head">
        <h2 className="section-title">Коротко<br /><span className="accent">о главном.</span></h2>
        <p className="section-sub">Не нашёл ответа — напиши в поддержку или загляни в документацию.</p>
      </div>
      <div className="faq-list">
        {FAQ.map((f, i) => (
          <div className={"faq-item" + (open === i ? " open" : "")} key={i} onClick={() => setOpen(open === i ? -1 : i)}>
            <div className="faq-q">
              <span>{f.q}</span>
              <AppIcon name="chevron-down" size={18} style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform 240ms var(--ease)", flexShrink: 0 }} />
            </div>
            <div className="faq-a-wrap"><p className="faq-a">{f.a}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [14] Final CTA ──────────────────────────────────────────────── */
function FinalCta({ onToast }: { onToast: Toast }) {
  return (
    <section className="section cta-sec">
      <div className="cta-panel">
        <p className="hero-eyebrow" style={{ justifyContent: "center" }}>Готов начать?</p>
        <h2 className="cta-title">Один человек.<br /><span className="accent">Весь AI-офис.</span></h2>
        <p className="cta-sub">Запусти первый воркспейс за минуту. Без карты, с российскими моделями и своими ключами.</p>
        <div className="cta-actions">
          <button className="btn-primary" onClick={() => { window.location.href = "/"; }}>Начать бесплатно</button>
          <button className="btn-ghost" onClick={() => { window.location.href = "mailto:sales@xerocode.ru?subject=Demo%20XeroCode"; }}>Посмотреть демо</button>
        </div>
        <p className="cta-trust">V3.0 · SOC 2 · 152-ФЗ · BYOK = ∞ · часть SYLAR</p>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────── */
function Footer({ nav }: { nav: Nav }) {
  const cols: { h: string; links: { l: string; act: () => void }[] }[] = [
    { h: "Продукт", links: [
      { l: "Возможности", act: () => nav.go("features") },
      { l: "Тарифы", act: () => nav.go("pricing") },
      { l: "Бизнесу", act: () => nav.go("business") },
      { l: "Документы", act: () => nav.feature("tools") },
    ] },
    { h: "Стек", links: [
      { l: "14 моделей", act: () => nav.scroll("models") },
      { l: "BYOK", act: () => nav.scroll("models") },
      { l: "CLI · MCP", act: () => nav.go("terminal") },
      { l: "Telegram-бот", act: () => nav.scroll("telegram") },
    ] },
    { h: "SYLAR", links: [
      { l: "О компании", act: () => nav.go("about") },
      { l: "Арена моделей", act: () => nav.go("arena") },
      { l: "Безопасность", act: () => nav.scroll("security") },
      { l: "ФЗ-152", act: () => nav.scroll("security") },
    ] },
  ];
  return (
    <footer className="foot">
      <div className="foot-top">
        <div>
          <div className="foot-brand" onClick={() => nav.go(null)}>XeroCode<span className="dot"></span></div>
          <p className="foot-tag">Один человек может сделать работу пятерых — не теряя времени и качества.</p>
        </div>
        {cols.map((c) => (
          <div className="foot-col" key={c.h}>
            <h5>{c.h}</h5>
            {c.links.map((x) => <a key={x.l} onClick={x.act}>{x.l}</a>)}
          </div>
        ))}
      </div>
      <div className="foot-bottom">
        <span>© XeroCode 2026 · Часть SYLAR</span>
        <span className="foot-app" onClick={() => { window.location.href = "/"; }}>app.xerocode.ru</span>
      </div>
    </footer>
  );
}

/* ── Home (long-scroll sections) ─────────────────────────────────── */
function LandingHome({ onToast, nav }: { onToast: Toast; nav: Nav }) {
  return (
    <Fragment>
      <Hero onToast={onToast} />
      <ProductShot onToast={onToast} />
      <Stack />
      <Workspaces nav={nav} />
      <Steps />
      <Models nav={nav} />
      <Knowledge nav={nav} />
      <Orchestration nav={nav} />
      <Security />
      <Pricing onNavigate={nav.go} />
      <Telegram onToast={onToast} />
      <Faq />
      <FinalCta onToast={onToast} />
      <Footer nav={nav} />
    </Fragment>
  );
}

/* ── Root shell — home + multi-page nav (review route ?view=landing-v3) ── */
export function LandingV3() {
  const [page, setPage] = useState<SubPage>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash: Toast = (label) => {
    setToast(label);
    window.clearTimeout((window as unknown as { __xt?: number }).__xt);
    (window as unknown as { __xt?: number }).__xt = window.setTimeout(() => setToast(null), 1700);
  };
  const navigate = (p: SubPage) => { setPage(p); window.scrollTo({ top: 0 }); };
  const back = () => navigate(null);
  const [featCat, setFeatCat] = useState<string | null>(null);
  const nav: Nav = {
    go: navigate,
    feature: (c) => { setFeatCat(c); navigate("features"); },
    scroll: (id) => { setPage(null); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); },
  };

  return (
    <div className="x3l">
      <Header page={page} onNavigate={navigate} onToast={flash} />
      {page === null && <LandingHome onToast={flash} nav={nav} />}
      {page === "pricing" && <PricingPage onBack={back} onToast={flash} />}
      {page === "features" && <FeaturesPage onBack={back} onNavigate={navigate} openCat={featCat ?? undefined} />}
      {page === "business" && <BusinessPage onBack={back} onToast={flash} />}
      {page === "arena" && <ArenaPage onBack={back} onToast={flash} />}
      {page === "terminal" && <TerminalPage onBack={back} />}
      {page === "faq" && <FaqPage onBack={back} />}
      {page === "about" && <AboutPage onBack={back} />}
      <div className={"toast" + (toast ? " show" : "")}>{toast ? `→ ${toast} · демо-лендинг (review)` : ""}</div>
    </div>
  );
}

export default LandingV3;
