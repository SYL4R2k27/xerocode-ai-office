# XeroCode v3 — Deep-spec пакет · Индекс + Фундамент + Глобальный шелл

> Это **корневой файл** папки `design-deepspec/`. Здесь: оглавление, общий слой дизайн-системы (на который ссылаются все экраны), глобальный каркас приложения (сайдбар/топ-бар/⌘K/уведомления) и карта компонентов.
> Парные файлы верхнего уровня: `XEROCODE_REDESIGN_BRIEF.md` (краткий референс), `XEROCODE_DESIGN_SESSION.md` (повестка/вопросы), `XEROCODE_FULL.html` (визуал).

---

## 0. Оглавление пакета (статус)

| Файл | Экран/зона | Статус |
|---|---|---|
| `00_INDEX_foundation.md` | **этот** — фундамент + шелл + компоненты | ✅ |
| `A01_auth.md` | Авторизация `/auth` | ✅ |
| `A02_dashboard.md` | Главная · Overview `/dashboard` | ✅ |
| `A03_chat.md` | **Чат** `/chat` (приоритет) | ✅ |
| `A04_images.md` | Картинки `/images` | ✅ |
| `A05_code.md` | Код `/code` | ✅ |
| `A06_documents.md` | Документы `/documents` (Cream) | ✅ |
| `A07_knowledge.md` | База знаний `/knowledge` | ✅ |
| `A08_orchestration.md` | Оркестрация (DAG) `/orchestration` | ✅ |
| `A09_account_settings_billing.md` | **Личный кабинет · Профиль · Настройки · Подписки/Биллинг · Команда** | ✅ |
| `A10_telegram.md` | Telegram-бот `@xerocode_bot` | ✅ |
| `A11_onboarding.md` | Onboarding `/onboarding` | ✅ |
| `A12_empty.md` | Empty / AI-роутер `/new` | ✅ |
| `L01_landing.md` | **Лендинг** `/` | ✅ |
| `CORP_functionality.md` | **Корпоратив** — роли/права (10 ролей), CRM, Kanban, документооборот, ЭДО, каналы, календарь, HR, отчёты, тарифы | ✅ функционал (построен в коде; дизайн под него — TODO) |

**Порядок чтения для дизайн-сессии:** `00` (этот) → `A03 чат` → `A09 кабинет/настройки/подписки` → `L01 лендинг` → остальные A-экраны → CORP (проектировать).

---

## 1. Фундамент — дизайн-токены (полный референс)

### 1.1 Поверхности
| Переменная | HEX | Роль |
|---|---|---|
| `--bg` | #0A0A0B | Carbon, основной фон |
| `--bg-soft` | #131316 | панели, сайдбары, карточки-контейнеры |
| `--bg-tile` | #151519 | плитки/карточки на bg-soft |
| `--cream` | #F4EFE3 | контрастная светлая поверхность (Документы A06, cream-секции лендинга) |
| `--cream-warm` | #EDE5D2 | тёплый cream (вложенные блоки) |

### 1.2 Текст
`--on-bg` #F4EFE3 · `--on-bg-mute` #A8A8AC · `--on-bg-dim` #6E6E72 (на тёмном).
`--on-cream` #0A0A0B · `--on-cream-mute` #5C5C62 · `--on-cream-dim` #8C8C92 (на cream).

### 1.3 Линии (hairlines, не тени)
`--line-bg` rgba(244,239,227,.10) · `--line-bg-strong` .20 · `--line-cream` rgba(10,10,11,.10) · `--line-cream-strong` .20.

### 1.4 Акцент
`--xero` #7C5CFF (PRIMARY: CTA, ссылки, active, фокус) · `--xero-soft` #9B82FF · `--xero-mute` rgba(124,92,255,.15) (фоновые подсветки) · `--sylar` #D4654A (DNA-маркер SYLAR) · `--steel` #6E6E72 (labels/meta).

### 1.5 8 цветов воркспейсов (только в badge/ico/dots, НЕ в крупных плашках)
`--ws-chat` #7C5CFF · `--ws-text` #06B6D4 · `--ws-images` #EC4899 · `--ws-code` #10B981 · `--ws-video` #F59E0B · `--ws-sound` #8B5CF6 · `--ws-corp` #4F46E5 · `--ws-orchestr` #D4654A.

### 1.6 Семантика статусов (договорённость пакета)
ОК/успех → `--ws-code` (green) · ошибка/опасность/лимит → `--sylar` · ожидание/pending → `--ws-video` (amber) · активное/акцент → `--xero`.

