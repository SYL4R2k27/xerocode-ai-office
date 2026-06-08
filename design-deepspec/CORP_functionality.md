# CORP · Корпоративный режим — ФУНКЦИОНАЛ (что планировали и построили)

> ⚠️ Я ошибочно пометил CORP как «не начат». На деле это **построенный корпоративный пакет уровня Битрикс24**: код есть и во фронте (`src/app/components/corporate/*`), и в бэке (`models/crm.py`, `document_registry.py`, `calendar.py`, `channel.py`, `connector.py`, `core/roles.py`, `core/plans.py`, `services/connector_bitrix.py`, `dag_orchestrator.py`).
> Источники этого документа — **реальный код** (роли, права, CRM, документооборот, тарифы) + память (построенные страницы, roadmap). Сначала фиксируем функционал → потом верстаем дизайн → потом техчасть подгоняем под дизайн.
> Дизайн-токены/принципы — из `00_INDEX_foundation.md`. CORP визуально = плотный профессиональный режим («дашборд как Битрикс, фокус-режим»), НЕ стартап-лендинг.

---

## 1. Что это и кому
**Корпоративный режим XeroCode** — отдельная рабочая среда для команд и компаний: CRM, задачи (Kanban), документооборот с согласованием и ЭДО, групповые чаты, календарь, HR, отчёты, база знаний, AI-навыки и оркестрация — поверх **системы профессиональных ролей** (каждый видит только свои модули). Цель — заменить зоопарк (Битрикс24 + 1С + почта + мессенджеры) одним AI-офисом, где рутину делает AI.

**Связь с продуктовой линейкой:** XeroCode CORP — это «командный» слой XeroCode (до 10 / безлимит seats на Enterprise/Enterprise+). Старший брат — **RoleFlow** (200+ seats, ретро-аудит + Safe AI) для крупных оргструктур.

---

## 2. Доступ и тарифы (РЕАЛЬНЫЕ значения из `core/plans.py`)

> ❗ Поправка к `A09_account_settings_billing.md`: там цены были предположительные. **Каноничные тарифы — ниже** (6 планов, не 3). CORP-модули включаются с **Enterprise**.

| План | Цена/мес | Сегмент | Аудитория | Seats | CORP-модули |
|---|---|---|---|---|---|
| **Free** | 0 ₽ | b2c | Попробовать | 1 | — |
| **Go** | 490 ₽ | b2c | Новичок | 1 | — |
| **Pro** | 1 990 ₽ | b2c | Соло-проф | 1 | — |
| **Prime** | 9 990 ₽ | b2c | Power-user | 1 | — |
| **Enterprise** | 24 990 ₽ | b2b | Команда до 10 | 10 (+seat 4 990 ₽) | CRM, Channels, Задачи команды, HR, **RBAC 5 ролей**, 1С, Битрикс24 |
| **Enterprise+** | 79 990 ₽ (договор) | b2b | Корпорация | ∞ | всё выше + **ЭДО**, WhatsApp/VK, **RBAC ∞**, on-premise, SSO/SAML/LDAP, white-label, fine-tune |

**Гейтинг модулей** (`PlanCorpModules`): `crm, channels, team_tasks, hr, rbac_roles(N), edo, integrations_1c, integrations_bitrix, integrations_whatsapp_vk`. Воркспейс `corp=True` — только Enterprise/Enterprise+. BYOK = ∞ токенов на любом плане (платишь за функции/seats, не за объём).

---

## 3. Система ролей и прав (ХРЕБЕТ CORP) — из `core/roles.py`

Три слоя доступа, комбинируются:
1. **org_role** (организационная роль): `owner` (всё) · `manager` (+ team/reports/kanban_manage) · `member`.
2. **professional_role** (профессия, определяет модули и права) — 10 штук.
3. **custom overrides** — точечные правки прав на пользователя (JSONB `permissions`).

