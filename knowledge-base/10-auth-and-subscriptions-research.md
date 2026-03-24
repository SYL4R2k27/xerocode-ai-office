# 10. Аутентификация, подписки и защита данных в SaaS

> Исследование лучших практик на основе анализа 10 платформ (Cursor, v0.dev, Replit, Lovable, GitHub Copilot, ChatGPT, Claude.ai, Linear, Notion, Figma) + требования для российского рынка.

---

## Часть 1. Анализ платформ

### 1.1 Cursor (AI Code Editor)

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email/password, Google OAuth, GitHub OAuth |
| **Magic link** | Нет |
| **SSO/SAML** | Только Business план |
| **2FA** | Нет нативной поддержки (запросы в community). Наследуется от Google/GitHub если используется OAuth |
| **Пароль** | Требования не документированы публично |
| **Удаление аккаунта** | Да — Settings > Advanced > Delete Account. Данные удаляются в течение 30 дней |
| **Профиль** | Базовый — имя, email, план подписки |
| **GDPR** | Гарантируют удаление данных в течение 30 дней |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Hobby | Бесплатно | 2000 автодополнений/мес, 50 медленных запросов |
| Pro | $20/мес | 500 быстрых запросов (с июня 2025 — $20 кредитов) |
| Pro+ | $60/мес | Больше кредитов |
| Ultra | $200/мес | Максимум кредитов |
| Business | $40/user/мес | SSO/SAML, управление командой |

**Управление подпиской:** Через Settings dashboard. Upgrade/downgrade мгновенный. Годовая оплата -20%.

---

### 1.2 v0.dev (Vercel AI)

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Через аккаунт Vercel (email, GitHub OAuth, GitLab, Bitbucket) |
| **Magic link** | Нет |
| **SSO/SAML** | Enterprise |
| **2FA** | Через Vercel account settings |
| **Удаление аккаунта** | Через настройки Vercel |
| **Профиль** | Наследуется от Vercel — имя, email, аватар, подключенные Git-провайдеры |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Free | $0 | $5 кредитов/мес |
| Premium | $20/мес | Больше кредитов, доступ к топ-моделям |
| Team | $30/user/мес | Командные возможности |
| Enterprise | Custom | SSO, SLA, выделенная поддержка |

**Система кредитов:** С 2025 года — кредиты привязаны к токенам (input/output). Можно докупить on-demand.

---

### 1.3 Replit

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email/password, Google, GitHub, Apple, X (Twitter) |
| **Magic link** | Нет |
| **SSO/SAML** | Enterprise |
| **2FA** | Да |
| **Удаление аккаунта** | Да |
| **Профиль** | Имя, bio, аватар, ссылки на соцсети, публичные проекты |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Starter | Бесплатно | Публичные проекты, базовый AI |
| Core | $25/мес | Agent, приватные проекты, $25 кредитов |
| Teams | $40/user/мес | RBAC, $40 кредитов/seat |
| Enterprise | Custom | Приватная инфраструктура, compliance |

**Модель:** Подписка + usage-based кредиты. Превышение лимита — доплата.

---

### 1.4 Lovable (ex-GPT Engineer)

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email, Google OAuth, GitHub OAuth |
| **Magic link** | Нет |
| **SSO** | Business план ($50/мес) |
| **2FA** | Не документировано |
| **Удаление аккаунта** | Да |
| **Профиль** | Базовый — имя, email |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Free | $0 | 5 кредитов/день, публичные проекты |
| Pro | $25/мес | 100 кредитов/мес, приватные проекты, rollover |
| Business | $50/мес | SSO, больше кредитов, шаблоны дизайна |
| Enterprise | Custom | Выделенная поддержка, onboarding |

**Особенности:** Скидка 50% для студентов. Годовая оплата экономит $50-100.

---

### 1.5 GitHub Copilot

| Параметр | Значение |
|----------|----------|
| **Auth методы** | GitHub аккаунт (email/password, GitHub OAuth) |
| **Magic link** | Нет |
| **SSO/SAML** | Business и Enterprise (через GitHub Enterprise Cloud) |
| **2FA** | Да — через GitHub 2FA (TOTP, SMS, security keys, GitHub Mobile) |
| **Удаление аккаунта** | Через GitHub account settings |
| **Профиль** | GitHub профиль — имя, bio, аватар, username |
| **Passkeys** | Да — через GitHub |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Free | $0 | Ограниченный доступ для студентов и OSS maintainers |
| Pro | $10/мес ($100/год) | 500 быстрых запросов |
| Pro+ | $39/мес ($390/год) | Расширенный доступ |
| Business | ~$19/user/мес | SSO, policy controls, compliance |
| Enterprise | $39/user/мес | Audit logs, advanced compliance |