### 1.7 Типографика
`--display` 'Space Grotesk' 400/500/600/700 — заголовки (tracking от −0.04em hero до −0.01em). `--body` 'Inter' 300/400/500/600 — текст (17px/1.65). `--mono` 'JetBrains Mono' 400/500/600 — лейблы/eyebrow (UPPERCASE, +0.22em tracking, маркер «▸»), технические данные, числа (tabular). **Без serif, без italic.**
Шкала: Hero 64–80 / H1 44 / H2 40 / H3 16–18 / Body 14–17 / mono-label 10–12.

### 1.8 Геометрия и движение
Радиусы: 6/8/10/12/14px · **999px** (pills/кнопки) · 2px (мелочь типа progress). 
Поля: `--pad-x clamp(20px,4vw,64px)`; вертикальный ритм секций 140px (моб. 80px). 
Motion: `--ease cubic-bezier(0.22,1,0.36,1)`; микро 180–200ms, hover 200ms, reveal ~1s, переходы ≤300ms. **Спиннеры >200ms запрещены** — вместо них skeleton/прогресс.

### 1.9 Брейкпоинты (договорённость)
desktop ≥1280 · tablet 768–1279 · mobile <768. Общее правило: app-side → drawer на <768; правые панели → bottom-sheet; многоколоночные гриды → 1 колонка.

### 1.10 Матрица состояний интерактива (применять везде)
| Состояние | Приём |
|---|---|
| default | базовые токены |
| hover | border→`--xero` или фон `--bg-tile`/opacity↑, transform ≤2px |
| active/selected | border `--xero` + фон `--xero-mute` |
| focus | ring/border `--xero` (видимый, для доступности) |
| disabled | текст `--on-bg-dim`, фон `--bg-soft`, cursor not-allowed |
| loading | skeleton-shimmer ≤200ms (без спиннера) |
| error | border/текст `--sylar` + инлайн-сообщение |
| success | инлайн «✓ Сохранено» (fade), `--ws-code` |
| empty | иллюстрация-минимум + текст + 1 CTA |

---

## 2. Принципы (закон бренда)
**✓ Разрешено:** Space Grotesk/Inter/JetBrains Mono · Carbon+Cream · Violet primary · Sienna DNA · 8 цветов только в badge/ico/dots · browser-frame для скриншотов · karaoke scroll-reveal в hero · magnetic CTA · hairlines 1px · inline-иконки в тексте.
**⊘ Запрещено:** курсив · serif · editorial-хром (номера страниц/⌘/римские цифры) · градиентные заливки на больших площадях · glassmorphism/neon/glow · 3D-blobs/particles/AI-meshes · киберпанк · «AI-powered/next-gen/революционно» · улыбающиеся стоки/роботы/голограммы · спиннеры >200ms.

---

## 3. Глобальный шелл приложения (сквозной, на всех A-экранах кроме auth/onboarding/landing)

### 3.1 app-side (левый сайдбар, 220px)
Структура (из мокапов A02/A04/A05/A07/A08/A12):
```
┌ XeroCode•                    ← бренд (--display 600 + dot --xero)
│ ▸ ВОРКСПЕЙСЫ                  ← секция (mono --on-bg-dim)
│  ● Чат            (active)    ← active: текст --on-bg + плашка --xero-mute + лев. бордер --xero
│  ○ Текст
│  ○ Картинки   [12]            ← опц. счётчик-бейдж (--bg-tile/--on-bg-mute)
│  ○ Код · Видео · Звук
│  ○ Оркестрация
│ ▸ ИНСТРУМЕНТЫ
│  База знаний · Документы · API-ключи · Настройки
│ ─────────────────────────
│ [V] Vladimir T.              ← футер-юзер → user-menu (A09 §5)
│     Pro ⭐
└
```
- Пункт: иконка lucide (см. ниже) + лейбл (`--body` 14px) + опц. счётчик. hover → `--bg-tile`. active → `--xero-mute` фон + border-left 2px `--xero` + текст `--on-bg`.
- Состав воркспейсов в сайдбаре зависит от выбора в онбординге (A11) и тарифа.
- **lucide по пунктам:** Чат `MessageSquare` · Текст `FileText` · Картинки `Image` · Код `Code2` · Видео `Video` · Звук `AudioLines` · Корпоратив `Building2` · Оркестрация `Workflow` · База знаний `Database` · Документы `Files` · API-ключи `KeyRound` · Настройки `Settings`.
- **<768:** сайдбар уходит в drawer (бургер `Menu` в топ-баре), оверлей `--bg` + slide-in.

### 3.2 Топ-бар приложения (ПРЕДЛОЖЕНИЕ — в мокапах его роль играет browser-frame)
В проде вместо browser-bar — тонкий топ-бар: слева бургер (моб) + хлебные крошки/название воркспейса; центр — **глобальный поиск/командная строка** (см. ⌘K); справа — уведомления (`Bell`), помощь (`CircleHelp`), аватар. Высота ~56px, фон `--bg`, нижний hairline `--line-bg`.

