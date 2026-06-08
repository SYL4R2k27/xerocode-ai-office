# A08 · Оркестрация (DAG) — `/orchestration`

> Workspace 08 · цвет воркспейса **sienna `--ws-orchestr #D4654A`** (только в badge/иконке/точке навигации — НЕ в крупных плашках).
> Внутри канваса **primary-акцент = violet `--xero #7C5CFF`**: AI-ноды, рёбра, активные состояния, grid-фон.
> Источник правды: `XEROCODE_FULL.html` строки 2422–2508; CSS-классы `.dag / .node / .node.primary / .edge` — `xerocode-v3.css` строки 1417–1468; каркас `app-layout` — строки 532–647.
> No-code визуальный билдер агентных пайплайнов: DAG-сценарии, агенты, MCP-server, parallel chains.

---

## Назначение

Экран `/orchestration` — **визуальный no-code конструктор автоматизаций** (DAG = directed acyclic graph). Пользователь собирает многошаговый сценарий из нод (триггеры, действия, AI-шаги, ветвления, интеграции), соединяет их рёбрами, настраивает каждую ноду в боковой панели и запускает — вручную (`▸ Run`) или по расписанию (Cron-триггер).

Цель воркспейса в логике продукта («чтобы один человек сделал работу пятерых»): **то, что в чате делается вручную в 6 сообщений, здесь делается один раз и крутится по расписанию само**. Эталонный сценарий мокапа — `DAG · «Daily research → Email digest»`: каждый рабочий день в 09:00 MSK система ищет в вебе, прогоняет источники через Claude Opus, фильтрует по релевантности, делает summary через GPT-5.4, шлёт email-дайджест и сохраняет в Notion. Человек не участвует.

Ключевые отличия от других воркспейсов:
- единственный экран с **позиционированным канвасом** (ноды на абсолютных координатах, не поток);
- **AI-ноды (primary)** — те самые «агенты», которые вызывают модели с конкретным `tokens budget`; визуально выделены violet;
- **MCP-интеграция** — ноды-действия (`Web Search`, `Email digest`, `Save to Notion`) — это вызовы MCP-серверов / коннекторов (общая инфраструктура с Базой знаний A07);
- редактирование — **desktop-only** (см. «Адаптив»); мобайл = просмотр + запуск.

---

## Доступ

- **Тариф.** Доступен на **Pro и Enterprise**. В отличие от Корпората (07, только Enterprise), Оркестрация — часть solo-предложения: один человек автоматизирует свою рутину. ⟶ *ПРЕДЛОЖЕНИЕ: на Free — режим «только чтение шаблонов» (можно открыть готовый DAG, нельзя запустить/сохранить), с upgrade-CTA «Оркестрация доступна на Pro».*
- **Org-isolation (правило проекта №7).** Каждый DAG, каждый run-лог, каждая версия привязаны к `organization_id`. Любой fetch по `id` (открыть DAG, открыть лог, открыть версию) обязан проверять org. Триггеры/расписания исполняются от имени организации, не пользователя.
- **BYOK (правило №6).** AI-ноды используют ключи провайдеров из A09 (BYOK). Если у ноды модель `Claude Opus`, а у организации нет активного ключа Anthropic → нода в состоянии «не настроена» (warn-бейдж), Run блокируется до подключения ключа. Все вызовы — через прокси (`use_proxy = bool(proxy)`).
- **Роли (до 50 seats).** *ПРЕДЛОЖЕНИЕ:* `viewer` — смотрит канвас и логи; `editor` — правит ноды/рёбра; `runner` — может запускать вручную; `owner` DAG — может публиковать версию и менять расписание. Расписание, которое тратит токены команды, должен включать только `owner`/admin.

---

## Раскладка

`app-layout` = `grid-template-columns: 220px 1fr` (sidebar · main). Внутри `app-main` — `app-toolbar` (имя сценария + кнопки) и `.dag` (канвас, `min-height: 520px`, carbon-фон с violet-grid 24×24px). При выборе ноды справа выезжает **node-config-panel** (ПРЕДЛОЖЕНИЕ), сужая канвас.

### ASCII — экран целиком (desktop ≥1280)

```
┌────────────┬─────────────────────────────────────────────────────────────┐
│ app-side   │ app-toolbar                                                   │
│ 220px      │  DAG · «Daily research → Email digest»   [Logs][Версии][▸Run] │
│ bg-soft    ├─────────────────────────────────────────────────────────────┤
│            │ .dag  canvas — carbon + violet-grid 24×24, radius 12          │
│ XeroCode●  │                                                               │
│            │  ┌──────────┐  →   ┌──────────┐  →   ┌══════════┐  ◀ primary  │
│ ВОРКСПЕЙСЫ │  │▸ TRIGGER │      │▸ STEP 01 │      ║▸ STEP 02·AI║   (violet) │
│ ▪ Чат      │  │Cron      │      │Web Search│      ║Анализ     ║            │
│ ▪ Код      │  │09:00 MSK │      │Perplexity│      ║источников ║            │
│ ▸ Оркестр. │  │раб. день │      │top 10    │      ║Opus·4500t ║            │
│   (active, │  └──────────┘      └────┬─────┘      └══════════╝            │
│    sienna) │                         │ (vert. edge, violet-grad ↓)         │
│            │                    ┌────┴─────┐  →   ┌══════════╗            │
│            │                    │▸ STEP 03 │      ║▸ STEP 04·AI║            │
│            │                    │Branching │      ║Краткий     ║            │
│            │                    │if rel≥0.7│      ║summary     ║            │
│ ──────────  │                    └──────────┘      ║GPT-5.4·2000║            │
│ ИНСТРУМЕНТЫ │                                       └────┬═════╝            │
│ База знаний │                                            │ (vert ↓)         │
│ Документы   │                                       ┌────┴─────┐           │
│ API-ключи   │                                       │▸ STEP 05 │           │
│ Настройки   │                                       │Email     │           │
│            │                              ┌─────────┤digest    │           │
│ ──────────  │                    ┌─────────┴┐ (vert) └──────────┘           │
│ [V] Vladimir│                    │▸ STEP 06 │                              │
│  Pro ⭐     │                    │Save→Notion│                             │
│            │                    └──────────┘                              │
└────────────┴─────────────────────────────────────────────────────────────┘
```