**Управление:** Админ организации управляет лицензиями. Можно устанавливать бюджеты с уведомлениями на 75%, 90%, 100%.

---

### 1.6 ChatGPT (OpenAI)

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email/password, Google OAuth, Microsoft OAuth, Apple OAuth |
| **Magic link** | Нет (но phone-only signup в бета) |
| **SSO/SAML** | Enterprise |
| **2FA/MFA** | Да — Authenticator apps (Google Authenticator, Authy), push notifications, SMS/WhatsApp коды |
| **Удаление аккаунта** | Да — Settings > Data Controls > Delete Account |
| **Профиль** | Имя, email, custom instructions, memory settings |
| **Data export** | Да — Settings > Data Controls > Export Data |
| **Passkeys** | Поддерживается |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Free | $0 | Базовый доступ к GPT-4o |
| Go | Низкая цена | Расширенный базовый доступ |
| Plus | $20/мес | GPT-4o, Deep Research, Sora, Agent mode |
| Pro | $200/мес | Максимальный доступ для профессионалов |
| Team/Business | $25-30/user/мес | Workspace, admin controls, SOC-2 |
| Enterprise | Custom | SSO, audit logs, data residency |

**Управление подпиской:** Settings > Account > Manage Subscription. Upgrade мгновенный, downgrade — в конце периода. Cancel отключает автопродление.

---

### 1.7 Claude.ai (Anthropic)

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email (magic link — ссылка в письме), Google OAuth |
| **Пароль** | Нет выделенного пароля! Только magic link или Google OAuth |
| **SSO/SAML** | Enterprise |
| **2FA** | Нет нативной. Наследуется от Google если используется OAuth |
| **Удаление аккаунта** | Да — через поддержку или настройки |
| **Профиль** | Минимальный — имя, email |
| **Data export** | Да — Settings > Privacy > Export Data (ZIP/JSON) |
| **Data privacy** | Opt-out от обучения на данных |

**Подписки:**
| План | Цена | Что включено |
|------|------|-------------|
| Free | $0 | Базовый Claude, ограниченные сообщения/день |
| Pro | $20/мес (~$17 при годовой) | 5x от Free, приоритет |
| Max 5x | $100/мес | 25x от Free, Claude Code |
| Max 20x | $200/мес | 100x от Free, zero-latency |
| Team | $25/мес ($20 годовая) | Мин. 5 пользователей |
| Enterprise | Custom | SSO, выделенная поддержка |

**Ключевая особенность:** Claude использует passwordless-подход. Логин только через magic link (ссылку на email) или Google OAuth. Это пример "magic link как основной метод".

---

### 1.8 Linear

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email login link, Google OAuth, SAML SSO (Enterprise), Passkeys |
| **Magic link** | Да — основной метод (email login link) |
| **SSO/SAML** | Enterprise |
| **2FA** | Да — SMS код, email код, biometrics |
| **Passkeys** | Да — WebAuthn, поддержка 1Password и др. |
| **Удаление аккаунта** | Через настройки |
| **Профиль** | Имя, аватар, display name, timezone, notification preferences |
| **API keys** | Да — можно создавать/отзывать в Security & Access |

**Подписки:**
| План | Цена (годовая) | Что включено |
|------|------|-------------|
| Free | $0 | Базовые возможности |
| Basic | $8/user/мес | Расширенные возможности |
| Business | $14/user/мес | Продвинутые возможности |
| Enterprise | $20/user/мес | SSO/SAML, SCIM, IP restrictions |

**UX-эталон:** Linear считается одним из лучших примеров UX. Минималистичный дизайн, быстрая загрузка, passkeys как приоритет.

---

### 1.9 Notion

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email/password, Google OAuth, Apple OAuth, SAML SSO (Business+) |
| **Magic link** | Да — при логине через email отправляется код или ссылка |
| **SSO/SAML** | Business и Enterprise |
| **2FA** | Да — 2-step verification для всех планов |
| **Удаление аккаунта** | Да — с 30-дневным периодом до полного удаления |
| **Профиль** | Имя, email, аватар, preferred name, language |
| **Data export** | Да — HTML, Markdown, CSV |
| **GDPR** | Полное соответствие. DPA, право на удаление, data portability |

