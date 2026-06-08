/* XeroCode Landing v3 — Возможности (sub-page).
   Re-skinned to v3 from V2 FeaturesPage (7 category accordion). Content updated
   to current facts: 8 воркспейсов, 10 ролей, Claude Opus 4.7, 152-ФЗ. */
import { useState } from "react";
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";
import type { SubPage } from "../Header";

const CATS: { id: string; icon: string; h: string; d: string; link?: boolean; items: { icon: string; h: string; d: string }[] }[] = [
  {
    id: "orch", icon: "network", h: "Мульти-агентная оркестрация",
    d: "Модели работают как команда: роутер разбивает задачу, агенты выполняют параллельно.",
    items: [
      { icon: "git-branch", h: "Авто / Команда", d: "Роутер сам подбирает модель или собирает команду с лид-оркестратором" },
      { icon: "message-square", h: "Видимый процесс", d: "Кто что сделал — таймлайн команды проигрывается по шагам" },
      { icon: "layers", h: "Smart Router", d: "Автовыбор: прямой → OpenRouter → fallback" },
      { icon: "users", h: "До 20 агентов", d: "Параллельная работа — каждый на своей части задачи" },
    ],
  },
  {
    id: "models", icon: "cpu", h: "14 моделей в чате · 430+ в каталоге",
    d: "Все лучшие AI в одном окне. Свои ключи или наш пул — на выбор.",
    items: [
      { icon: "zap", h: "OpenAI", d: "GPT-5.4, o3, GPT-4.1, gpt-image-2" },
      { icon: "zap", h: "Anthropic", d: "Claude Opus 4.7, Sonnet 4.6, Haiku" },
      { icon: "globe", h: "Google · xAI · Groq", d: "Gemini 2.5, Grok 4, Llama (бесплатно)" },
      { icon: "globe", h: "Российские", d: "YandexGPT 5 Pro, GigaChat Max, T-Pro" },
      { icon: "palette", h: "Stability AI", d: "SD 3.5, upscale, video, 3D — 21 сервис" },
      { icon: "layers", h: "OpenRouter", d: "234+ моделей с fallback" },
      { icon: "cpu", h: "Ollama + Custom", d: "Локальные и свои OpenAI-совместимые" },
      { icon: "key-round", h: "BYOK = ∞", d: "Свои ключи — платишь провайдерам напрямую" },
    ],
  },
  {
    id: "tools", icon: "zap", h: "Tool-calling и генерация",
    d: "AI не просто отвечает — выполняет: код, файлы, картинки, видео, 3D.",
    items: [
      { icon: "code-2", h: "Исполнение кода", d: "Python, JS, bash — sandbox с защитой" },
      { icon: "file-text", h: "Работа с файлами", d: "Создание и редактирование через агента" },
      { icon: "image", h: "Генерация картинок", d: "gpt-image-2, SD 3.5, FLUX — text2img / upscale" },
      { icon: "film", h: "Видео + 3D", d: "Stability Video и Fast 3D из текста" },
    ],
  },
  {
    id: "ws", icon: "layers", h: "Восемь воркспейсов",
    d: "Каждый — рабочее пространство со своими моделями и инструментами.",
    items: [
      { icon: "message-square", h: "Чат · Текст", d: "14 моделей · редактор длинных документов с AI" },
      { icon: "image", h: "Картинки · Код", d: "gpt-image-2 / Pollinations · CLI, MCP, review" },
      { icon: "film", h: "Видео · Звук", d: "Sora · Veo · Runway · Suno · ElevenLabs" },
      { icon: "network", h: "Корпоратив · Оркестрация", d: "CRM / Kanban / HR · no-code DAG" },
    ],
  },
  {
    id: "arena", icon: "swords", h: "Арена — битва моделей",
    d: "Какая модель лучше для твоих задач? Честный рейтинг.", link: true,
    items: [
      { icon: "swords", h: "Дуэль", d: "2 модели, 1 задача — выбираешь лучший ответ" },
      { icon: "git-branch", h: "Эволюция", d: "Модели улучшают ответы друг друга цепочкой" },
      { icon: "trending-up", h: "Турнир", d: "4 модели, bracket, финал" },
      { icon: "filter", h: "Слепой тест", d: "Имена скрыты — оцениваешь только качество" },
    ],
  },
  {
    id: "corp", icon: "building-2", h: "Корпоративный режим",
    d: "Для команд: единый дашборд, роли, документооборот, аналитика.",
    items: [
      { icon: "building-2", h: "CRM · Kanban · HR", d: "Воронка сделок, задачи с ревью, оргструктура" },
      { icon: "scroll-text", h: "Документооборот · ЭДО", d: "Реестр, маршруты согласования, Диадок / СБИС" },
      { icon: "users", h: "10 ролей · RBAC", d: "Матрица прав, отраслевые шаблоны, изоляция данных" },
      { icon: "database", h: "1С · Битрикс24", d: "Импорт сделок, задач, контрагентов" },
    ],
  },
  {
    id: "sec", icon: "shield-check", h: "Безопасность и доступность",
    d: "Данные защищены, работает отовсюду без VPN.",
    items: [
      { icon: "lock", h: "AES-256 (Fernet)", d: "Ключи шифруются, расшифровка только при запросе" },
      { icon: "shield-check", h: "152-ФЗ · изоляция", d: "Данные в РФ, организации разделены по organization_id" },
      { icon: "globe", h: "Без VPN из РФ", d: "EU-прокси (VLESS + REALITY) — просто открываешь сайт" },
      { icon: "send", h: "Везде", d: "Веб, Telegram-бот, CLI, Desktop Agent" },
    ],
  },
];