### ASCII — координатная сетка нод (как в мокапе, `top/left` в px относительно `.dag` content-box)

```
        left:24       left:280        left:540
top:24  [TRIGGER]──76──[STEP 01]──80──[STEP 02·AI]★
                          │ vert (left:380, h70)
top:180                 [STEP 03]──80──[STEP 04·AI]★
                                         │ vert (left:640, h60)
top:320                                [STEP 05]
                          │ vert (left:380, h110, от 350)
top:460                 [STEP 06]

★ = .node.primary (AI, violet border + xero-mute fill)
── = горизонтальное ребро (.edge, 1px, linear-gradient 90deg violet)
 │ = вертикальное ребро (1px, linear-gradient 180deg violet, без стрелки)
```

Точные значения рёбер из мокапа (px):
| edge | ориент. | top | left | width | height | назначение |
|---|---|---|---|---|---|---|
| e1 | гориз | 50 | 204 | 76 | 1 | TRIGGER → STEP 01 |
| e2 | гориз | 50 | 460 | 80 | 1 | STEP 01 → STEP 02·AI |
| e3 | верт | 110 | 380 | 1 | 70 | STEP 01 → STEP 03 (вниз) |
| e4 | гориз | 206 | 460 | 80 | 1 | STEP 03 → STEP 04·AI |
| e5 | верт | 266 | 640 | 1 | 60 | STEP 04·AI → STEP 05 (вниз) |
| e6 | верт | 350 | 380 | 1 | 110 | STEP 05/STEP 03-зона → STEP 06 (вниз) |

> Горизонтальные рёбра имеют `::after` стрелку `→` (violet, 14px, right:-2px top:-10px). Вертикальные — чистый градиент 180deg `transparent → --xero → transparent`, **без** стрелки (в мокапе для них переопределён inline-`background`, поэтому `::after` визуально не читается как направление — *ПРЕДЛОЖЕНИЕ: добавить вертикальным рёбрам собственный маркер `↓`*).

---

## Регионы и компоненты

### 1. `app-side` — сайдбар (220px, существующий примитив)

`background: var(--bg-soft)`, `padding: 24px 14px`, `border-right: 1px solid var(--line-bg)`, `font-size: 13.5px`.

| Элемент | Спецификация |
|---|---|
| `.app-side-brand` | «XeroCode» + `.dot` 7px (`background: var(--xero)`, radius 50%). Шрифт `--display` 600, 18px, tracking −0.02em. |
| `.app-side-section` «Воркспейсы» | `--mono` 9.5px, tracking 0.2em, UPPERCASE, цвет `--on-bg-dim`. |
| `li` обычный | padding 8px 12px, цвет `--on-bg-mute`, radius 6px. Иконка `.ico` 16px (lucide, см. ниже), `opacity .5`. Hover: `background: rgba(244,239,227,0.05)`, цвет `--on-bg`. |
| `li.active` «Оркестрация» | `background: var(--xero-mute)`, цвет `--xero`; `.ico` → `background: var(--xero)`, `opacity:1`. ⚠️ **Расхождение бренда:** active в общем `app-side` подсвечен **violet**, но цвет воркспейса 08 — **sienna**. *ПРЕДЛОЖЕНИЕ: для строки «Оркестрация» использовать sienna-вариант active (`--ws-orchestr` фон-mute + текст), чтобы цвет воркспейса читался в навигации. Решить централизованно для всех 8 (см. «Открытые вопросы»).* |
| Иконка воркспейса | lucide **`Workflow`** (или `Network` / `GitBranch`) в цвете воркспейса sienna. |
| Секция «Инструменты» | База знаний (`Database`), Документы (`FileText`), API-ключи (`KeyRound`), Настройки (`Settings`). |
| `.app-side-footer` | `margin-top:auto`, `border-top: 1px solid var(--line-bg)`. Аватар `.av` 28px (gradient `--xero → --xero-soft`, текст `--cream`, `--display` 600 12px) + «Vladimir T.» + `.role` «Pro ⭐» (`--mono` 9.5px, tracking 0.15em, UPPERCASE, `--on-bg-dim`). |

### 2. `app-toolbar` — шапка сценария (существующий примитив)

`display:flex; justify-content:space-between; margin-bottom:22px`.