**Подписки:**
| План | Цена (годовая) | Что включено |
|------|------|-------------|
| Free | $0 | Для личного использования |
| Plus | $10/user/мес | Командная работа, unlimited blocks |
| Business | $20/user/мес | SAML SSO, private teamspaces |
| Enterprise | Custom | SCIM, audit logs, advanced security |

**Управление:** Settings & Members > Billing. Invoices доступны для скачивания.

---

### 1.10 Figma

| Параметр | Значение |
|----------|----------|
| **Auth методы** | Email/password, Google SSO, SAML SSO (Organization+) |
| **Magic link** | Нет |
| **SSO/SAML** | Organization и Enterprise (Okta, OneLogin, Microsoft Entra ID, Google Workspace) |
| **SCIM** | Да — Enterprise |
| **2FA** | Да |
| **Удаление аккаунта** | Да |
| **Профиль** | Имя, email, аватар, role, team membership |
| **API** | OAuth 2.0 + Personal Access Tokens |

**Подписки (с марта 2025):**
| План | Цена | Что включено |
|------|------|-------------|
| Starter | Бесплатно | 3 файла Figma, 3 доски FigJam |
| Professional | $12-16/editor/мес | Unlimited файлов, Dev seat |
| Organization | $45-55/editor/мес | SAML SSO, org-wide libraries |
| Enterprise | $90/editor/мес | Advanced security, custom |

**Особенности:** 3 типа мест (Full, Dev, View). View — бесплатно на всех планах. С марта 2025 Organization и Enterprise только годовая оплата.

---

## Часть 2. Сводная таблица Auth-методов

| Платформа | Email/Pass | Google | GitHub | Apple | Microsoft | Magic Link | Passkeys | SSO/SAML | 2FA |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Cursor | + | + | + | - | - | - | - | Business | - |
| v0.dev | + | + | + | - | - | - | - | Enterprise | + |
| Replit | + | + | + | + | - | - | - | Enterprise | + |
| Lovable | + | + | + | - | - | - | - | Business | ? |
| GitHub Copilot | + | - | + | - | - | - | + | Enterprise | + |
| ChatGPT | + | + | - | + | + | - | + | Enterprise | + |
| Claude.ai | - | + | - | - | - | + | - | Enterprise | - |
| Linear | - | + | - | - | - | + | + | Enterprise | + |
| Notion | + | + | - | + | - | + | - | Business+ | + |
| Figma | + | + | - | - | - | - | - | Org+ | + |

### Выводы по Auth:
- **Google OAuth** — есть у 9 из 10 платформ (кроме GitHub Copilot, который сам является OAuth-провайдером)
- **GitHub OAuth** — у 5 из 10 (в основном dev tools)
- **Apple OAuth** — у 3 из 10 (ChatGPT, Replit, Notion)
- **Microsoft OAuth** — только ChatGPT
- **Magic Link** — у 3 из 10 (Claude.ai, Linear, Notion). Claude полностью passwordless
- **Passkeys** — набирают популярность (Linear, ChatGPT, GitHub)
- **2FA** — у 7 из 10 платформ
- **SSO/SAML** — всегда на дорогих планах (Business/Enterprise)

---

## Часть 3. Сводная таблица подписок

| Платформа | Free | Базовый | Pro/Premium | Teams | Enterprise |
|-----------|------|---------|-------------|-------|-----------|
| Cursor | + | — | $20/мес | $40/user | Custom |
| v0.dev | + | — | $20/мес | $30/user | Custom |
| Replit | + | — | $25/мес | $40/user | Custom |
| Lovable | + | — | $25/мес | — | Custom |
| GitHub Copilot | + | $10/мес | $39/мес | $19/user | $39/user |
| ChatGPT | + | — | $20/мес | $25-30/user | Custom |
| Claude.ai | + | — | $20/мес | $25/user | Custom |
| Linear | + | $8/user | $14/user | — | $20/user |
| Notion | + | $10/user | $20/user | — | Custom |
| Figma | + | $12-16/ed | $45-55/ed | — | $90/ed |

### Ценовые паттерны:
- **Free tier** — у всех 10 платформ. Это стандарт индустрии
- **Основной платный план** — $20/мес (ChatGPT, Claude, Cursor, v0)
- **Team seat** — $25-40/user/мес
- **Годовая скидка** — 15-20% у большинства
- **Тренд 2025:** переход от фиксированных лимитов к кредитным системам (Cursor, v0, Replit, Lovable)

---

## Часть 4. Best Practices для SaaS Auth (2025-2026)