### 3.1 Десять профессиональных ролей (RU-лейблы)
| role | Лейбл | Видит модули (sidebar) |
|---|---|---|
| `director` | Руководитель | ВСЁ (17 модулей) |
| `chief_accountant` | Главный бухгалтер | dashboard, chat, documents, документооборот, knowledge, research, analytics, calendar, reports, settings |
| `accountant` | Бухгалтер | dashboard, chat, documents, документооборот, knowledge, calendar, reports |
| `sales_manager` | Менеджер по продажам | dashboard, chat, **CRM**, kanban, documents, knowledge, research, analytics, channels, calendar, reports |
| `project_manager` | Менеджер проектов | dashboard, chat, kanban, **workflows**, documents, документооборот, skills, knowledge, research, analytics, channels, calendar, team, reports |
| `logistics` | Логист | dashboard, chat, kanban, documents, документооборот, knowledge, channels, calendar |
| `hr_manager` | HR-менеджер | dashboard, chat, **team, HR**, documents, документооборот, knowledge, channels, calendar, reports |
| `legal` | Юрист | dashboard, chat, documents, документооборот, knowledge, research, calendar |
| `marketer` | Маркетолог | dashboard, chat, CRM, kanban, workflows, documents, skills, knowledge, research, analytics, channels, calendar, reports |
| `operator` | Оператор | chat, kanban, skills, knowledge, channels (минимум) |

### 3.2 Матрица прав (модуль → действия) — `PERMISSION_MATRIX`
dashboard[view/finance/sales/projects] · crm[view/full] · kanban[view/manage] · workflows[view/manage/run] · documents[view/create/sign] · edo[view/send/sign] · skills[view/manage] · kb[view/upload] · research[view/start/council] · team[view/manage] · reports[view/finance/sales/projects] · settings[view/manage] · chat[full] · budget[view/manage] · channels[view/create/manage] · calendar[view/create/manage] · hr[view/manage] · files[view/upload/manage] · integrations[view/manage].
Пример: бухгалтер видит `dashboard_finance` + `documents_sign` + `edo_send`, но НЕ видит CRM. Дашборд и отчёты **меняют состав виджетов** по роли (finance vs sales vs projects).

### 3.3 Отраслевые шаблоны ролей — `INDUSTRY_TEMPLATES`
Готовые наборы ролей под отрасль (быстрый старт оргструктуры):
- **IT-компания**: Техлид, Разработчик, QA-инженер, Дизайнер.
- **Торговля**: Управляющий магазином, Кассир, Кладовщик.
- **Производство**: Начальник производства, Инженер, Контроль качества.
(Каждая роль шаблона = свой набор permissions + modules.)

**Дизайн-следствие:** sidebar и дашборд — **динамические**, собираются из `user.modules`/`user.permissions` (приходят из `/auth/me`). Один пользователь — урезанный кабинет, директор — полный. Это ключевая особенность CORP-навигации.

---

## 4. Состав модулей CORP (полный список)
**27 готовых страниц** в `components/corporate/` (фронт построен): `CorporateLayout`, `Dashboard`, `CRMPage`, `KanbanBoard`, `TaskListView`, `TaskDetailPanel`, `TaskDeadlineView`, `GanttPage`, `WorkflowPage`, `DocumentsPage`, `DocumentRegistryPage`, `EDOPage`, `ChannelsPage`, `CalendarPage`, `HRPage`, `KnowledgePage`, `ResearchPage`, `SkillsPage`, `ReportsPage`, `AnalyticsPage`, `IntegrationsPage`, `TeamPage`, `RolesManager`, `SettingsPage`, `AICopilot`, `CorporateBackground`, `BackgroundPicker`. То есть **почти весь функционал уже есть в виде страниц** (память 58-дн. давности занижала — там часть числилась «в планах»). Доделка — это глубина бэка/интеграций, а не наличие экранов. Ниже — функционал каждого модуля.