| Элемент | Спецификация |
|---|---|
| `h2` имя сценария | `«DAG · „Daily research → Email digest"»`. Шрифт `--display` 500, 24px, tracking −0.02em, цвет `--on-bg`. *ПРЕДЛОЖЕНИЕ: префикс `DAG ·` рендерить как mono-eyebrow (`--mono`, `--on-bg-dim`), само имя — display; рядом маленький статус-дот (idle/scheduled/running/error).* Клик по имени → inline-rename (см. «Поведение»). |
| `.app-toolbar-right` | `gap:8px`, три `.btn-mini`. |
| `.btn-mini` **Logs** | ghost: `--mono` 10.5px, tracking 0.12em, UPPERCASE, border `--line-bg`, transparent, цвет `--on-bg-mute`, radius 6px. lucide **`ScrollText`** 12px слева. Hover: border `--xero`, цвет `--on-bg`. |
| `.btn-mini` **Версии** | ghost (как выше). lucide **`History`** или **`GitCommitVertical`**. |
| `.btn-mini.primary` **▸ Run** | `background: var(--xero)`, border `--xero`, цвет `--cream`. Маркер `▸` — часть лейбла (либо lucide **`Play`** 12px). Это главное действие экрана. *ПРЕДЛОЖЕНИЕ: во время выполнения превращается в **«■ Стоп»** (lucide `Square`), при ошибке — рядом «Повторить» (`RotateCcw`).* |

*ПРЕДЛОЖЕНИЕ (доп. кнопки toolbar справа от имени, ghost-mini):* **`+ Нода`** (`Plus`, открывает node-palette), **Auto-layout** (`LayoutGrid` — переразложить граф), **Сохранить** (`Save` или авто-сейв со статусом «Сохранено» в `--on-bg-dim`), overflow-меню `⋯` (`MoreHorizontal`: Дублировать, Экспорт JSON, Удалить DAG, Поделиться).

### 3. `.dag` — канвас (существующий примитив)

`background: var(--bg)`, `border: 1px solid var(--line-bg)`, `border-radius: 12px`, `padding: 32px`, `position: relative`, `min-height: 520px`. **Grid-фон:** два `linear-gradient` 1px `rgba(124,92,255,0.04)` (violet 4%-альфа), `background-size: 24px 24px` — «миллиметровка» для выравнивания нод. `overflow:hidden` у родителя `app-main`.

*ПРЕДЛОЖЕНИЕ:* канвас оборачивает viewport с **zoom/pan** (см. «Поведение»); grid-фон должен масштабироваться вместе с zoom; в правом-нижнем углу — **mini-map** (ПРЕДЛОЖЕНИЕ) и **zoom-controls** (`Plus`/`Minus`/`Maximize` «fit to screen», `--mono` подпись «100%»).

### 4. `.node` — нода (три варианта)

Базовая `.node`: `position:absolute`, `background: var(--bg-soft)`, `border: 1px solid var(--line-bg-strong)`, `border-radius: 10px`, `padding: 14px 18px`, `min-width: 180px`, `--mono` 11.5px, `z-index: 2`.

| Под-элемент | Токены / шрифт |
|---|---|
| `.lab` (лейбл `▸ TRIGGER` / `▸ STEP NN` / `▸ STEP NN · AI`) | `--mono` 9px, tracking 0.22em, UPPERCASE, weight 600, цвет `--xero`, margin-bottom 6px. Маркер `▸` — часть текста. |
| `.nm` (название: «Web Search», «Анализ источников») | `--display` 500, 14px, tracking −0.01em, цвет `--on-bg`. |
| `.meta` (детали: «Perplexity · top 10», «Claude Opus · 4500 tok») | `--mono` 9.5px, tracking 0.05em, цвет `--on-bg-dim`, margin-top 4px. |

**Три типа (как в мокапе):**

| Тип | Класс | Визуал | Когда |
|---|---|---|---|
| **Trigger** | `.node` (+ `.node--trigger` ПРЕДЛОЖЕНИЕ) | base bg-soft. lab `▸ TRIGGER`. *ПРЕДЛОЖЕНИЕ: левая акцент-полоса 2px sienna `--ws-orchestr` — отличить «вход» пайплайна.* lucide **`Clock`** (Cron) / `Webhook` / `Hand` (manual). | Старт DAG: Cron, Webhook, Manual, File-drop, Email-in. |
| **Action (обычная)** | `.node` | base: bg-soft, border `--line-bg-strong`. lab `▸ STEP NN`. Иконка по типу действия. | Web Search, Branching, Email, Save to Notion — не-AI шаги. |
| **AI (primary)** | `.node.primary` | `border-color: var(--xero)`, `background: var(--xero-mute)`. lab `▸ STEP NN · AI`. lucide **`Sparkles`** или `Bot` (агент). meta показывает модель + бюджет токенов. | Любой вызов модели: «Анализ источников» (Opus·4500), «Краткий summary» (GPT-5.4·2000). |

**Анатомия ноды (ПРЕДЛОЖЕНИЕ, сверх мокапа):**
- **Порты соединения** — точки 8px по краям (вход слева/сверху, выход справа/снизу). Hover → подсветка `--xero`; drag из выходного порта тянет ребро.
- **Бейдж типа** в углу — иконка lucide на `--bg-tile` чипе 18px.
- **Статус-дот** (правый-верхний угол) при выполнении: idle (нет) / `Loader` spin `--xero` (running, ≤200ms-rule: pulse, не спиннер) / `Check` `--ws code green #10B981` (done) / `X` red (error) / `Pause` (paused).
- **Кнопки при hover** (top-right): `Copy` (дублировать), `Settings2` (конфиг), `Trash2` (удалить) — `--on-bg-dim`, hover `--on-bg`.
- **Branching-нода** имеет **два именованных выхода**: `true` (зелёный порт) / `false` (`--on-bg-dim` порт) — рёбра расходятся (см. состояние «ветвление»).

