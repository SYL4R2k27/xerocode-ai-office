/* XeroCode Landing v3 — shared sub-page scaffold.
   v3 hero for sub-pages (eyebrow ▸ + Space Grotesk title + "← На главную"),
   replacing the old SubPageHero (Playfair serif + mesh + ⌘ — forbidden in v3).
   Plus a graceful placeholder for sub-pages not yet ported. */
import type { ReactNode } from "react";
import { AppIcon } from "./Icon";
import { PAGE_LABELS, type SubPage } from "./Header";

export function SubHero({
  eyebrow,
  title,
  accent,
  sub,
  onBack,
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  sub?: string;
  onBack: () => void;
}) {
  return (
    <section className="subhero">
      <button className="subhero-back" onClick={onBack}>← На главную</button>
      <div className="section-num">{eyebrow}</div>
      <h1 className="subhero-title">
        {title}
        {accent && <> <span className="accent">{accent}</span></>}
      </h1>
      {sub && <p className="subhero-sub">{sub}</p>}
    </section>
  );
}

export function SubComingSoon({ page, onBack }: { page: Exclude<SubPage, null>; onBack: () => void }) {
  return (
    <div className="subpage">
      <SubHero
        eyebrow={PAGE_LABELS[page]}
        title="Раздел"
        accent="на v3 — скоро."
        sub="Эта подстраница уже есть в продукте — переносим её на новую стилистику и обновляем контент следующей итерацией."
        onBack={onBack}
      />
      <div className="soon">
        <div className="soon-card">
          <span className="soon-ico"><AppIcon name="layers" size={22} color="var(--xero)" /></span>
          <div>
            <div className="soon-h">«{PAGE_LABELS[page]}» переносится на v3</div>
            <p className="soon-p">Берём контент из текущего раздела и обновляем под актуальное. Готова — «Тарифы»; остальные по очереди.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
