/* eslint-disable */
// Auto-extracted from /XEROCODE_FULL.html body content.
// React component XeroDesignShowcase injects it via dangerouslySetInnerHTML
// inside .x3-root namespace. JS effects (karaoke, nav-scroll, magnetic buttons)
// are re-implemented in the component using React refs + useEffect.

export const XEROCODE_V3_BODY_HTML = `<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  NAV                                                         ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<nav class="nav" id="nav">
  <a href="#" class="nav-brand">XeroCode<span class="dot"></span></a>
  <div class="nav-menu">
    <a href="#brand">Бренд</a>
    <a href="#landing">Лендинг</a>
    <a href="#screens">Экраны</a>
    <a href="#system">Дизайн-система</a>
  </div>
  <a href="#" class="nav-cta">Полная документация</a>
</nav>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  HERO with karaoke                                           ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<section class="hero" id="hero">
  <div class="hero-sticky">
    <div>
      <p class="hero-eyebrow">XeroCode · Full design system v 3.0</p>
      <h1 class="hero-text" id="hero-text">
        <span class="line"><span class="w">XeroCode</span> <span class="w">—</span> <span class="w accent">AI-офис</span> <span class="w">для</span> <span class="w">людей,</span></span>
        <span class="line"><span class="w">которые</span> <span class="w">делают</span> <span class="w">всё</span> <span class="w">сами.</span></span>
        <span class="line"><span class="w">Один</span> <span class="w">продукт.</span> <span class="w accent">Восемь</span> <span class="w accent">воркспейсов.</span></span>
        <span class="line"><span class="w">BYOK</span> <span class="w">на</span> <span class="w">всех</span> <span class="w">тарифах.</span></span>
      </h1>
    </div>

    <div class="hero-bottom">
      <p class="hero-sub">Чат с 14 моделями. Документы PPTX/DOCX/XLSX. Картинки, видео, звук. Код. Оркестрация. <strong>Один интерфейс. Российский стек.</strong></p>

      <div class="hero-meta">
        <span><strong>Часть SYLAR</strong></span>
        <span>B2C · SMB</span>
        <span style="margin-top: 10px;"><strong>Аудитория</strong></span>
        <span>Solo · 1—50 seats</span>
        <span style="margin-top: 10px;"><strong>Запуск</strong></span>
        <span>Live · v 3.0</span>
      </div>

      <div class="hero-actions">
        <a href="#screens" class="btn-primary">Все экраны</a>
      </div>
    </div>
  </div>
</section>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  PART I — BRAND                                              ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<section class="part" id="brand">
  <p class="part-num">PART I — Brand</p>
  <h2 class="part-name">Бренд.<br><span class="accent">Что такое XeroCode.</span></h2>
  <p class="part-desc">Один из двух продуктов SYLAR. Целит в индивидуальных пользователей и SMB-команды до 50 seats. Главная задача — чтобы один человек мог сделать работу пятерых, не теряя времени и качества.</p>
</section>

<!-- 8 Workspaces ───────────────────────────────────────────────── -->
<section class="section cream" id="workspaces">
  <div class="reveal">
    <p class="section-num" style="color: var(--on-cream-mute);">01 — Воркспейсы</p>
    <div class="section-head">
      <h2 class="section-title">Восемь модулей.<br>Один интерфейс.</h2>
      <p class="section-sub">Каждый воркспейс — это полноценное рабочее пространство со своими моделями, шаблонами и набором инструментов. Переключаются за один клик. Контекст переносится.</p>
    </div>
  </div>

  <div class="ws-grid">
    <div class="ws chat">
      <div class="ws-icon">CH</div>
      <div>
        <p class="ws-tag">▸ 01 · CHAT</p>
        <p class="ws-name">Чат</p>
      </div>
      <p class="ws-desc">14 моделей через единый чат. История, ветки, branching. Поиск по диалогам.</p>
    </div>
    <div class="ws text">
      <div class="ws-icon">TX</div>
      <div>
        <p class="ws-tag">▸ 02 · TEXT</p>
        <p class="ws-name">Текст</p>
      </div>
      <p class="ws-desc">Длинные документы, статьи, посты. Прямой редактор, AI-помощник на лету.</p>
    </div>
    <div class="ws images">
      <div class="ws-icon">IM</div>
      <div>
        <p class="ws-tag">▸ 03 · IMAGES</p>
        <p class="ws-name">Картинки</p>
      </div>
      <p class="ws-desc">Pollinations free + gpt-image-2 для премиум. Стили, эталоны, batch.</p>
    </div>
    <div class="ws code">
      <div class="ws-icon">CD</div>
      <div>
        <p class="ws-tag">▸ 04 · CODE</p>
        <p class="ws-name">Код</p>
      </div>
      <p class="ws-desc">Multi-language. CLI с прямой авторизацией. PR/MR-helper. Code review.</p>
    </div>
    <div class="ws video">
      <div class="ws-icon">VD</div>
      <div>
        <p class="ws-tag">▸ 05 · VIDEO</p>
        <p class="ws-name">Видео</p>
      </div>
      <p class="ws-desc">Sora, Runway, Veo. Сценарии, монтаж, цветокор по brief'у.</p>
    </div>
    <div class="ws sound">
      <div class="ws-icon">SD</div>
      <div>
        <p class="ws-tag">▸ 06 · SOUND</p>
        <p class="ws-name">Звук</p>
      </div>
      <p class="ws-desc">Suno music, ElevenLabs voice, шумодав, mastering. До 3 минут.</p>
    </div>
    <div class="ws corp">
      <div class="ws-icon">CR</div>
      <div>
        <p class="ws-tag">▸ 07 · CORP</p>
        <p class="ws-name">Корпорат.</p>
      </div>
      <p class="ws-desc">CRM, Kanban, документооборот, HR-модуль. Только на Enterprise тарифе.</p>
    </div>
    <div class="ws orch">
      <div class="ws-icon">OR</div>
      <div>
        <p class="ws-tag">▸ 08 · ORCHESTR.</p>
        <p class="ws-name">Оркестрация</p>
      </div>
      <p class="ws-desc">DAG-сценарии, агенты, MCP server, parallel chains. Без кода.</p>
    </div>
  </div>
</section>

<!-- COLOR PALETTE ──────────────────────────────────────────────── -->
<section class="section">
  <div class="reveal">
    <p class="section-num">02 — Палитра</p>
    <div class="section-head">
      <h2 class="section-title">Carbon, Cream,<br>Violet, восемь&nbsp;цветов&nbsp;воркспейсов.</h2>
      <p class="section-sub">Базовая палитра общая с RoleFlow и SYLAR. Уникальный акцент XeroCode — Violet #7C5CFF. Sienna остаётся как DNA-маркер связи с зонтом.</p>
    </div>
  </div>

  <div class="palette">
    <div class="swatch dark">
      <div><p class="name">Carbon</p><p class="hex">#0A0A0B</p></div>
      <p class="role">основной фон</p>
    </div>
    <div class="swatch cream">
      <div><p class="name">Cream</p><p class="hex">#F4EFE3</p></div>
      <p class="role">контрастная поверхность</p>
    </div>
    <div class="swatch xero">
      <div><p class="name">Violet · primary</p><p class="hex">#7C5CFF</p></div>
      <p class="role">XeroCode accent</p>
    </div>
    <div class="swatch sylar">
      <div><p class="name">Sienna · DNA</p><p class="hex">#D4654A</p></div>
      <p class="role">SYLAR connection</p>
    </div>
    <div class="swatch steel">
      <div><p class="name">Steel</p><p class="hex">#6E6E72</p></div>
      <p class="role">labels · meta</p>
    </div>
    <div class="swatch line">
      <div><p class="name">Line bg</p><p class="hex">rgba(.10)</p></div>
      <p class="role">hairlines · borders</p>
    </div>
  </div>

  <p style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; color: var(--xero); text-transform: uppercase; margin: 60px 0 20px;">▸ 8 цветов воркспейсов</p>
  <div class="palette" style="grid-template-columns: repeat(8, 1fr);">
    <div class="swatch" style="background: var(--ws-chat);"><div><p class="name" style="color: var(--cream);">Chat</p><p class="hex" style="color: var(--cream);">#7C5CFF</p></div></div>
    <div class="swatch" style="background: var(--ws-text);"><div><p class="name" style="color: var(--cream);">Text</p><p class="hex" style="color: var(--cream);">#06B6D4</p></div></div>
    <div class="swatch" style="background: var(--ws-images);"><div><p class="name" style="color: var(--cream);">Images</p><p class="hex" style="color: var(--cream);">#EC4899</p></div></div>
    <div class="swatch" style="background: var(--ws-code);"><div><p class="name" style="color: var(--cream);">Code</p><p class="hex" style="color: var(--cream);">#10B981</p></div></div>
    <div class="swatch" style="background: var(--ws-video);"><div><p class="name" style="color: var(--cream);">Video</p><p class="hex" style="color: var(--cream);">#F59E0B</p></div></div>
    <div class="swatch" style="background: var(--ws-sound);"><div><p class="name" style="color: var(--cream);">Sound</p><p class="hex" style="color: var(--cream);">#8B5CF6</p></div></div>
    <div class="swatch" style="background: var(--ws-corp);"><div><p class="name" style="color: var(--cream);">Corp</p><p class="hex" style="color: var(--cream);">#4F46E5</p></div></div>
    <div class="swatch" style="background: var(--ws-orchestr);"><div><p class="name" style="color: var(--cream);">Orch.</p><p class="hex" style="color: var(--cream);">#D4654A</p></div></div>
  </div>
</section>

<!-- TYPOGRAPHY ─────────────────────────────────────────────────── -->
<section class="section">
  <div class="reveal">
    <p class="section-num">03 — Типографика</p>
    <div class="section-head">
      <h2 class="section-title">Space Grotesk.<br>Inter. JetBrains&nbsp;Mono.</h2>
      <p class="section-sub">Та же типография что у SYLAR и RoleFlow. Принцип «одна семья — три размерности». Без serif, без italic, без эстетических украшений.</p>
    </div>
  </div>

  <div class="reveal">
    <div class="type-row">
      <span class="role-tag">Hero</span>
      <span class="sample" style="font-family: var(--display); font-weight: 500; font-size: 64px; letter-spacing: -0.04em; line-height: 0.95;">AI-офис<br>для&nbsp;<span style="color: var(--xero);">solo&nbsp;и&nbsp;команд</span></span>
      <span class="meta">Space Grotesk 500<br>−4% tracking<br><b>Hero · headlines</b></span>
    </div>
    <div class="type-row">
      <span class="role-tag">H2</span>
      <span class="sample" style="font-family: var(--display); font-weight: 500; font-size: 40px; letter-spacing: -0.025em;">Восемь&nbsp;воркспейсов</span>
      <span class="meta">Space Grotesk 500<br>40px / 1.05<br><b>Section opener</b></span>
    </div>
    <div class="type-row">
      <span class="role-tag">Body</span>
      <span class="sample" style="font-family: var(--body); font-size: 17px; line-height: 1.65; color: var(--on-bg-mute);">Чат с 14 моделями. Документы PPTX/DOCX/XLSX. Картинки, видео, звук, код. Один интерфейс.</span>
      <span class="meta">Inter 400<br>17px / 1.65<br><b>Paragraphs</b></span>
    </div>
    <div class="type-row">
      <span class="role-tag">Mono</span>
      <span class="sample" style="font-family: var(--mono); font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--xero);">▸ WORKSPACE · CHAT · CLAUDE OPUS</span>
      <span class="meta">JetBrains Mono 500<br>+22% tracking<br><b>Labels · technical</b></span>
    </div>
  </div>
</section>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  PART II — LANDING                                           ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<section class="part" id="landing">
  <p class="part-num">PART II — Landing</p>
  <h2 class="part-name">Лендинг.<br><span class="accent">xerocode.ru</span></h2>
  <p class="part-desc">Маркетинговый сайт продукта. Та же стилистика что у RoleFlow и SYLAR — Space Grotesk display, Carbon + Cream surfaces, karaoke scroll-reveal, browser-frame mockups. Уникальный акцент — Violet.</p>
</section>

<!-- LANDING — Hero mockup ──────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ L01</span>
      <span class="screen-title">Главный экран лендинга</span>
      <span class="screen-tag">/ · public</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">xerocode.ru</div>
      </div>
      <div class="browser-body" style="padding: 60px 56px; min-height: 560px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 80px;">
          <span style="font-family: var(--display); font-weight: 600; font-size: 18px; letter-spacing: -0.03em; color: var(--on-bg); display: flex; align-items: center; gap: 8px;">XeroCode<span style="width: 6px; height: 6px; background: var(--xero); border-radius: 50%;"></span></span>
          <div style="display: flex; gap: 24px; font-size: 12.5px; color: var(--on-bg-mute);">
            <span>Возможности</span><span>Тарифы</span><span>Документы</span><span>Войти</span>
          </div>
          <button style="padding: 8px 16px; background: var(--xero); color: var(--cream); border: none; border-radius: 999px; font-size: 12px; font-weight: 500;">Начать бесплатно</button>
        </div>

        <p style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--xero); text-transform: uppercase; margin-bottom: 24px;">▸ AI-офис для одного человека</p>
        <h1 style="font-family: var(--display); font-weight: 500; font-size: clamp(40px, 5vw, 80px); line-height: 0.95; letter-spacing: -0.04em; color: var(--on-bg); margin-bottom: 22px; max-width: 920px;">
          Один человек. <span style="color: var(--xero);">Восемь&nbsp;воркспейсов.</span><br>Любая&nbsp;задача&nbsp;за&nbsp;минуты.
        </h1>
        <p style="font-size: 17px; color: var(--on-bg-mute); max-width: 560px; line-height: 1.55; margin-bottom: 32px;">Чат, документы, картинки, видео, код, звук — в одном интерфейсе. 14 моделей. BYOK на всех тарифах. Российский стек: Yandex GPT, GigaChat, Pollinations.</p>
        <div style="display: flex; gap: 12px;">
          <button style="padding: 14px 28px; background: var(--xero); color: var(--cream); border: none; border-radius: 999px; font-size: 13px; font-weight: 500;">Начать бесплатно →</button>
          <button style="padding: 14px 28px; background: transparent; color: var(--on-bg); border: 1px solid var(--line-bg-strong); border-radius: 999px; font-size: 13px; font-weight: 500;">Посмотреть демо</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  PART III — APP SCREENS                                      ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<section class="part" id="screens">
  <p class="part-num">PART III — Application screens</p>
  <h2 class="part-name">Двенадцать <span class="accent">экранов.</span><br>Внутри&nbsp;приложения.</h2>
  <p class="part-desc">Полный обзор интерфейса XeroCode v3. Auth, dashboard, чат с AI, восемь воркспейсов, knowledge base, settings, mobile. Все в одной дизайн-системе.</p>
</section>

<!-- SCREEN 01: AUTH ────────────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A01</span>
      <span class="screen-title">Авторизация · Sign in</span>
      <span class="screen-tag">/auth · public</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / auth</div>
      </div>
      <div class="browser-body">
        <div class="auth-frame">
          <div class="auth-left">
            <div class="auth-brand">XeroCode<span class="dot"></span></div>
            <p class="auth-quote">Один продукт.<br><span class="accent">Восемь воркспейсов.</span><br>Бесконечно возможностей.</p>
            <div class="auth-meta">
              <span>v 3.0</span>
              <span>·</span>
              <span>SOC 2</span>
              <span>·</span>
              <span>ФЗ-152</span>
            </div>
          </div>
          <div class="auth-right">
            <div class="auth-form">
              <p class="lab">▸ Вход</p>
              <h2>Добро<br>пожаловать.</h2>
              <input class="auth-input" placeholder="email@company.ru">
              <input class="auth-input" type="password" placeholder="••••••••••">
              <button class="auth-btn">Войти →</button>
              <div class="auth-divider">или</div>
              <div class="auth-oauth">
                <button>Google</button>
                <button>Telegram</button>
              </div>
              <p class="auth-bottom">Нет аккаунта? <a>Регистрация</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 02: Main Dashboard ──────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A02</span>
      <span class="screen-title">Главная · Overview</span>
      <span class="screen-tag">/dashboard · authenticated</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / dashboard</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li class="active"><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Текст</span></li>
              <li><span><span class="ico"></span>Картинки</span><span class="num">12</span></li>
              <li><span><span class="ico"></span>Код</span></li>
              <li><span><span class="ico"></span>Видео</span></li>
              <li><span><span class="ico"></span>Звук</span></li>
              <li><span><span class="ico"></span>Оркестрация</span></li>
            </ul>
            <p class="app-side-section">Инструменты</p>
            <ul>
              <li><span><span class="ico"></span>База знаний</span></li>
              <li><span><span class="ico"></span>Документы</span></li>
              <li><span><span class="ico"></span>API ключи</span></li>
              <li><span><span class="ico"></span>Настройки</span></li>
            </ul>
            <div class="app-side-footer">
              <div class="av">V</div>
              <div class="who">Vladimir T.<div class="role">Pro · ⭐</div></div>
            </div>
          </aside>
          <main class="app-main">
            <div class="app-toolbar">
              <h2>Главная</h2>
              <div class="app-toolbar-right">
                <button class="btn-mini">Экспорт</button>
                <button class="btn-mini primary">+ Новая задача</button>
              </div>
            </div>

            <div class="dash-grid">
              <div class="metric">
                <p class="lab">Запросов · 7&nbsp;дней</p>
                <p class="val">1&nbsp;<span class="accent">428</span></p>
                <p class="delta up">↑ 12.4%</p>
              </div>
              <div class="metric">
                <p class="lab">Токенов · сегодня</p>
                <p class="val">38&nbsp;<span class="accent">К</span></p>
                <p class="delta up">↑ 4 модели</p>
              </div>
              <div class="metric">
                <p class="lab">Картинок · мес</p>
                <p class="val">12 / 30</p>
                <p class="delta">осталось 18</p>
              </div>
            </div>

            <div class="dash-row">
              <div class="dash-block">
                <div class="dash-block-head">
                  <h3>Последняя активность</h3>
                  <span class="more">Все →</span>
                </div>
                <ul class="activity">
                  <li><span class="ts">14:32</span><span class="what"><b>Chat</b> · Уточнение по техзаданию</span><span class="meta">Claude Opus</span></li>
                  <li><span class="ts">13:18</span><span class="what"><b>Images</b> · Сгенерирован баннер</span><span class="meta">gpt-image-2</span></li>
                  <li><span class="ts">12:04</span><span class="what"><b>Code</b> · Refactor JWT auth</span><span class="meta">Sonnet 4.6</span></li>
                  <li><span class="ts">11:30</span><span class="what"><b>Text</b> · Презентация инвесторам</span><span class="meta">GPT-5.4</span></li>
                  <li><span class="ts">10:45</span><span class="what"><b>Orchestration</b> · DAG #4 запущен</span><span class="meta">3 шага</span></li>
                </ul>
              </div>

              <div class="dash-block">
                <div class="dash-block-head">
                  <h3>Быстрый старт</h3>
                </div>
                <div class="quick-grid">
                  <div class="quick"><div class="ico" style="background: var(--ws-chat);"></div><p class="nm">Новый чат</p><p class="desc">Claude · GPT · Yandex</p></div>
                  <div class="quick"><div class="ico" style="background: var(--ws-images);"></div><p class="nm">Картинка</p><p class="desc">12 / 30 в месяце</p></div>
                  <div class="quick"><div class="ico" style="background: var(--ws-code);"></div><p class="nm">Код</p><p class="desc">CLI · MCP · IDE</p></div>
                  <div class="quick"><div class="ico" style="background: var(--ws-orchestr);"></div><p class="nm">DAG</p><p class="desc">5 шаблонов</p></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 03: Chat ────────────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A03</span>
      <span class="screen-title">Чат с AI · Workspace 01</span>
      <span class="screen-tag">/chat · V2 components</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / chat</div>
      </div>
      <div class="browser-body">
        <div class="chat-grid">
          <aside class="chat-list">
            <div class="search">🔍 Поиск по диалогам…</div>
            <ul>
              <li class="active">
                <span class="nm">Презентация инвесторам</span>
                <span class="pre">Сегодня тебе нужно подготовить…</span>
                <span class="ts">14:32</span>
              </li>
              <li>
                <span class="nm">Refactor authentication</span>
                <span class="pre">JWT + refresh tokens, нужна ли…</span>
                <span class="ts">12:04</span>
              </li>
              <li>
                <span class="nm">Идеи для лендинга</span>
                <span class="pre">Посмотрел humaan, parthean…</span>
                <span class="ts">Вчера</span>
              </li>
              <li>
                <span class="nm">Обзор рынка AI 2026</span>
                <span class="pre">Сделай research по компаниям…</span>
                <span class="ts">Вчера</span>
              </li>
              <li>
                <span class="nm">Email-копия для CRM</span>
                <span class="pre">Напиши follow-up клиенту…</span>
                <span class="ts">2 дня</span>
              </li>
            </ul>
          </aside>

          <main class="chat-area">
            <div class="chat-head">
              <span class="title">Презентация инвесторам</span>
              <span class="meta">
                <span>Claude Opus 4.7</span>
                <span>·</span>
                <span>4 580 токенов</span>
              </span>
            </div>
            <div class="chat-messages">
              <div class="msg me">
                <div class="av me">V</div>
                <div class="body">Сделай 10-страничную презентацию для инвесторов SYLAR. Главные тезисы: два продукта, SaaS-метрики, roadmap. Тон — серьёзный, не маркетинговый.</div>
              </div>
              <div class="msg">
                <div class="av ai">AI</div>
                <div class="body">
                  Понял. Соберу структуру 10 слайдов:
                  <br><br>
                  1. Cover — SYLAR Group<br>
                  2. Problem — Shadow AI и микропотери времени<br>
                  3. Two products — XeroCode + RoleFlow<br>
                  4. Wedge — Audit-first для обоих<br>
                  5. Architecture — общий tech стек<br>
                  6. Traction — метрики XeroCode v3<br>
                  7. Pilot results — 3 мебельных клиента<br>
                  8. Roadmap — 2026—2028<br>
                  9. Team — Vladimir + 2 инженера + advisor'ы<br>
                  10. Ask — что нужно
                  <br><br>
                  Запускаю в воркспейс <code>Documents</code>. Готова через 2 минуты.
                  <div class="src">▸ Source · Шаблон Y-Combinator deck · Q1 2026 SYLAR data</div>
                </div>
              </div>
            </div>
            <div class="chat-input">
              <div class="chat-input-box">
                <span>Опишите задачу или прикрепите файл…</span>
                <span class="send">→</span>
              </div>
            </div>
          </main>

          <aside class="chat-side">
            <h4>Модель</h4>
            <div class="model-pick active">
              <p class="nm">Claude Opus 4.7</p>
              <p class="meta"><span class="tier">Premium</span> · 200k</p>
            </div>
            <div class="model-pick">
              <p class="nm">GPT-5.4</p>
              <p class="meta"><span class="tier">Premium</span> · 1M</p>
            </div>
            <div class="model-pick">
              <p class="nm">Sonnet 4.6</p>
              <p class="meta">Standard · 200k</p>
            </div>
            <div class="model-pick">
              <p class="nm">Yandex GPT</p>
              <p class="meta">РФ · 32k</p>
            </div>
            <div class="model-pick">
              <p class="nm">GigaChat Lite</p>
              <p class="meta">РФ · Free</p>
            </div>

            <h4 style="margin-top: 22px;">Контекст</h4>
            <div class="model-pick">
              <p class="nm">+ Документ из Knowledge</p>
              <p class="meta">Прикрепить</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 04: Images ──────────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A04</span>
      <span class="screen-title">Картинки · Workspace 03</span>
      <span class="screen-tag">/images · gpt-image-2 · pollinations</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / images</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Текст</span></li>
              <li class="active"><span><span class="ico"></span>Картинки</span><span class="num">12</span></li>
              <li><span><span class="ico"></span>Код</span></li>
              <li><span><span class="ico"></span>Видео</span></li>
              <li><span><span class="ico"></span>Звук</span></li>
              <li><span><span class="ico"></span>Оркестрация</span></li>
            </ul>
          </aside>
          <main class="app-main img-ws">
            <div class="app-toolbar">
              <h2>Картинки</h2>
              <span style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; color: var(--on-bg-dim);">12 / 30 в этом месяце</span>
            </div>

            <div class="img-prompt">
              <span class="placeholder">Опиши что хочешь нарисовать…</span>
              <button class="gen-btn">Сгенерировать</button>
            </div>

            <div class="img-controls">
              <span class="img-pill active">▸ Style: editorial</span>
              <span class="img-pill">Photo</span>
              <span class="img-pill">Illustration</span>
              <span class="img-pill">3D</span>
              <span class="img-pill">▸ Size: 1024×1024</span>
              <span class="img-pill">▸ Model: gpt-image-2</span>
            </div>

            <div class="img-grid">
              <div class="img-card c1"><div class="placeholder">01</div><div class="meta">Editorial · 1024px</div></div>
              <div class="img-card c2"><div class="placeholder">02</div><div class="meta">Photo · 2K</div></div>
              <div class="img-card c3"><div class="placeholder">03</div><div class="meta">Illustration</div></div>
              <div class="img-card c4"><div class="placeholder">04</div><div class="meta">3D · Cinema</div></div>
              <div class="img-card c5"><div class="placeholder">05</div><div class="meta">Editorial</div></div>
              <div class="img-card c6"><div class="placeholder">06</div><div class="meta">Photo · 4K</div></div>
              <div class="img-card c7"><div class="placeholder">07</div><div class="meta">3D · iso</div></div>
              <div class="img-card c8"><div class="placeholder">08</div><div class="meta">Illustration</div></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 05: Code ────────────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A05</span>
      <span class="screen-title">Код · Workspace 04</span>
      <span class="screen-tag">/code · CLI · MCP · IDE</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / code</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Текст</span></li>
              <li><span><span class="ico"></span>Картинки</span></li>
              <li class="active"><span><span class="ico"></span>Код</span></li>
              <li><span><span class="ico"></span>Видео</span></li>
            </ul>
          </aside>
          <main class="app-main">
            <div class="app-toolbar">
              <h2>refactor-jwt-auth.py</h2>
              <div class="app-toolbar-right">
                <button class="btn-mini">▸ Run</button>
                <button class="btn-mini">Diff</button>
                <button class="btn-mini primary">+ Apply changes</button>
              </div>
            </div>

            <div class="code-frame">
              <div class="code-tabs">
                <span class="code-tab active">main.py</span>
                <span class="code-tab">auth.py</span>
                <span class="code-tab">config.py</span>
              </div>
              <div class="code-body">
                <div class="code-lines">
                  1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14
                </div>
                <pre class="code-content"><span class="c"># JWT authentication with refresh rotation</span>
<span class="k">from</span> <span class="f">jose</span> <span class="k">import</span> <span class="f">jwt</span>
<span class="k">from</span> <span class="f">datetime</span> <span class="k">import</span> <span class="f">datetime</span>, <span class="f">timedelta</span>

<span class="k">async def</span> <span class="f">create_token</span>(<span class="n">user_id</span>: <span class="k">str</span>):
    <span class="n">payload</span> = {
        <span class="s">"sub"</span>: <span class="n">user_id</span>,
        <span class="s">"exp"</span>: <span class="f">datetime</span>.<span class="f">utcnow</span>() + <span class="f">timedelta</span>(<span class="n">hours</span>=<span class="n">1</span>),
        <span class="s">"iat"</span>: <span class="f">datetime</span>.<span class="f">utcnow</span>(),
    }
    <span class="k">return</span> <span class="f">jwt</span>.<span class="f">encode</span>(<span class="n">payload</span>, <span class="n">SECRET_KEY</span>, <span class="n">algorithm</span>=<span class="s">"HS256"</span>)

<span class="c"># AI suggested: add token rotation on refresh</span>
<span class="c"># Click "Apply" to commit</span></pre>
              </div>
            </div>

            <div style="margin-top: 18px; padding: 14px 18px; background: var(--xero-mute); border: 1px solid var(--xero); border-radius: 10px; display: flex; gap: 14px; align-items: start;">
              <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--xero); color: var(--cream); display: flex; align-items: center; justify-content: center; font-family: var(--display); font-weight: 600; font-size: 12px; flex-shrink: 0;">AI</span>
              <div>
                <p style="font-family: var(--display); font-weight: 500; font-size: 14px; color: var(--on-bg); letter-spacing: -0.01em;">Suggestion: добавь rotation токенов</p>
                <p style="font-size: 12.5px; color: var(--on-bg-mute); margin-top: 4px;">При каждом refresh — генерировать новый pair access+refresh, инвалидировать старые. Снизит attack surface.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 06: Documents ───────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A06</span>
      <span class="screen-title">Документы · Generate &amp; preview</span>
      <span class="screen-tag">/documents · PPTX · DOCX · XLSX</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / documents</div>
      </div>
      <div class="browser-body cream-screen">
        <div class="docs-grid" style="height: 600px; background: var(--cream); color: var(--on-cream);">
          <aside class="docs-list" style="background: rgba(10,10,11,0.04); border-right-color: var(--line-cream);">
            <p class="head" style="color: var(--on-cream-dim);">Все документы</p>
            <div class="doc-row pdf">
              <span class="ico"></span>
              <div>
                <p class="nm" style="color: var(--on-cream);">SYLAR Pitch v2.pdf</p>
                <p class="meta" style="color: var(--on-cream-dim);">Сегодня · 14:32</p>
              </div>
            </div>
            <div class="doc-row pptx active" style="background: rgba(124,92,255,0.1);">
              <span class="ico"></span>
              <div>
                <p class="nm" style="color: var(--xero);">Investor Deck.pptx</p>
                <p class="meta" style="color: var(--on-cream-dim);">2 минуты назад</p>
              </div>
            </div>
            <div class="doc-row docx">
              <span class="ico"></span>
              <div>
                <p class="nm" style="color: var(--on-cream);">Roadmap 2026.docx</p>
                <p class="meta" style="color: var(--on-cream-dim);">Вчера · 18:04</p>
              </div>
            </div>
            <div class="doc-row xlsx">
              <span class="ico"></span>
              <div>
                <p class="nm" style="color: var(--on-cream);">Pricing Model.xlsx</p>
                <p class="meta" style="color: var(--on-cream-dim);">Вчера · 12:18</p>
              </div>
            </div>
            <div class="doc-row docx">
              <span class="ico"></span>
              <div>
                <p class="nm" style="color: var(--on-cream);">Customer Stories.docx</p>
                <p class="meta" style="color: var(--on-cream-dim);">3 дня · 10:32</p>
              </div>
            </div>
          </aside>
          <main class="docs-view" style="background: var(--cream); color: var(--on-cream);">
            <h1 style="color: var(--on-cream);">Investor Deck — SYLAR Group</h1>
            <p class="sub" style="color: var(--on-cream-dim); border-bottom-color: var(--line-cream);">PPTX · 10 слайдов · сгенерирован через Claude Opus 4.7 · 2 минуты назад</p>

            <h2 style="color: var(--on-cream);">Слайд 1 · Cover</h2>
            <p style="color: var(--on-cream-mute);"><strong style="color: var(--on-cream);">SYLAR Group</strong> — tech studio, building operating layers for the modern work. Two products under one umbrella.</p>

            <h2 style="color: var(--on-cream);">Слайд 2 · Problem</h2>
            <p style="color: var(--on-cream-mute);">К 2026 году у каждой крупной компании одна и та же проблема: сотрудники уже используют AI без ведома IT. Корпоративные данные утекают в публичные модели. Параллельно — каждый человек теряет 3—15 минут в день на мелкие действия.</p>

            <h2 style="color: var(--on-cream);">Слайд 3 · Two Products</h2>
            <ul style="color: var(--on-cream-mute);">
              <li><strong style="color: var(--xero);">XeroCode</strong> — AI-офис для людей и команд (1—50 seats). 8 воркспейсов, BYOK, российский стек.</li>
              <li><strong style="color: var(--sylar);">RoleFlow</strong> — Operating Layer для крупных организаций (200+ seats). Ретро-аудит + Safe AI.</li>
            </ul>

            <h2 style="color: var(--on-cream);">Слайд 4 · The Wedge</h2>
            <p style="color: var(--on-cream-mute);">Audit-first onboarding. Любой клиент начинает с измерения, не с фичи. Express Audit — бесплатный, Role Audit 100 — премиум-engagement.</p>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 07: Knowledge Base ──────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A07</span>
      <span class="screen-title">База знаний · RAG-поиск</span>
      <span class="screen-tag">/knowledge · 1С · Bitrix · Confluence</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / knowledge</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Картинки</span></li>
              <li><span><span class="ico"></span>Код</span></li>
            </ul>
            <p class="app-side-section">Инструменты</p>
            <ul>
              <li class="active"><span><span class="ico"></span>База знаний</span></li>
              <li><span><span class="ico"></span>Документы</span></li>
              <li><span><span class="ico"></span>API ключи</span></li>
            </ul>
          </aside>
          <main class="app-main">
            <div class="app-toolbar">
              <h2>База знаний</h2>
              <div class="app-toolbar-right">
                <button class="btn-mini">+ Загрузить</button>
                <button class="btn-mini">Connectors</button>
              </div>
            </div>

            <div class="kb-search">
              <span class="ico"></span>
              <span>Спроси базу знаний — что хочешь узнать?</span>
            </div>

            <p style="font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.22em; color: var(--xero); text-transform: uppercase; margin-bottom: 14px;">▸ Найдено 6 источников</p>

            <div class="kb-results">
              <div class="kb-card">
                <p class="src">▸ 1С DocFlow</p>
                <h4>Регламент онбординга 2025</h4>
                <p>Полный процесс: документы → доступы → обучение. 11 шагов, ответственные, сроки.</p>
                <p class="meta">PDF · 2.4 МБ · 14 стр</p>
              </div>
              <div class="kb-card">
                <p class="src">▸ Confluence</p>
                <h4>Архитектура SYLAR Cloud</h4>
                <p>Backend (FastAPI), data (Postgres + Redis), edge (Envoy gateway). Spec для команды.</p>
                <p class="meta">Wiki · обновлён 2 дня</p>
              </div>
              <div class="kb-card">
                <p class="src">▸ Bitrix24</p>
                <h4>Customer Story · X-Bank</h4>
                <p>Pilot Q1 2026. 540 seats. Discovery → DLP. Найдено 847 PII-инцидентов за 14 дней.</p>
                <p class="meta">Doc · 8 МБ · NDA</p>
              </div>
              <div class="kb-card">
                <p class="src">▸ Notion</p>
                <h4>Дизайн-система v3</h4>
                <p>Space Grotesk + Inter + JetBrains Mono. Sienna accent. 8 цветов воркспейсов.</p>
                <p class="meta">Page · 28 sub-pages</p>
              </div>
              <div class="kb-card">
                <p class="src">▸ SharePoint</p>
                <h4>Юр. шаблоны 2026</h4>
                <p>NDA, MSA, DPA, SLA. Под РФ-юрисдикцию. Шаблоны прошли юр-ревью.</p>
                <p class="meta">Folder · 12 файлов</p>
              </div>
              <div class="kb-card">
                <p class="src">▸ Диадок</p>
                <h4>Договор · ITM-024</h4>
                <p>Поставка RoleFlow для тестового пилота. КЭП обеих сторон. Подписан 14.04.2026.</p>
                <p class="meta">EDI · подписан</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 08: Orchestration (DAG) ─────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A08</span>
      <span class="screen-title">Оркестрация · Workspace 08</span>
      <span class="screen-tag">/orchestration · DAG · agents · MCP</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / orchestration</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Код</span></li>
              <li class="active"><span><span class="ico"></span>Оркестрация</span></li>
            </ul>
          </aside>
          <main class="app-main">
            <div class="app-toolbar">
              <h2>DAG · «Daily research → Email digest»</h2>
              <div class="app-toolbar-right">
                <button class="btn-mini">Logs</button>
                <button class="btn-mini">Версии</button>
                <button class="btn-mini primary">▸ Run</button>
              </div>
            </div>

            <div class="dag">
              <!-- Nodes -->
              <div class="node" style="top: 24px; left: 24px;">
                <p class="lab">▸ TRIGGER</p>
                <p class="nm">Cron · 09:00 MSK</p>
                <p class="meta">каждый рабочий день</p>
              </div>
              <div class="node" style="top: 24px; left: 280px;">
                <p class="lab">▸ STEP 01</p>
                <p class="nm">Web Search</p>
                <p class="meta">Perplexity · top 10</p>
              </div>
              <div class="node primary" style="top: 24px; left: 540px;">
                <p class="lab">▸ STEP 02 · AI</p>
                <p class="nm">Анализ источников</p>
                <p class="meta">Claude Opus · 4500 tok</p>
              </div>
              <div class="node" style="top: 180px; left: 280px;">
                <p class="lab">▸ STEP 03</p>
                <p class="nm">Branching</p>
                <p class="meta">if relevance ≥ 0.7</p>
              </div>
              <div class="node primary" style="top: 180px; left: 540px;">
                <p class="lab">▸ STEP 04 · AI</p>
                <p class="nm">Краткий summary</p>
                <p class="meta">GPT-5.4 · 2000 tok</p>
              </div>
              <div class="node" style="top: 320px; left: 540px;">
                <p class="lab">▸ STEP 05</p>
                <p class="nm">Email digest</p>
                <p class="meta">v.tirskikh@sylar.ru</p>
              </div>
              <div class="node" style="top: 460px; left: 280px;">
                <p class="lab">▸ STEP 06</p>
                <p class="nm">Save to Notion</p>
                <p class="meta">DB · «Daily AI digest»</p>
              </div>

              <!-- Edges -->
              <div class="edge" style="top: 50px; left: 204px; width: 76px;"></div>
              <div class="edge" style="top: 50px; left: 460px; width: 80px;"></div>
              <div class="edge" style="top: 110px; left: 380px; width: 1px; height: 70px; background: linear-gradient(180deg, transparent, var(--xero), transparent);"></div>
              <div class="edge" style="top: 206px; left: 460px; width: 80px;"></div>
              <div class="edge" style="top: 266px; left: 640px; width: 1px; height: 60px; background: linear-gradient(180deg, transparent, var(--xero), transparent);"></div>
              <div class="edge" style="top: 350px; left: 380px; width: 1px; height: 110px; background: linear-gradient(180deg, transparent, var(--xero), transparent);"></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 09: Settings ────────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A09</span>
      <span class="screen-title">Настройки · BYOK ключи</span>
      <span class="screen-tag">/settings · API keys</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / settings / api-keys</div>
      </div>
      <div class="browser-body">
        <div class="settings-grid">
          <aside class="settings-side">
            <p style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--on-bg-dim); text-transform: uppercase; margin: 0 8px 12px;">Профиль</p>
            <ul>
              <li>Аккаунт</li>
              <li>Безопасность</li>
              <li>Уведомления</li>
              <li>Интеграции</li>
            </ul>
            <p style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--on-bg-dim); text-transform: uppercase; margin: 18px 8px 12px;">AI</p>
            <ul>
              <li class="active">API ключи (BYOK)</li>
              <li>Модели по умолчанию</li>
              <li>Лимиты</li>
              <li>История запросов</li>
            </ul>
            <p style="font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--on-bg-dim); text-transform: uppercase; margin: 18px 8px 12px;">Биллинг</p>
            <ul>
              <li>Тариф</li>
              <li>Платежи</li>
              <li>Документы</li>
            </ul>
          </aside>
          <main class="settings-main">
            <h1>API ключи · BYOK</h1>
            <p class="sub">Подключите свои ключи AI-провайдеров — XeroCode будет использовать их вместо платформенного баланса. На любом тарифе BYOK = ∞ запросов.</p>

            <div class="settings-row">
              <div class="info">
                <h3>OpenAI</h3>
                <p>API ключ для GPT-5.4, o1, gpt-image-2. Используется на запросах к OpenAI-моделям.</p>
                <p class="meta">▸ ИСПОЛЬЗОВАНИЕ · 4 280 запросов / 30 дней</p>
              </div>
              <div class="api-key">
                <span class="nm">sk-proj-••••••••••••••••8cZ4</span>
                <span class="stat">● Активен</span>
              </div>
            </div>

            <div class="settings-row">
              <div class="info">
                <h3>Anthropic</h3>
                <p>API ключ для Claude Opus 4.7, Sonnet 4.6, Haiku. Лучшие модели для длинных задач.</p>
                <p class="meta">▸ ИСПОЛЬЗОВАНИЕ · 1 894 запроса / 30 дней</p>
              </div>
              <div class="api-key">
                <span class="nm">sk-ant-••••••••••••••••K1pQ</span>
                <span class="stat">● Активен</span>
              </div>
            </div>

            <div class="settings-row">
              <div class="info">
                <h3>Yandex GPT</h3>
                <p>Российский AI-провайдер. Подходит для контента на русском, аналитики, работы с РФ-данными.</p>
                <p class="meta">▸ Не настроен</p>
              </div>
              <button class="btn-mini">+ Подключить</button>
            </div>

            <div class="settings-row">
              <div class="info">
                <h3>GigaChat (Сбер)</h3>
                <p>Российский AI-провайдер. Бесплатный tier для разработки. ФЗ-152 уровень 1.</p>
                <p class="meta">▸ Не настроен</p>
              </div>
              <button class="btn-mini">+ Подключить</button>
            </div>

            <div class="settings-row">
              <div class="info">
                <h3>OpenRouter</h3>
                <p>Универсальный шлюз к 200+ моделям через один ключ. Удобно для тестирования новых моделей.</p>
                <p class="meta">▸ ИСПОЛЬЗОВАНИЕ · 38 запросов / 30 дней</p>
              </div>
              <div class="api-key">
                <span class="nm">sk-or-••••••••••••••••mP2x</span>
                <span class="stat">● Активен</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 10: Mobile Telegram bot ─────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A10</span>
      <span class="screen-title">Telegram-бот · Mobile-first</span>
      <span class="screen-tag">@xerocode_bot · iOS · Android</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">t.me / xerocode_bot</div>
      </div>
      <div class="browser-body" style="padding: 60px 20px; display: flex; justify-content: center;">
        <div class="tg-frame">
          <div class="tg-bar">
            <div class="av">XC</div>
            <div>
              <div class="nm">XeroCode AI</div>
              <div class="stat">● online · печатает</div>
            </div>
          </div>
          <div class="tg-msgs">
            <div class="tg-msg bot">Привет! Что генерируем сегодня? 💬</div>
            <div class="tg-msg me">Напиши follow-up клиенту, который не ответил на КП 5 дней</div>
            <div class="tg-msg bot">
              Готово. Тон — вежливо-настойчивый, без давления:
              <br><br>
              «Здравствуйте, [Имя]! Хотел уточнить — было ли время посмотреть наше предложение от 6 мая? Готов ответить на любые вопросы или назначить созвон в удобное время. С уважением.»
            </div>
            <div class="tg-msg me">Сделай посерьёзнее</div>
            <div class="tg-msg bot">Понял, более деловой тон:</div>
            <div class="tg-msg bot">
              «Здравствуйте, [Имя]. Возвращаюсь к нашему коммерческому предложению от 6 мая. Решение принимается в&nbsp;ближайшие дни? Если есть вопросы или нужны корректировки по составу — готов обсудить...»
            </div>
          </div>
          <div class="tg-input">
            <div class="field">Сообщение…</div>
            <div class="send">→</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 11: Onboarding ──────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A11</span>
      <span class="screen-title">Onboarding · Step 02 of 04</span>
      <span class="screen-tag">/onboarding · first time user</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / onboarding</div>
      </div>
      <div class="browser-body" style="padding: 60px 56px;">
        <!-- Progress -->
        <div style="display: flex; gap: 8px; margin-bottom: 60px;">
          <span style="flex: 1; height: 3px; background: var(--xero); border-radius: 2px;"></span>
          <span style="flex: 1; height: 3px; background: var(--xero); border-radius: 2px;"></span>
          <span style="flex: 1; height: 3px; background: var(--line-bg-strong); border-radius: 2px;"></span>
          <span style="flex: 1; height: 3px; background: var(--line-bg-strong); border-radius: 2px;"></span>
        </div>

        <p style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; color: var(--xero); text-transform: uppercase; margin-bottom: 18px;">▸ Шаг 2 из 4 · 30 секунд</p>
        <h1 style="font-family: var(--display); font-weight: 500; font-size: clamp(36px, 4.5vw, 64px); line-height: 1; letter-spacing: -0.03em; color: var(--on-bg); margin-bottom: 18px; max-width: 800px;">
          Какие воркспейсы<br>тебе нужны?
        </h1>
        <p style="font-size: 16.5px; color: var(--on-bg-mute); max-width: 540px; margin-bottom: 48px;">Выбери 2—3 главных. Остальные доступны в любой момент. Это поможет настроить интерфейс под твой workflow.</p>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 1100px;">
          <div style="background: var(--xero-mute); border: 1px solid var(--xero); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-chat); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Чат</p>
            <p style="font-family: var(--mono); font-size: 9.5px; color: var(--xero); letter-spacing: 0.18em;">▸ ВЫБРАНО</p>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-text); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Текст</p>
            <p style="font-size: 12px; color: var(--on-bg-mute);">Длинные документы</p>
          </div>
          <div style="background: var(--xero-mute); border: 1px solid var(--xero); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-images); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Картинки</p>
            <p style="font-family: var(--mono); font-size: 9.5px; color: var(--xero); letter-spacing: 0.18em;">▸ ВЫБРАНО</p>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-code); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Код</p>
            <p style="font-size: 12px; color: var(--on-bg-mute);">CLI · MCP · IDE</p>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-video); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Видео</p>
            <p style="font-size: 12px; color: var(--on-bg-mute);">Sora · Runway · Veo</p>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-sound); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Звук</p>
            <p style="font-size: 12px; color: var(--on-bg-mute);">Suno · ElevenLabs</p>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-corp); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Корпоратив</p>
            <p style="font-size: 12px; color: var(--on-bg-mute);">CRM · HR · Kanban</p>
          </div>
          <div style="background: var(--xero-mute); border: 1px solid var(--xero); border-radius: 12px; padding: 22px 18px; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: var(--ws-orchestr); border-radius: 8px; margin-bottom: 14px;"></div>
            <p style="font-family: var(--display); font-weight: 500; font-size: 17px; color: var(--on-bg); margin-bottom: 4px;">Оркестрация</p>
            <p style="font-family: var(--mono); font-size: 9.5px; color: var(--xero); letter-spacing: 0.18em;">▸ ВЫБРАНО</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 56px;">
          <button style="padding: 14px 28px; background: transparent; color: var(--on-bg); border: 1px solid var(--line-bg-strong); border-radius: 999px; font-size: 13px; font-weight: 500;">← Назад</button>
          <p style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; color: var(--on-bg-dim); text-transform: uppercase;">Выбрано 3 из 8</p>
          <button style="padding: 14px 28px; background: var(--xero); color: var(--cream); border: none; border-radius: 999px; font-size: 13px; font-weight: 500;">Дальше →</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SCREEN 12: Empty state ─────────────────────────────────────── -->
<section class="section">
  <div class="reveal screen-wrap">
    <div class="screen-meta">
      <span class="screen-num">▸ A12</span>
      <span class="screen-title">Empty state · Шаблоны для старта</span>
      <span class="screen-tag">/templates · first task</span>
    </div>
    <div class="browser">
      <div class="browser-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="url">app.xerocode.ru / new</div>
      </div>
      <div class="browser-body">
        <div class="app-layout">
          <aside class="app-side">
            <div class="app-side-brand">XeroCode<span class="dot"></span></div>
            <p class="app-side-section">Воркспейсы</p>
            <ul>
              <li><span><span class="ico"></span>Чат</span></li>
              <li><span><span class="ico"></span>Текст</span></li>
              <li><span><span class="ico"></span>Картинки</span></li>
              <li><span><span class="ico"></span>Код</span></li>
            </ul>
          </aside>
          <main class="app-main" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px;">
            <p style="font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; color: var(--xero); text-transform: uppercase; margin-bottom: 18px;">▸ С чего начать</p>
            <h1 style="font-family: var(--display); font-weight: 500; font-size: 44px; line-height: 1; letter-spacing: -0.03em; color: var(--on-bg); margin-bottom: 14px; text-align: center;">Что сегодня делаем?</h1>
            <p style="font-size: 16px; color: var(--on-bg-mute); max-width: 460px; text-align: center; margin-bottom: 48px;">Опиши задачу или выбери шаблон. AI подберёт правильный воркспейс и&nbsp;модель.</p>

            <div style="background: var(--bg-soft); border: 1px solid var(--line-bg-strong); border-radius: 14px; padding: 18px 22px; display: flex; gap: 14px; align-items: center; width: 100%; max-width: 720px; margin-bottom: 32px;">
              <span style="flex: 1; font-size: 14px; color: var(--on-bg-dim);">Что-то типа: «Сделай follow-up клиенту, который не ответил 5 дней»</span>
              <button style="padding: 10px 20px; background: var(--xero); color: var(--cream); border: none; border-radius: 999px; font-size: 13px; font-weight: 500;">→</button>
            </div>

            <p style="font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.22em; color: var(--on-bg-dim); text-transform: uppercase; margin-bottom: 18px;">▸ ИЛИ ШАБЛОН</p>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; max-width: 720px;">
              <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 10px; padding: 16px; cursor: pointer;">
                <div style="width: 24px; height: 24px; background: var(--ws-text); border-radius: 6px; margin-bottom: 10px;"></div>
                <p style="font-family: var(--display); font-weight: 500; font-size: 14px; color: var(--on-bg); margin-bottom: 4px;">Email клиенту</p>
                <p style="font-family: var(--mono); font-size: 9.5px; color: var(--on-bg-dim); letter-spacing: 0.15em;">5 секунд</p>
              </div>
              <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 10px; padding: 16px; cursor: pointer;">
                <div style="width: 24px; height: 24px; background: var(--ws-images); border-radius: 6px; margin-bottom: 10px;"></div>
                <p style="font-family: var(--display); font-weight: 500; font-size: 14px; color: var(--on-bg); margin-bottom: 4px;">Баннер для соц. сетей</p>
                <p style="font-family: var(--mono); font-size: 9.5px; color: var(--on-bg-dim); letter-spacing: 0.15em;">30 секунд</p>
              </div>
              <div style="background: var(--bg-soft); border: 1px solid var(--line-bg); border-radius: 10px; padding: 16px; cursor: pointer;">
                <div style="width: 24px; height: 24px; background: var(--ws-corp); border-radius: 6px; margin-bottom: 10px;"></div>
                <p style="font-family: var(--display); font-weight: 500; font-size: 14px; color: var(--on-bg); margin-bottom: 4px;">Отчёт за неделю</p>
                <p style="font-family: var(--mono); font-size: 9.5px; color: var(--on-bg-dim); letter-spacing: 0.15em;">2 минуты</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  PART IV — DESIGN SYSTEM                                     ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<section class="part" id="system">
  <p class="part-num">PART IV — Design system</p>
  <h2 class="part-name">Дизайн-система.<br><span class="accent">Tokens · принципы.</span></h2>
  <p class="part-desc">Те же токены и принципы что у RoleFlow и SYLAR. Различия — только в основном акценте (Violet против Sienna) и цветовой кодировке воркспейсов. Технический стек идентичен.</p>
</section>

<!-- Principles ─────────────────────────────────────────────────── -->
<section class="section cream">
  <div class="reveal">
    <p class="section-num" style="color: var(--xero);">04 — Принципы</p>
    <div class="section-head">
      <h2 class="section-title">Что разрешено.<br>Что запрещено.</h2>
      <p class="section-sub">Дизайн-система XeroCode унаследует все принципы SYLAR-DNA. Здесь зафиксировано что мы делаем и&nbsp;что нет — чтобы продукт оставался узнаваемым на любом экране.</p>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
    <div style="background: var(--cream-warm); border: 1px solid var(--line-cream-strong); border-left: 3px solid #10B981; border-radius: 10px; padding: 32px;">
      <p style="font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.22em; color: #10B981; text-transform: uppercase; font-weight: 600; margin-bottom: 18px;">▸ Разрешено</p>
      <ul style="list-style: none; font-size: 14.5px; color: var(--on-cream); line-height: 1.8;">
        <li style="padding: 6px 0;">+ Space Grotesk display, Inter body, JetBrains Mono technical</li>
        <li style="padding: 6px 0;">+ Carbon #0A0A0B и Cream #F4EFE3 как surfaces</li>
        <li style="padding: 6px 0;">+ Violet #7C5CFF как primary accent (CTAs, links)</li>
        <li style="padding: 6px 0;">+ Sienna #D4654A как DNA-маркер связи с SYLAR</li>
        <li style="padding: 6px 0;">+ 8 цветов воркспейсов — только в badge, ico, dots</li>
        <li style="padding: 6px 0;">+ Browser-frame для product screenshots</li>
        <li style="padding: 6px 0;">+ Karaoke scroll-reveal в hero-секциях</li>
        <li style="padding: 6px 0;">+ Magnetic CTA на hover</li>
        <li style="padding: 6px 0;">+ Hairlines 1px, минимум shadow</li>
        <li style="padding: 6px 0;">+ Inline-icons в потоке текста</li>
      </ul>
    </div>

    <div style="background: rgba(166,59,50,0.04); border: 1px solid rgba(166,59,50,0.25); border-left: 3px solid #C84830; border-radius: 10px; padding: 32px;">
      <p style="font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.22em; color: #C84830; text-transform: uppercase; font-weight: 600; margin-bottom: 18px;">⊘ Запрещено</p>
      <ul style="list-style: none; font-size: 14.5px; color: var(--on-cream); line-height: 1.8;">
        <li style="padding: 6px 0;">✕ Italic emphasis (никаких курсивов в основном тексте)</li>
        <li style="padding: 6px 0;">✕ Serif шрифты (нет Newsreader, Tiempos, Söhne)</li>
        <li style="padding: 6px 0;">✕ Editorial chrome (page numbers, ⌘ символы, римские цифры)</li>
        <li style="padding: 6px 0;">✕ Gradient backgrounds на больших площадях</li>
        <li style="padding: 6px 0;">✕ Glassmorphism, neon, glow effects</li>
        <li style="padding: 6px 0;">✕ 3D blobs, particles, AI-meshes</li>
        <li style="padding: 6px 0;">✕ Cyberpunk эстетика</li>
        <li style="padding: 6px 0;">✕ «AI-powered», «next-gen», «революционно» в копии</li>
        <li style="padding: 6px 0;">✕ Smiling team photos, AI robots, holograms</li>
        <li style="padding: 6px 0;">✕ Loading spinners больше 200ms</li>
      </ul>
    </div>
  </div>
</section>

<!-- ╔══════════════════════════════════════════════════════════════╗
     ║  FOOTER                                                      ║
     ╚══════════════════════════════════════════════════════════════╝ -->
<footer class="footer">
  <div class="footer-wordmark">XeroCode<span class="dot"></span></div>
  <div class="footer-bottom">
    <span>© XeroCode · SYLAR · MMXXVI</span>
    <span>v 3.0 · Full Design System</span>
    <span>Forged by SYL4R</span>
  </div>
</footer>`;