### 5. `.edge` — ребро

`position:absolute`, `height:1px`, `z-index:1`. Горизонтальное: `background: linear-gradient(90deg, transparent, var(--xero), transparent)` + `::after` стрелка `→` (`--xero`, 14px). Вертикальное: inline `linear-gradient(180deg, transparent, var(--xero), transparent)`, без видимой стрелки.

*ПРЕДЛОЖЕНИЕ (продакшн):* заменить div-рёбра на **SVG-пути с bezier-кривыми** (orthogonal/step-routing), чтобы рёбра гнулись вокруг нод и пересчитывались при drag. Состояния ребра: idle (violet-grad 1px) · active-во-время-run (анимированный «бегущий» градиент / dash-offset, ≤300ms цикл) · done (статичный `--xero` 1px solid) · отключённое (`--on-bg-dim` пунктир) · ветка-false (`--on-bg-dim`). Стрелка-маркер `→`/`↓` в lucide-стиле (`ChevronRight`/`ChevronDown` или `ArrowRight`).

### 6. **node-config-panel** — конфиг-панель ноды при выборе (ПРЕДЛОЖЕНИЕ)

Выезжает справа поверх/рядом канваса при выборе ноды (drawer 320–360px, `background: var(--bg-soft)`, `border-left: 1px solid var(--line-bg)`, slide-in 200ms `--ease`). Канвас при этом ужимается (или панель плывёт оверлеем на <1440).

Структура:
| Зона | Содержимое | Токены |
|---|---|---|
| Шапка | Иконка типа (lucide) + редактируемое имя (`--display` 500 16px) + close `X`. Под ним `.lab`-стиль mono-тег типа ноды. | `--mono` 9px tracking 0.22em `--xero`. |
| Секция «Тип» | Дропдаун сменить тип (только в рамках совместимых). | поля на `--bg-tile`, border `--line-bg`, radius 8px. |
| Секция «Параметры» | Зависит от типа (см. ниже). Лейблы — `--mono` 10px UPPERCASE `--on-bg-dim`; инпуты — `--body` 14px `--on-bg`. | radius 8px, focus-border `--xero`. |
| Секция «Соединения» | Входы/выходы ноды, к каким нодам ведут. | список с lucide `ArrowRight`. |
| Футер | «Тест ноды» (`Play`, ghost — прогнать одну ноду) · «Удалить» (`Trash2`, red-text). | `.btn-mini`. |

**Параметры по типу ноды:**
- **Cron-trigger:** поле расписания (визуальный пикер «каждый рабочий день · 09:00» + raw cron `0 9 * * 1-5`), таймзона (`MSK` дефолт, dropdown), вкл/выкл расписания (toggle). lucide `Clock`, `Globe`.
- **Web Search:** провайдер (Perplexity / Tavily / SerpAPI — dropdown), запрос (textarea с подстановкой переменных `{{prev.output}}`), кол-во результатов (`top 10`, slider/number). lucide `Search`.
- **AI-нода (агент):** **модель** (dropdown 14 моделей, сгруппированы Premium/Standard/РФ — переиспользует model-picker из чата A03), **system/prompt** (textarea, `--mono` для prompt), **max tokens** (number, «4500 tok» — с предупреждением о бюджете), temperature (slider), **вход** (что подаётся: output предыдущей ноды), **выход** (имя переменной для следующих нод). Бейдж стоимости *ПРЕДЛОЖЕНИЕ: оценка «~4500 tok ≈ ₽X» по тарифам провайдера*. lucide `Sparkles`, `Bot`, `Coins`.
- **Branching:** условие (builder: `relevance ≥ 0.7`, поле/оператор/значение), два выхода `true`/`false`. lucide `GitBranch`, `Split`.
- **Email digest:** получатель(и) (`v.tirskikh@sylar.ru`), шаблон письма (textarea с переменными), тема. lucide `Mail`.
- **Save to Notion (MCP-action):** коннектор (Notion — выбор из подключённых MCP, общий список с A07), целевая БД («Daily AI digest»), маппинг полей. lucide `Database`, `Plug`.

### 7. **node-palette** — палитра доступных нод (ПРЕДЛОЖЕНИЕ)

Открывается по `+ Нода` (toolbar) или drag-from-rail. Формат: **командное меню** (overlay по центру, `⌘K`-стиль) ИЛИ левый под-rail внутри main. Поиск сверху + категории-аккордеоны. Карточка ноды: lucide-иконка + название + краткое описание (`--on-bg-mute`). Drag карточки на канвас → создаётся нода в точке дропа.

Категории и состав:
| Категория | Ноды (lucide) |
|---|---|
| **Триггеры** | Cron/Расписание (`Clock`), Webhook (`Webhook`), Вручную (`Hand`/`MousePointerClick`), Новый файл (`FilePlus`), Входящий email (`MailOpen`), Telegram-сообщение (`Send`) |
| **AI / Агенты** (primary) | Запрос к модели (`Sparkles`), Агент с инструментами (`Bot`), Классификатор (`Tags`), Извлечение данных (`ScanText`), RAG-запрос к Базе знаний (`Database`) |
| **Логика** | Ветвление/if (`GitBranch`), Цикл/foreach (`Repeat` — *с защитой от циклов, см. edge cases*), Параллельно (`GitFork` — parallel chains), Слияние (`Merge`), Задержка (`Timer`), Фильтр (`Filter`) |
| **Веб / Данные** | Web Search (`Search`), HTTP-запрос (`Globe`), Парсинг страницы (`FileSearch`), Код/скрипт (`Code2` — sandbox) |
| **Интеграции (MCP)** | Email (`Mail`), Notion (`Database`), Telegram (`Send`), 1С/Bitrix24/Диадок/SharePoint (`Plug` — общие коннекторы с A07), Google Sheets (`Sheet`), Webhook-out (`Share2`) |
| **Выход** | Email digest (`Mail`), Сохранить в БЗ (`Database`), Уведомление (`Bell`), Файл (`FileDown`) |