const STATS = [
  { num: "430+", lab: "моделей" },
  { num: "10", lab: "провайдеров" },
  { num: "8", lab: "воркспейсов" },
  { num: "4", lab: "режима арены" },
];

export function FeaturesPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (p: SubPage) => void }) {
  const [open, setOpen] = useState("orch");
  return (
    <div className="subpage">
      <SubHero
        eyebrow="Возможности"
        title="Что умеет"
        accent="XeroCode."
        sub="Полный набор инструментов для ускорения работы с AI — оркестрация, 430+ моделей, восемь воркспейсов, корп-режим и безопасность для рынка РФ."
        onBack={onBack}
      />
      <div className="feat-wrap">
        <div className="stack-stats feat-stats">
          {STATS.map((s) => (
            <div className="stack-stat" key={s.lab}>
              <span className="ss-num">{s.num}</span>
              <span className="ss-lab">{s.lab}</span>
            </div>
          ))}
        </div>

        <div className="feat-list">
          {CATS.map((cat) => {
            const isOpen = open === cat.id;
            return (
              <div className={"feat-cat" + (isOpen ? " open" : "")} key={cat.id}>
                <div className="feat-cat-head" onClick={() => setOpen(isOpen ? "" : cat.id)}>
                  <span className="feat-cat-ico"><AppIcon name={cat.icon} size={22} color="var(--xero)" /></span>
                  <div className="feat-cat-meta">
                    <div className="feat-cat-h">{cat.h}</div>
                    <div className="feat-cat-d">{cat.d}</div>
                  </div>
                  <span className="feat-cat-n">{cat.items.length}</span>
                  <span className="feat-cat-chev"><AppIcon name="chevron-down" size={18} /></span>
                </div>
                <div className="feat-cat-body">
                  <div className="feat-cat-inner">
                    <div className="feat-grid">
                      {cat.items.map((f) => (
                        <div className="feat-item" key={f.h}>
                          <span className="feat-item-ico"><AppIcon name={f.icon} size={15} color="var(--xero)" /></span>
                          <div>
                            <div className="feat-item-h">{f.h}</div>
                            <p className="feat-item-d">{f.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cat.link && (
                      <button className="feat-link" onClick={() => onNavigate("arena")}>
                        Подробнее об Арене <AppIcon name="arrow-right" size={14} color="var(--xero)" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
