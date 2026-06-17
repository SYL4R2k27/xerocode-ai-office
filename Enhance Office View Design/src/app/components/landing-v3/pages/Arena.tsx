/* XeroCode Landing v3 — Арена (sub-page).
   Re-skinned to v3 from V2 ArenaPage. 4 режима (Дуэль / Эволюция / Турнир / Слепой),
   Elo-рейтинг, интерактивный селектор режимов + пример лидерборда. */
import { useState } from "react";
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";
import type { Toast } from "../Header";

const MODES = [
  { id: "duel", icon: "swords", h: "Дуэль", d: "Две модели получают одну задачу. Ты видишь оба ответа и выбираешь лучший. Проигравший теряет Elo.", ex: "GPT-5.4 vs Claude Opus 4.7 — кто лучше напишет маркетинговый текст?" },
  { id: "evo", icon: "git-branch", h: "Эволюция", d: "Модели улучшают ответы друг друга цепочкой. Каждый следующий участник видит предыдущий результат и делает лучше.", ex: "Groq → Claude → GPT-5.4 — каждый шаг улучшает текст." },
  { id: "tour", icon: "trophy", h: "Турнир", d: "Четыре модели, bracket-система. Победители полуфиналов встречаются в финале. Лучшая забирает максимум Elo.", ex: "Четвертьфиналы → полуфиналы → финал. Один победитель." },
  { id: "blind", icon: "eye", h: "Слепой тест", d: "Имена моделей скрыты до голосования. Ты оцениваешь только качество ответа — без предвзятости к бренду.", ex: "Модель A vs Модель B — кто лучше? Имена откроются после выбора." },
];

const STEPS = [
  { n: "01", icon: "swords", h: "Модели соревнуются", d: "AI получают твою задачу и отвечают. Ты видишь результаты и голосуешь." },
  { n: "02", icon: "trending-up", h: "Elo обновляется", d: "После каждого голосования рейтинг пересчитывается: сильные растут, слабые падают." },
  { n: "03", icon: "cpu", h: "Находишь лучшую", d: "Со временем рейтинг показывает, какая модель сильнее именно для твоих задач." },
];

const BOARD = [
  { name: "Claude Opus 4.7", elo: 1487, pct: 100 },
  { name: "GPT-5.4", elo: 1472, pct: 95 },
  { name: "Gemini 2.5 Pro", elo: 1440, pct: 84 },
  { name: "Grok 4", elo: 1418, pct: 77 },
  { name: "Llama 3.1 · Groq", elo: 1361, pct: 58 },
];

const WHY = [
  { icon: "sparkles", t: "Найти лучшую модель для своих задач — объективно, без маркетинга." },
  { icon: "zap", t: "Сэкономить: зачем платить за премиум, если Groq справляется не хуже?" },
  { icon: "git-branch", t: "Улучшить результат — эволюция доводит ответ цепочкой моделей." },
  { icon: "trophy", t: "Просто интересно наблюдать за битвой AI-моделей вживую." },
];

export function ArenaPage({ onBack, onToast }: { onBack: () => void; onToast: Toast }) {
  const [active, setActive] = useState("duel");
  const m = MODES.find((x) => x.id === active) ?? MODES[0];
  return (
    <div className="subpage">
      <SubHero
        eyebrow="Арена"
        title="Пусть модели"
        accent="соревнуются."
        sub="Какая AI лучше справляется именно с твоими задачами? Честный Elo-рейтинг на основе твоих оценок — четыре режима битвы моделей."
        onBack={onBack}
      />
      <div className="pg-wrap">
        <p className="pg-cap">▸ Четыре режима</p>
        <div className="arena-tabs">
          {MODES.map((x) => (
            <button key={x.id} className={"arena-tab" + (active === x.id ? " on" : "")} onClick={() => setActive(x.id)}>
              <AppIcon name={x.icon} size={15} color={active === x.id ? "var(--xero)" : "var(--on-bg-dim)"} />{x.h}
            </button>
          ))}
        </div>
        <div className="arena-panel">
          <div className="arena-panel-top">
            <span className="arena-panel-ico"><AppIcon name={m.icon} size={24} color="var(--xero)" /></span>
            <div>
              <div className="arena-panel-h">{m.h}</div>
              <div className="arena-panel-tag">Режим арены</div>
            </div>
          </div>
          <p className="arena-panel-d">{m.d}</p>
          <div className="arena-ex">
            <div className="lab">Пример</div>
            <div className="txt">{m.ex}</div>
          </div>
        </div>

        <p className="pg-cap">▸ Как работает рейтинг</p>
        <div className="arena-steps">
          {STEPS.map((s) => (
            <div className="astep" key={s.n}>
              <span className="astep-ico"><AppIcon name={s.icon} size={20} color="var(--xero)" /></span>
              <span className="astep-n">{s.n}</span>
              <div className="astep-h">{s.h}</div>
              <p className="astep-d">{s.d}</p>
            </div>
          ))}
        </div>

        <p className="pg-cap">▸ Пример лидерборда</p>
        <div className="arena-board">
          <div className="board-head">
            <span className="board-title">Elo · общий зачёт</span>
            <span className="board-note">пример · твой рейтинг считается по твоим оценкам</span>
          </div>
          {BOARD.map((b, i) => (
            <div className="board-row" key={b.name}>
              <span className="board-rank">{i + 1}</span>
              <span className="board-name">{b.name}</span>
              <span className="board-bar"><i style={{ width: b.pct + "%" }} /></span>
              <span className="board-elo">{b.elo}</span>
            </div>
          ))}
        </div>

        <p className="pg-cap">▸ Зачем это нужно</p>
        <div className="arena-why">
          {WHY.map((w, i) => (
            <div className="why-item" key={i}>
              <span className="why-ico"><AppIcon name={w.icon} size={17} color="var(--xero)" /></span>
              <span className="why-t">{w.t}</span>
            </div>
          ))}
        </div>

        <div className="cta-panel">
          <p className="hero-eyebrow" style={{ justifyContent: "center" }}>Готов проверить?</p>
          <h2 className="cta-title">Запусти<br /><span className="accent">первую дуэль.</span></h2>
          <p className="cta-sub">Дай моделям задачу и выбери победителя — рейтинг начнёт собираться сразу.</p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => { window.location.href = "/"; }}>Открыть Арену</button>
          </div>
          <p className="cta-trust">Дуэль · Эволюция · Турнир · Слепой тест · Elo</p>
        </div>
      </div>
    </div>
  );
}