### 4.1 Приоритет методов аутентификации

**Рекомендуемая стратегия (от наиболее к наименее приоритетному):**

1. **Passkeys (WebAuthn/FIDO2)** — основной метод для возвращающихся пользователей на зарегистрированных устройствах. Самый безопасный и быстрый. Стал мейнстримом в 2025-2026
2. **Social OAuth** — Google OAuth как must-have. GitHub OAuth для dev tools. Apple для мобильных приложений
3. **Magic Link / OTP** — для новых пользователей и незарегистрированных устройств. Хорошо для low-frequency логинов
4. **Email + Password** — legacy, но все еще нужен как fallback. Используется в комбинации с 2FA

### 4.2 Magic Link vs Password — ключевые аргументы

**За Magic Link:**
- Устраняет проблему забытых паролей (до 94% enterprise-пользователей предпочитают magic links)
- Нет credential stuffing и brute-force атак
- Снижает нагрузку на support
- Отличный UX для non-technical пользователей

**Против Magic Link:**
- Зависимость от email deliverability (спам-фильтры, задержки)
- Уязвимости: перехват email может привести к полному захвату аккаунта
- Плохо для частых логинов (несколько раз в день)
- Не подходит для high-security / regulated environments

**Рекомендация 2026:** Passkeys как основной метод, magic link как fallback, social login как ускоренный путь.

### 4.3 OAuth-провайдеры по популярности

1. **Google** — must-have для любого SaaS (90% платформ)
2. **GitHub** — must-have для developer tools (50% платформ)
3. **Apple** — важен для мобильных приложений (обязателен если есть iOS-app)
4. **Microsoft** — для enterprise B2B SaaS
5. **Yandex** — для российского рынка

### 4.4 Обязательные элементы профиля

- Имя / Display name
- Email (основной идентификатор)
- Аватар
- Часовой пояс
- Языковые настройки
- Настройки уведомлений
- Экспорт данных
- Удаление аккаунта

### 4.5 Обязательные элементы подписки

- Четкое отображение текущего плана и использования
- Upgrade/downgrade в один клик
- Прозрачные invoices с возможностью скачивания
- Возможность отмены без звонка в support
- Уведомления о приближении к лимитам
- Автоматические чеки (особенно для РФ — 54-ФЗ)

---

## Часть 5. Российский рынок

### 5.1 Платежные системы

| Провайдер | Особенности | Подписки | Комиссия |
|-----------|------------|----------|----------|
| **ЮKassa** (Сбербанк) | МИР, SBP QR, SberPay, авто-чеки 54-ФЗ. Крупнейший в РФ | Да — рекуррентные платежи с токенизацией | 2.8-3.5% |
| **CloudPayments** (Тинькофф) | Лучший для подписок, гибкий API, recurring billing | Да — лучшая поддержка recurring | 2.7-3.5% |
| **Robokassa** | Карты, кошельки, SBP QR, recurring | Да — API для рекуррентов | 3.0-5.0% |
| **Тинькофф Оплата** | Интернет-эквайринг, SBP, рассрочка | Да | 2.49-2.99% |

**Рекомендация для ИИ Офис:**
- **CloudPayments** как основной (лучший для SaaS-подписок, гибкий API)
- **ЮKassa** как дополнительный (покрытие SberPay, наибольшая база пользователей)
- Обязательна поддержка: МИР, SBP (Система Быстрых Платежей), банковские карты

### 5.2 Закон 152-ФЗ "О персональных данных" — требования 2025

**Критические изменения с 2025 года:**

1. **Локализация данных (с 01.07.2025):**
   - Прямой запрет на первичный сбор ПД в базы данных за пределами РФ
   - Все данные российских граждан должны первично храниться на серверах в РФ
   - Это значит: нужен российский хостинг (Yandex Cloud, VK Cloud, Selectel)

2. **Согласие на обработку (с 01.09.2025):**
   - Согласие должно быть оформлено отдельным документом
   - Нельзя включать в общие Terms of Service
   - Без отдельного согласия = отсутствие согласия

3. **Уведомление Роскомнадзора:**
   - Обязательное уведомление до начала обработки ПД
   - Любые действия с ПД (сбор, хранение, передача, уничтожение)

4. **Автоматическая проверка:**
   - С 01.07.2025 Роскомнадзор запустил AI-систему автоматической проверки сайтов

5. **Штрафы:**
   - Максимальный штраф за утечку — до 15 млн рублей
   - Штрафы значительно увеличены с мая 2025