---

### 4.1 Dashboard (role-based)
Стартовый экран команды. **Виджеты зависят от роли**: sales-дашборд (воронка, план продаж, мои сделки) / finance-дашборд (расходы, документы на подпись, ЭДО) / projects-дашборд (мои задачи, дедлайны, загрузка команды). Общее: stats, goals, members, activity из PostgreSQL (`/api/org/stats`, `/api/org/activity`). Quick actions, notifications, breadcrumbs.

### 4.2 CRM — из `models/crm.py` (полностью спроектирован)
**Сделки (Deal):** воронка по стадиям `lead → qualification → proposal → negotiation → decision → won / lost → post_sale`. Поля: title, **amount + currency (RUB)**, contact, assignee, description, **source** (website/phone/email/referral/social/ad), **priority** (low/medium/high/critical), **qualification_score 0–100**, **next_action + дата**, lost_reason, won_date, expected_close, **связи с задачами (linked_task_ids) и документами (linked_doc_ids)**, tags.
**Контакты (Contact):** name, email, phone, company, position, notes, tags, source.
**Активности (DealActivity):** таймлайн сделки — звонок (длительность, исход), письмо (тема, входящее/исходящее), встреча, заметка, **смена стадии** (from→to), привязка задачи/документа, комментарий.
**UI-функционал:** канбан-воронка с drag&drop по стадиям, карточка сделки, контакты, лента активностей. API: `GET/POST/PATCH/DELETE /api/crm/deals + /crm/contacts + /crm/pipeline`.
**AI-слой:** автоквалификация лида (score), подсказка next_action, генерация письма-follow-up (мост в чат/документы), сводка по сделке.

### 4.3 Kanban / Задачи команды — 5-этапный workflow
Доска задач организации со стадиями: **`backlog → in_progress → review_operator → review_manager → done`** (двойное ревью — оператор, затем менеджер). Drag&drop, переходы через `PATCH /api/org/tasks/{id}/status`. Задачи связаны с Workflow (запуск workflow создаёт Goal + Tasks) и с CRM (linked_task_ids). Назначение исполнителя, приоритет, дедлайн.

### 4.4 Workflows — визуальный конструктор (DAG)
No-code конструктор сценариев: **native drag&drop нод, DAG branching, autosave 2s, 5 шаблонов**. Запуск `POST /api/workflows/{id}/run` → создаёт Goal + Tasks. **Публичный webhook** `POST /api/workflows/webhook/{id}/trigger` (X-Webhook-Secret). Шаги: триггеры (cron/webhook), AI-ноды (модель+токены), условия (branching), действия (документ/письмо/задача/Notion). Это тот же движок, что воркспейс «Оркестрация» (A08), но в корп-контексте — командные сценарии. (`services/dag_orchestrator.py`.)

### 4.5 Documents — AI-генерация
Генерация **PPTX/DOCX/XLSX** через AI-цепочку (Claude → GPT-5.4 → OpenRouter → Groq, с фолбэками). `POST /api/documents/pptx|docx|xlsx`. Превью, скачивание, привязка к сделке/задаче. (Это «бизнес-сторона» воркспейса Документы A06.)

### 4.6 Документооборот (Doc Registry) — из `models/document_registry.py`
**Реестр документов (DocumentRecord):** номер (`OUT-2026-0001`), тип (входящий/исходящий/внутренний), категория (договор/счёт/акт/КП/отчёт/прочее), статус **`draft → approval → signed → archive / rejected`**, файл, шаблон, **связь со сделкой CRM**, **версионирование (version + parent_id, цепочка)**, **мультиподпись (signed_by [{user, name, signed_at}])**.
**Шаблоны (DocumentTemplate):** Jinja2-контент + поля [{name,label,type,required,default}] — генерация документа по форме.
**Маршруты согласования (ApprovalRoute + ApprovalStep):** шаги [{роль, действие, лейбл}], напр. **юрист → бухгалтер → директор**; каждый шаг — approver, статус (pending/approved/rejected), комментарий, current_approval_step. 
**UI-функционал:** реестр с фильтрами, карточка документа с маршрутом и историей версий, конструктор маршрута, согласование в один клик.