---

## Поведение и интеракции

| Действие | Поведение |
|---|---|
| **Drag ноды** | Захват за тело ноды (не за порт), курсор `grabbing`. Нода следует за курсором, `z-index` поднимается, под ней тень/halo `--xero` слабая. **Snap to grid 24px** (по grid-фону). При отпускании — рёбра пересчитываются. Анимация позиции `transform`, 0ms во время drag, ease на snap. |
| **Соединение рёбер** | Hover на выходной порт → порт растёт + `--xero`. Mouse-down на порт → тянется «резиновое» ребро (bezier) за курсором. Над валидным входным портом другой ноды — порт подсвечивается зелёным, дроп создаёт edge. Дроп в пустоту → отмена (либо ПРЕДЛОЖЕНИЕ: открыть palette «создать ноду здесь»). **Запрет цикла:** если соединение создаёт цикл — порт-цель красный, дроп отклонён + тост «DAG не может содержать циклы». |
| **Выбор ноды → конфиг** | Клик по ноде → `.node` получает focus-ring `--xero` (border `--xero`, glow слабый), открывается **node-config-panel** справа. Клик по пустому канвасу — снять выбор, закрыть панель. Multi-select (Shift+клик / рамка-выделение) — ПРЕДЛОЖЕНИЕ для bulk-move/delete. |
| **Добавить ноду** | Через `+ Нода` (toolbar → palette) или drag из palette на канвас, или ПРЕДЛОЖЕНИЕ: «+» на исходящем порте ноды → меню следующего шага (inline). Новая нода появляется с `scale` 0.96→1 + fade, 200ms `--ease`. |
| **▸ Run** (ручной запуск) | Клик `▸ Run` → **run-overlay** активируется. Ноды исполняются в топологическом порядке: текущая нода → состояние `active` (pulse `--xero`, статус-дот `Loader`), входящее ребро анимируется «бегущим» градиентом. По завершении ноды → `done` (зелёный `Check`, ребро solid). Прогресс читается визуально по графу + опц. полоса «Шаг 3/6» в toolbar. AI-ноды показывают токены/стрим в своём статусе. Run можно остановить (`■ Стоп`). |
| **Logs** | Клик → выезжает **панель логов** (нижний drawer высотой ~40% ИЛИ правый). Список запусков (последние сверху): `ts · триггер · длительность · статус (success/error/partial) · потрачено токенов/₽`. Клик по запуску → таймлайн по нодам (нода · вход · выход · токены · время · ошибка). `--mono` для технических полей. Фильтр по статусу/дате. lucide `ScrollText`, `Clock`, `Coins`. |
| **Версии** | Клик → **drawer версий**: список снапшотов DAG (`v.12 · «добавлен Notion» · 2 дня назад · автор`). Действия: Просмотр (diff-оверлей на канвасе — что добавилось/удалилось), Откатить, Опубликовать как текущую. Каждое сохранение/публикация = новая версия. lucide `History`, `GitCommitVertical`, `Undo2`. |
| **Zoom / Pan** | Pan: drag по пустому канвасу (курсор `grab`/`grabbing`) ИЛИ пробел+drag ИЛИ trackpad-pan. Zoom: `⌘`/Ctrl + колесо, либо zoom-controls (25%–200%). «Fit to screen» (`Maximize`) — вписать весь граф. Grid-фон и ноды масштабируются синхронно. Двойной клик по пустоте — ПРЕДЛОЖЕНИЕ: создать ноду. |
| **Rename DAG** | Двойной клик / клик по `h2` → inline-input (`--display` 500 24px), Enter/blur сохраняет → новая версия. |
| **Тест одной ноды** | В конфиг-панели «Тест ноды» → прогон только этой ноды с замоканным/реальным входом, результат в панели (для отладки AI-промпта без запуска всего DAG). |
| **Undo/Redo** | `⌘Z` / `⌘⇧Z` для drag/add/delete/connect (ПРЕДЛОЖЕНИЕ). |

---

## Состояния