**Что нужно сделать для ИИ Офис:**
- [ ] Серверы в РФ для хранения ПД (Yandex Cloud / Selectel)
- [ ] Отдельная форма согласия на обработку ПД
- [ ] Уведомление в Роскомнадзор
- [ ] Политика конфиденциальности на русском языке
- [ ] Механизм удаления данных по запросу пользователя
- [ ] Шифрование ПД at rest и in transit

### 5.3 Что ожидают российские пользователи

**Auth-паттерны в РФ:**
- **Email + пароль** — по-прежнему основной метод
- **Yandex OAuth** — аналог Google OAuth для РФ. Нужно поддерживать
- **VK ID** — второй по популярности OAuth-провайдер в РФ
- **Telegram Login Widget** — растущий тренд, особенно для tech/AI аудитории
- **SMS-верификация** — ожидаемая, но дорогая
- **SBP / QR-код** — для оплаты. Быстро растет

**Рекомендуемые OAuth для РФ:**
1. Google OAuth (универсальный)
2. Yandex ID (российский must-have)
3. VK ID (широкая аудитория)
4. Telegram Login (tech-аудитория)
5. Apple (для iOS)

---

## Часть 6. Рекомендации для ИИ Офис

### 6.1 Auth-стратегия

**MVP (этап 1):**
- Email + magic link (как Claude.ai — простота, безопасность)
- Google OAuth
- Yandex ID OAuth (для РФ аудитории)

**V2 (этап 2):**
- Telegram Login Widget
- VK ID
- 2FA через TOTP (Google Authenticator)
- Passkeys

**Enterprise (этап 3):**
- SAML SSO
- SCIM provisioning
- IP restrictions

### 6.2 Subscription-стратегия

**На основе анализа рынка:**

| Паттерн | Наш подход |
|---------|-----------|
| Free tier у всех | Обязательно — Free план с ограниченными сообщениями |
| $20/мес — стандарт Pro | Адаптировать для РФ рынка (1490-1990 руб/мес) |
| Кредитная система тренд | Рассмотреть для будущих версий |
| Годовая скидка 15-20% | Обязательно — экономия 2 месяца |
| Team plan $25-40/user | Для корпоративных клиентов |

### 6.3 Профиль пользователя — необходимые поля

**Обязательные:**
- Email (primary identifier)
- Display name
- Аватар
- Язык интерфейса (RU/EN)
- Часовой пояс
- Подключенные AI-ключи (уникальная фича ИИ Офис)

**Настройки приватности:**
- Opt-out от аналитики
- Экспорт всех данных
- Удаление аккаунта (с 30-дневным cool-down)
- Управление согласиями на обработку ПД

**Настройки подписки:**
- Текущий план + использование
- История платежей
- Upgrade/downgrade
- Отмена подписки
- Смена платежного метода

### 6.4 Data Protection чеклист

- [ ] HTTPS everywhere (TLS 1.3)
- [ ] Шифрование данных at rest (AES-256)
- [ ] Хеширование паролей (bcrypt/argon2)
- [ ] Rate limiting на auth endpoints
- [ ] CSRF protection
- [ ] Secure session management (HttpOnly, Secure, SameSite cookies)
- [ ] API key encryption в БД
- [ ] Audit logging для auth events
- [ ] Автоматический logout после неактивности
- [ ] Соответствие 152-ФЗ
- [ ] Политика конфиденциальности (RU + EN)
- [ ] DPA (Data Processing Agreement) для enterprise

---

## Часть 7. Технический стек для Auth

### Рекомендуемые решения

| Компонент | Варианты | Рекомендация |
|-----------|----------|-------------|
| Auth library | NextAuth.js / Auth.js, Supabase Auth, Clerk, Lucia | **Supabase Auth** (уже в стеке) или **Auth.js** |
| OAuth providers | Google, Yandex, VK, Telegram | Google + Yandex для MVP |
| 2FA/TOTP | speakeasy, otplib | otplib |
| Password hashing | bcrypt, argon2 | argon2 |
| Session management | JWT + refresh tokens | JWT с коротким TTL + refresh rotation |
| Rate limiting | express-rate-limit, upstash ratelimit | upstash ratelimit (serverless) |
| Email service | Resend, SendGrid, Mailgun | Resend (modern API, хороший deliverability) |
| Payment (RU) | CloudPayments SDK, ЮKassa SDK | CloudPayments |

---

*Исследование проведено: 2026-03-23*
*Источники: официальная документация и pricing pages всех 10 платформ, web search по актуальным данным*