### 3.3 Командная палитра ⌘K (ПРЕДЛОЖЕНИЕ, рекомендуется)
Глобальный `⌘K`/`Ctrl+K` → оверлей-палитра: переход по воркспейсам, поиск диалогов/документов, быстрые действия («Новая задача», «Сменить модель», «Подключить ключ»). Компонент `CommandPalette` (`--bg-tile`, border `--line-bg-strong`, radius 12, mono-подсказки клавиш). Связывает A12 (роутер) и навигацию.

### 3.4 Уведомления (ПРЕДЛОЖЕНИЕ)
Иконка `Bell` в топ-баре + поповер-список (генерация готова, лимит близко, платёж, инвайт в команду). Тосты — короткие, без спиннеров, авто-скрытие; ошибки — `--sylar`.

### 3.5 Переключение воркспейсов и перенос контекста
Один клик по пункту сайдбара = смена воркспейса. Заявленный в IA принцип «контекст переносится»: активный артефакт/выделение можно передать в другой воркспейс (хэндофф, см. A03 §7 и A12 §5). ПРЕДЛОЖЕНИЕ: визуальная «нить» переноса (тост «Контекст перенесён в Документы»).

---

## 4. Карта компонентов (V2 есть → V3 нужно)

### 4.1 Существующие V2 (дефолт проекта)
`SidebarV2`, `ChatAreaV2`, `ChatInputV2`, `ChatMessageV2`.

### 4.2 Новые/расширяемые V3 (сводно по всем экранам)
- **Каркас:** `AppLayout` (app-side + main), `SettingsLayoutV2` (settings-grid), `OnboardingShell`, `LandingShell`, `TopBar`, `CommandPalette`, `Drawer`, `BottomSheet`.
- **Навигация:** `SidebarV2` (расширить: счётчики, секции, футер-юзер), `SettingsNav`, `UserMenu`, `Breadcrumbs`.
- **Чат:** `ChatSidePanelV2` (НОВЫЙ — model-picker + контекст), `ModelPicker` (группы/поиск), `MessageBranches` (‹2/3›), `SourceCitation`, `TokenMeter`, `AttachMenu`, `StreamingMessage`, `CodeBlock` (copy/collapse).
- **Воркспейсы:** `PromptBar`, `PillFilter`, `ImageCard`/`ImageGrid`, `CodeEditor`+`DiffView`+`SuggestionCard`+`RunOutput`, `DocsList`/`DocViewer` (cream), `KbSearch`/`KbCard`/`ConnectorsManager`, `DagCanvas`/`DagNode`/`DagEdge`/`NodeConfigPanel`/`NodePalette`.
- **Аккаунт/биллинг:** `SettingsRow`, `SettingsSection`, `MetricWithBar`, `PlanCard`, `ProviderKeyRow`, `MaskedField`, `Toggle`, `MemberRow`, `InvoiceRow`, `DangerZone`, `ByokCallout`.
- **Онбординг/старт:** `ProgressBar`, `SelectableCard`, `StepRouter`, `TaskRouterInput`, `TemplateCard`, `RoutingChip`.
- **Лендинг:** `Hero`(karaoke), `ProductShot`, `WsGrid`, `StepCards`, `ModelChips`, `ConnectorGrid`, `MiniDag`, `TrustRow`, `PricingCards`(общий с billing), `TelegramTeaser`, `FaqAccordion`, `FinalCta`, `Footer`.
- **Атомы:** `PillButton`(primary/ghost), `BtnMini`, `Eyebrow`(mono ▸), `Badge`, `MetricCard`, `Avatar`, `StatusDot`, `BrowserFrame`(для маркетинга/демо).

### 4.3 Правила реализации (из проекта)
Все цвета — CSS-переменные (никогда hardcode hex в компонентах) · иконки — только `lucide-react` (никаких эмодзи как иконок) · сложные анимации — `motion/react` · весь UI-текст — русский · токен в localStorage — `ai_office_token` · org-изоляция по `organization_id` на каждом эндпоинте по ID · BYOK через прокси (`use_proxy = bool(proxy)`) · V2-компоненты — дефолт, v3 «приземляем» на них, прод не ломаем (showcase на `?view=v3`).

---

## 5. Жёсткие рамки
- **Деплой на прод `xerocode.ru` — только по явной команде владельца.**
- Не вводить запрещённые приёмы (§2).
- CORP-зона (CRM/Kanban/HR/документооборот) — отдельная большая сессия проектирования (мокапа нет).