| Состояние | Вид |
|---|---|
| **Пустой канвас / новый DAG** | `.dag` с grid-фоном, по центру — иллюстративный empty-state: lucide `Workflow` 48px `--on-bg-dim`, заголовок `--display` «Соберите свой первый сценарий», саб `--on-bg-mute` «Перетащите ноду из палитры или начните с шаблона», две CTA: «+ Добавить триггер» (primary) · «Шаблоны» (ghost, → templates-gallery). На канвасе пунктирный плейсхолдер-слот для первой ноды. |
| **Idle (собран, не запущен)** | Все ноды base/primary как в мокапе, статус-дотов нет. Toolbar-статус «Не запускался» или «Запланирован на 09:00 MSK» (`--on-bg-dim`). Рёбра — статичный violet-grad. |
| **Выполнение — нода active** | Активная нода: pulse-halo `--xero`, статус-дот `Loader` (pulse, не спиннер >200ms), входящее ребро — анимированный градиент. Остальные пройденные — `done`; ещё не достигнутые — base. Toolbar: «Выполняется · шаг 2/6», `▸ Run` → `■ Стоп`. |
| **Выполнение — нода done** | Зелёный (`--ws code #10B981`) бордер-акцент / статус-дот `Check`. Исходящее ребро → solid `--xero`. |
| **Выполнение — нода error** | Красный бордер + статус-дот `X` (lucide), tooltip с текстом ошибки. Исходящие рёбра не активируются. Toolbar: статус «Ошибка на шаге 4», CTA «Открыть лог» / «Повторить с шага». |
| **Ветвление true/false** | Branching-нода после оценки: подсвечивается выбранная ветка (ребро `true` → активное violet, ребро `false` → `--on-bg-dim`/тусклое, или наоборот). Не выбранная ветвь нод — состояние `skipped` (opacity .5, dot `Minus`). Бейдж на ноде «relevance = 0.82 → true». |
| **Пауза** | Нода/весь DAG на паузе (напр. ждёт human-approval ПРЕДЛОЖЕНИЕ): статус-дот `Pause` `--ws video amber #F59E0B`, ребро застывшего градиента. Toolbar «Пауза · ждёт подтверждения», CTA «Продолжить» (`Play`). |
| **Ошибка шага** | См. error выше. Лог-запись с stack/ответом провайдера. Опции: retry-этого-шага, retry-всего-DAG, пропустить-шаг (если настроено `continue on error`). |
| **История запусков** | Панель Logs: лента запусков с цветными статус-чипами (success `green` / partial `amber` / error `red`), `ts`, длительность, токены/₽. Пустая история → «Запусков пока не было · нажмите ▸ Run». |
| **Сохранение** | Авто-сейв индикатор в toolbar: «Сохранение…» (pulse) → «Сохранено» (`Check` `--on-bg-dim`). |
| **Загрузка канваса** | Skeleton нод (bg-soft прямоугольники, shimmer ≤200ms) на местах позиций, рёбра проявляются после. |

---

## Адаптив

| Брейкпоинт | Поведение |
|---|---|
| **≥1280 (desktop)** | Полный режим. `app-side` 220px + канвас + node-config-panel (drawer 320–360 справа, при открытии канвас ужимается или панель оверлеем при <1440). Все интеракции: drag, connect, zoom, palette. **Редактирование — здесь.** |
| **768–1279 (tablet)** | `app-side` коллапсирует в иконочный rail (56–64px) или off-canvas (бургер). Канвас на всю ширину. node-config-panel — **оверлей/bottom-sheet**, не сужает канвас. Drag/zoom — touch-friendly (pinch-zoom, drag-pan). Редактирование возможно, но ограниченно (точное соединение портов пальцем сложно → ПРЕДЛОЖЕНИЕ: соединение через «выбрать выход → выбрать вход» тапами, без drag). |
| **<768 (phone)** | **Просмотр + запуск только (ПРЕДЛОЖЕНИЕ — редактирование desktop-only).** Канвас — read-only viewport: pinch-zoom + pan для осмотра графа, ноды кликабельны → bottom-sheet с конфигом read-only. Доступно: `▸ Run`, остановка, Logs (полноэкранный лист запусков), просмотр Версий. Toolbar сжат: имя сценария (truncate) + `▸ Run` + `⋯` (Logs/Версии/Открыть на ПК). Баннер «Редактирование сценариев доступно на десктопе». Это согласуется с A10 (Telegram-бот) — мобильный канал = запуск/мониторинг, не конструирование. |

---

## Данные

**DAG (сценарий)**
```
id, organization_id, name ("Daily research → Email digest"),
status (idle|scheduled|running|paused|error),
nodes[], edges[], trigger, schedule, current_version_id,
created_by, updated_at
```
**Node**
```
id, dag_id, type (trigger|action|ai|branch|integration),
subtype (cron|web_search|llm|email|notion|...),
position {top, left},          # абсолютные px на канвасе
label ("▸ STEP 02 · AI"), name ("Анализ источников"),
config {...},                  # по типу
# для ai-нод:
model ("claude-opus" / "gpt-5.4"), max_tokens (4500),
prompt, temperature, input_ref, output_var,
# для branch:
condition {field, op (≥), value (0.7)}, outputs [true,false],
# runtime (на запуск):
status (idle|active|done|error|skipped|paused), tokens_used, duration_ms, error
```
**Edge**
```
id, dag_id, source_node, source_port (out|true|false),
target_node, target_port (in),
orientation (h|v), runtime_state (idle|active|done|disabled)
```
**Trigger / Schedule**
```
type (cron|webhook|manual|file|email|telegram),
cron ("0 9 * * 1-5"), timezone ("Europe/Moscow"/MSK),
enabled (bool), webhook_url, next_run_at
```
**RunLog (история запусков)**
```
id, dag_id, organization_id, started_at, finished_at, duration_ms,
trigger_source (cron|manual|webhook), status (success|partial|error),
tokens_total, cost_rub,
steps[] { node_id, status, tokens, duration_ms, input_snapshot, output_snapshot, error }
```
**Version**
```
id, dag_id, label ("добавлен Notion"), snapshot (nodes+edges+config),
author, created_at, is_published
```

---

## Edge cases