### 4.7 ЭДО (электронный документооборот) — Enterprise+
Интеграция с **Диадок/СБИС**: отправка/приём, **СФ/УПД/акты**, подписание **КЭП**, архив. Права `edo[view/send/sign]`. Roadmap-этап 50. (Юрист/бухгалтер/директор имеют `edo_*`.)

### 4.8 Channels — корпоративные чаты (`models/channel.py`)
Групповые и личные каналы команды (как Slack/Telegram внутри офиса): создание каналов, обсуждения, упоминания, привязка к задачам/сделкам. Права `channels[view/create/manage]`. **AI в канале** — призвать ассистента в обсуждение.

### 4.9 Calendar (`models/calendar.py`)
Командный календарь: события, встречи, дедлайны задач/сделок, напоминания. Права `calendar[view/create/manage]`. Связь с CRM (next_action_date) и задачами.

### 4.10 HR-модуль
Команда + кадры: оргструктура, карточки сотрудников, онбординг (регламенты из Knowledge), заявки (отпуск/документы — ПРЕДЛОЖЕНИЕ), роли. Права `hr[view/manage]` (HR-менеджер, директор). Roadmap-этап 52.

### 4.11 Knowledge (RAG) — корпоративная база знаний
pgvector + embeddings (OpenAI text-embedding-3-small), `POST /api/knowledge/upload`, `GET /api/knowledge/search` (semantic), `GET /api/knowledge/context` (RAG-контекст в AI). Коннекторы 1С/Bitrix/Confluence/Notion/SharePoint/Диадок (см. A07). Авто-инъекция KB в промпт чата (toggle).

### 4.12 Research — Deep Research (Perplexity-класс)
Итеративный поиск 2–4 мин, **Model Council** (совет моделей), Sparkpages. Права `research[view/start/council]`. Roadmap-этап 45.

### 4.13 Skills — AI-навыки
6 встроенных + кастомные, запуск одной кнопкой. Права `skills[view/manage]`. Переиспользуемые AI-операции (напр. «сделать КП», «разобрать входящие», «отчёт за неделю»).

### 4.14 Reports / Analytics
Отчёты по роли: **воронка** (CRM), задачи по статусам, активность участников, финансы/продажи/проекты. Пропорциональные бары. Права `reports[view/finance/sales/projects]`. `/api/org/stats`, `/api/org/activity`.

### 4.15 Budget — AI-расходы
Контроль трат на AI по команде/участнику/модели. Права `budget[view/manage]`. Связь с тарифными квотами (`plans.py`) и BYOK.

### 4.16 Files — файловый менеджер
Хранилище организации (квота storage_mb по тарифу), папки, доступ по ролям. Права `files[view/upload/manage]`. Roadmap-этап 52.

### 4.17 Team — участники и роли
Список участников, инвайты (`/api/org/members`), смена **org_role** и **профессиональной роли** (dropdown из 10 + отраслевые шаблоны), удаление. Seats по тарифу (10 + доплата 4 990 ₽, или ∞). Права `team[view/manage]`.

### 4.18 Integrations — коннекторы (`models/connector.py`, `connector_bitrix.py`)
**1С** (HTTP REST), **Битрикс24** (OAuth2 REST, sync сделок/задач/контрагентов), **WhatsApp/VK** (Enterprise+). Roadmap-этап 51. Права `integrations[view/manage]`.

### 4.19 Settings (корп)
Профиль организации (реквизиты ИНН/КПП для счетов), безопасность, подписка/биллинг (см. A09), управление ролями/правами, отраслевой шаблон, интеграции.

