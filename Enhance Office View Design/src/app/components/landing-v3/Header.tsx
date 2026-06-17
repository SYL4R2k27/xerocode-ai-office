/* XeroCode Landing v3 — multi-page header.
   Replaces the single-page Nav: persistent across home + sub-pages, with a
   breadcrumb on sub-pages and active-item highlight. v3 look (Carbon + violet). */
import { useState, useEffect } from "react";

export type Toast = (label: string) => void;
export type SubPage = null | "features" | "pricing" | "business" | "arena" | "terminal" | "faq" | "about";

export const PAGE_LABELS: Record<Exclude<SubPage, null>, string> = {
  features: "Возможности",
  pricing: "Тарифы",
  business: "Бизнесу",
  arena: "Арена",
  terminal: "Терминал",
  faq: "FAQ",
  about: "О нас / Контакты",
};

const NAV: { label: string; page: Exclude<SubPage, null> }[] = [
  { label: "Возможности", page: "features" },
  { label: "Тарифы", page: "pricing" },
  { label: "Бизнесу", page: "business" },
  { label: "Арена", page: "arena" },
  { label: "Терминал", page: "terminal" },
  { label: "FAQ", page: "faq" },
  { label: "О нас", page: "about" },
];

export function Header({
  page,
  onNavigate,
  onToast,
}: {
  page: SubPage;
  onNavigate: (p: SubPage) => void;
  onToast: Toast;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const solid = scrolled || page !== null;
  return (
    <nav className={"nav" + (solid ? " scrolled" : "")}>
      <div className="nav-brand" onClick={() => onNavigate(null)}>
        XeroCode<span className="dot"></span>
        {page !== null && <span className="nav-crumb">/ {PAGE_LABELS[page]}</span>}
      </div>
      <div className="nav-menu">
        {NAV.map((n) => (
          <a key={n.page} className={page === n.page ? "on" : ""} onClick={() => onNavigate(n.page)}>{n.label}</a>
        ))}
      </div>
      <button className="nav-cta" onClick={() => { window.location.href = "/"; }}>Начать бесплатно</button>
    </nav>
  );
}