| Кейс | Обработка |
|---|---|
| **Большой граф** (50+ нод) | Виртуализация рендера нод вне viewport; обязательный zoom-out + mini-map; auto-layout-кнопка (`LayoutGrid`, dagre/elk-раскладка ПРЕДЛОЖЕНИЕ); «Найти ноду» (`⌘F`). Канвас расширяется за `min-height:520`, скролл-pan. |
| **Циклы запрещены (DAG)** | Любое соединение, создающее ориентированный цикл, отклоняется на этапе drop (порт-цель красный) + тост «DAG не может содержать циклы». Loop-нода (`Repeat`) реализует итерацию **внутри одной ноды** (foreach по массиву), не через ребро назад. |
| **Долгий шаг** | AI-нода/HTTP с большим временем: статус `active` с таймером (`--mono` «00:42»), без блокировки UI. Timeout-конфиг на ноду (default напр. 120s) → по истечении `error` «Превышено время ожидания». Возможность «выполнять в фоне» (закрыть экран, run продолжается серверно). |
| **Обрыв / сбой соединения** | Если фронт потерял связь во время run — статус берётся с сервера при переоткрытии (run живёт на бэке). Лог покажет, на каком шаге оборвалось. Идемпотентность шагов-MCP (ПРЕДЛОЖЕНИЕ) чтобы повтор не дублировал email/запись. |
| **Лимит токенов в AI-ноде** | `max_tokens` ноды — жёсткий потолок ответа. Если вход + промпт превышают окно модели → нода `error` «Контекст превышает окно модели (X > Y)», подсказка уменьшить вход/сменить модель. Если у организации исчерпан бюджет/нет BYOK-ключа → блок до настройки (warn-бейдж на ноде ещё до Run). Перед Run — пред-оценка суммарных токенов/₽ по всем AI-нодам (ПРЕДЛОЖЕНИЕ). |
| **Нода не настроена** | Обязательные поля пусты (нет модели, нет получателя email) → нода с warn-бейджем (`AlertTriangle` amber), Run заблокирован, тост «Настройте ноду „…"». |
| **Висячая нода** (не соединена) | Нода без входящих рёбер (кроме триггера) → не исполнится; визуальный warn «Нода не подключена к графу». |
| **Несколько триггеров** | ПРЕДЛОЖЕНИЕ: разрешить (cron + webhook + manual параллельно как точки входа) ИЛИ ограничить одним — решить в «Открытых вопросах». |
| **Удаление ноды в середине** | Рёбра до/после удаляются; ПРЕДЛОЖЕНИЕ: предложить «сшить» предыдущую с следующей автоматически. |
| **Конфликт версий** (два редактора) | Org с seats: optimistic lock по `current_version_id`; при конфликте — «DAG изменён другим участником, обновите» + diff. |

---

## Маппинг на код

**Каркас (существует, переиспользовать):**
- `app-layout` / `app-side` / `app-side-brand` / `app-side-section` / `app-side-footer` — `xerocode-v3.css` 532–615.
- `app-toolbar` / `app-toolbar h2` / `btn-mini` / `btn-mini.primary` — 617–647.
- `.dag` / `.node` / `.node.primary` / `.node .lab/.nm/.meta` / `.edge` / `.edge::after` — 1417–1468.

**Новые компоненты (React V3):**
| Компонент | Роль | Технология |
|---|---|---|
| `OrchestrationScreen` | Контейнер app-layout + toolbar + canvas + panels | — |
| `DagCanvas` | Канвас, zoom/pan, grid, render нод+рёбер | **ПРЕДЛОЖЕНИЕ: React Flow (`@xyflow/react`)** — даёт ноды/рёбра/порты/zoom/pan/mini-map/auto-layout из коробки; кастомные node-типы стилизуются под `.node`/`.node.primary`. Альтернатива — собственный canvas на абсолютных div (как в мокапе) + dnd-kit для drag, но без bezier-рёбер и pan «дорого». Рекомендую React Flow с переопределением стилей под токены. |
| `DagNode` (variants: `trigger` / `action` / `ai`) | Кастом-нода React Flow | классы `.node` / `.node.primary`; lab/nm/meta; порты `Handle`. |
| `DagEdge` | Кастом-ребро | SVG bezier с violet-gradient (`<linearGradient>` `--xero`), анимация dash при run. |
| `NodeConfigPanel` | Drawer конфига | motion/react slide-in 200ms `--ease`. |
| `NodePalette` | Палитра/командное меню добавления | `⌘K`-overlay (cmdk) или rail. |
| `RunOverlay` | Управление выполнением, подсветка статусов нод | подписка на run-стрим (SSE/WS). |
| `LogsDrawer` | История запусков + таймлайн по нодам | — |
| `VersionsDrawer` | Снапшоты + diff/откат | — |
| `CanvasControls` | Zoom-controls + mini-map + fit | React Flow `<Controls/> <MiniMap/>`. |

**CSS-переменные (только именами, правило №2):** поверхности `--bg` (канвас) · `--bg-soft` (нода/панели/sidebar) · `--bg-tile` (инпуты/чипы); линии `--line-bg` / `--line-bg-strong` (бордер ноды); акцент `--xero` (primary: AI-ноды, рёбра, active, grid-фон, фокус) · `--xero-mute` (заливка primary-ноды + active-nav) · `--xero-soft` (gradient аватара); воркспейс `--ws-orchestr #D4654A` (badge/иконка нав, акцент-полоса триггера) · статусы заимствуют `--ws code #10B981` (done/green), `--ws video #F59E0B` (amber/pause/warn), red — ошибка; текст `--on-bg` / `--on-bg-mute` / `--on-bg-dim`; cream `--cream` (текст на violet-кнопках/аватаре). Шрифты `--display` (nm, h2) · `--body` (инпуты конфига) · `--mono` (lab, meta, btn-mini, технические поля логов). Радиусы: канвас 12, нода 10, инпут/чип 8, мелочь 6, pill 999. Motion `--ease`, 180–300ms (drag-snap, slide-in, edge-flow), pulse вместо спиннеров >200ms.