---

## 5. Что построено vs что доделать
**Построено (фронт + модели/роуты):** все 27 корп-страниц (§4), система ролей (10 ролей + матрица прав + модули + отраслевые шаблоны + `RolesManager` UI), CRM (модели+API+воронка+активности), Kanban (5-stage + 3 вида задач + Gantt), Workflows (DAG+webhook), Documents (AI-gen), реестр документооборота (записи+шаблоны+маршруты+версии+подписи), Knowledge (pgvector), 6 тарифов (`plans.py`), коннектор Битрикс. Деплоилось на xerocode.space.
**Доделать (глубина, не наличие экранов):** реальный ЭДО Диадок/СБИС (СФ/УПД/КЭП), боевой 1С/Битрикс sync, SMTP/IMAP для CRM-почты с AI-ответами, монетизация (ЮKassa/Stripe), Model Council в Research, расширение матрицы прав. (roadmap-этапы 43–52.)
**Главный гэп — НЕ функционал, а ДИЗАЙН:** экраны собраны функционально, но не приведены к дизайн-системе v3 (плотный профрежим). Это и есть предмет работы с Claude design.

---

## 6. Связь с дизайн-системой v3 (как верстать)
- **Каркас:** `CorporateLayout` = app-side (динамический по `user.modules`) + app-main. Те же токены Carbon/Violet, та же типографика. Но **плотность выше** (профессиональный режим): компактные таблицы, меньше воздуха чем на лендинге, data-density как в Битрикс/Linear — при этом без визуального шума (правила бренда сохраняются).
- **Переиспользуемые компоненты** (добавить в kit): `KanbanBoard` (колонки-стадии + drag), `PipelineBoard` (CRM-воронка), `DealCard`, `ContactRow`, `ActivityTimeline`, `DocRegistryTable`, `ApprovalRouteStepper`, `DocVersionChain`, `RoleSelect` (10 ролей + отрасли), `PermissionMatrix`, `ChannelList`, `CalendarGrid`, `OrgChart` (HR), `ReportFunnel`, `BudgetMeter`, `IntegrationCard`.
- **Цвета статусов** (договорённость 00_INDEX §1.6): стадии CRM/задач/документов используют семантику — won/done/signed → `--ws-code`; lost/rejected → `--sylar`; pending/approval → `--ws-video`; in_progress/active → `--xero`.
- **Воркспейс CORP** в общем сайдбаре (`--ws-corp #4F46E5`) — точка входа в корпоративный режим.

## 7. Что решить с Claude design (открытые вопросы)
1. **Единый режим или переключатель?** CORP — это отдельный «режим» (CorporateLayout) или просто воркспейс в общем сайдбаре? (Раньше был admin-toggle корп/обычный.)
2. **Плотность UI** — насколько «как Битрикс»: таблицы/компактность vs воздух дизайн-системы v3. Найти баланс.
3. **Динамический sidebar** — как показываем урезанный набор модулей (по роли) красиво, без «пустоты».
4. **Дашборд по ролям** — 3+ варианта (finance/sales/projects) — единый каркас, разные виджеты.
5. **CRM-воронка** — стадий 8 (lead…post_sale): помещаются ли колонки, как на узких экранах.
6. **Документооборот** — визуализация маршрута согласования (степпер ролей) и цепочки версий.
7. **Приоритет реализации** — что доводим первым (CRM? задачи? документооборот?).
8. **RoleFlow vs XeroCode CORP** — где граница (CORP = до ∞ seats на Ent+, RoleFlow = 200+ аудит-слой): не дублируем ли.

## 8. Действие по A09
Поправить `A09_account_settings_billing.md` §6 — заменить предположительные цены на **реальные 6 тарифов из `plans.py`** (Free/Go 490/Pro 1990/Prime 9990/Enterprise 24990/Enterprise+ 79990), CORP-модули с Enterprise. Готов применить.