**lucide-react иконки по типам нод/действий:** Trigger-Cron `Clock` · Webhook `Webhook` · Manual `Hand` · AI/агент `Sparkles`/`Bot` · Web Search `Search` · Branching `GitBranch` · Parallel `GitFork` · Loop `Repeat` · Email `Mail` · Notion/БД `Database` · MCP-коннектор `Plug` · HTTP `Globe` · Код `Code2` · RAG-БЗ `Database`. Toolbar: Logs `ScrollText` · Версии `History`/`GitCommitVertical` · Run `Play` · Стоп `Square` · Повтор `RotateCcw` · Сохранить `Save` · Палитра `Plus` · Auto-layout `LayoutGrid`. Канвас-controls: `Plus`/`Minus`/`Maximize`/`Map`. Статусы: `Loader`/`Check`/`X`/`Pause`/`Minus`/`AlertTriangle`. Нав-иконка воркспейса: `Workflow`. Запрещено эмодзи как иконки (правило №3) — «⭐» в футере допустимо как существующий мокап-элемент, но в новом UI заменить на lucide `Star`.

---

## Открытые вопросы / ПРЕДЛОЖЕНИЯ

1. **ПРЕДЛОЖЕНИЕ — цвет active-навигации воркспейса.** В мокапе `app-side li.active` = **violet** для всех воркспейсов, но у каждого свой цвет (Оркестрация = sienna). Решить централизованно: (а) оставить violet (единый акцент продукта) ИЛИ (б) active = цвет воркспейса (sienna-mute фон + sienna текст). Влияет на все 8 экранов.
2. **ПРЕДЛОЖЕНИЕ — движок канваса.** React Flow (`@xyflow/react`) vs собственный absolute-div + dnd-kit. Рекомендация: React Flow (порты, bezier, zoom/pan, mini-map, dagre auto-layout из коробки), стилизованный под токены `.node`/`.edge`. Нужно решение, т.к. определяет всю реализацию.
3. **ПРЕДЛОЖЕНИЕ — node-config-panel: drawer vs модалка vs inline.** Рекомендую правый drawer 320–360 (на desktop ужимает канвас, на <1440 — оверлей). Структура и поля по типам — выше.
4. **ПРЕДЛОЖЕНИЕ — node-palette: командное меню (`⌘K`) vs постоянный rail vs drag-from-sidebar.** Рекомендую `+ Нода` → `⌘K`-overlay с поиском/категориями + drag на канвас.
5. **ПРЕДЛОЖЕНИЕ — шаблоны DAG (templates-gallery).** Готовые сценарии для быстрого старта: «Daily research → digest» (эталон), «Лиды из формы → CRM», «Транскрипт встречи → задачи», «Мониторинг упоминаний бренда», «Контент-пайплайн (текст→картинка→пост)». Где живёт галерея: empty-state CTA «Шаблоны» + пункт в toolbar. Связь с Onboarding A11 (выбор воркспейсов).
6. **ПРЕДЛОЖЕНИЕ — MCP-интеграция.** Ноды-интеграции (Notion, 1С, Bitrix24, Диадок, SharePoint, Email, Telegram) — это вызовы MCP-серверов/коннекторов, **общий реестр с Базой знаний A07** (там уже есть `1С DocFlow`, `Confluence`, `Bitrix24`, `Notion`, `SharePoint`, `Диадок`). Единая «Connectors»-страница, авторизация коннектора один раз → доступен и в БЗ, и в нодах DAG. Уточнить список MCP на старте.
7. **ПРЕДЛОЖЕНИЕ — расписание (scheduling).** Cron-триггер: визуальный пикер («каждый рабочий день · 09:00») + raw-cron для продвинутых + таймзона (MSK дефолт). Где включается/выключается расписание (toggle в конфиге триггера + индикатор в toolbar «Запланирован на 09:00 MSK · next run через 3ч»). Кто имеет право включать (тратит токены команды) — owner/admin.
8. **ПРЕДЛОЖЕНИЕ — стоимость/бюджет.** Показывать ли пред-оценку токенов/₽ перед Run и фактический расход в логах (рекомендую да — AI-ноды тратят BYOK-бюджет, прозрачность важна, перекликается с тезисом «BYOK = ∞» из A09).
9. **ПРЕДЛОЖЕНИЕ — human-in-the-loop / approval-нода.** Нода-пауза «ждёт подтверждения человека» (напр. перед отправкой email клиенту) — состояние «Пауза», уведомление, кнопка «Продолжить». Нужно ли в MVP.
10. **ПРЕДЛОЖЕНИЕ — несколько триггеров на DAG** (cron + webhook + manual) vs ровно один. Влияет на модель данных и UI.
11. **ПРЕДЛОЖЕНИЕ — вертикальные рёбра без направления.** В мокапе вертикальные `.edge` теряют стрелку `→` (переопределён background). Добавить им явный `↓`-маркер (lucide `ChevronDown`) для читаемости направления потока.
12. **ПРЕДЛОЖЕНИЕ — права/seats** (`viewer`/`editor`/`runner`/`owner`) и optimistic-lock при совместном редактировании (до 50 seats). Объём для MVP уточнить.
