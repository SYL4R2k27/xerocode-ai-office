import { useEffect, useRef } from "react";
import { XEROCODE_V3_BODY_HTML } from "./xerocode-v3.body";
import "../../../styles/xerocode-v3.css";

/**
 * XeroDesignShowcase — пиксель-в-пиксель воспроизводит /XEROCODE_FULL.html
 * внутри React-приложения, без потери дизайна.
 *
 * Стили в `src/styles/xerocode-v3.css` (namespace .x3-root).
 * Body-HTML в `xerocode-v3.body.ts` (auto-extracted).
 * JS-эффекты (karaoke / nav-scroll / magnetic / reveal) — реализованы здесь
 * через React refs + useEffect, без зависимостей от DOM-listeners из исходника.
 */
export function XeroDesignShowcase() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // ── 1. Nav scrolled state ─────────────────────────────────────────
  useEffect(() => {
    const nav = rootRef.current?.querySelector<HTMLElement>("#nav");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── 2. IntersectionObserver reveal ────────────────────────────────
  useEffect(() => {
    const targets = rootRef.current?.querySelectorAll<HTMLElement>(".reveal");
    if (!targets || targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── 3. Magnetic buttons (mousemove offset) ────────────────────────
  useEffect(() => {
    const btns = rootRef.current?.querySelectorAll<HTMLElement>(
      ".btn-primary, .nav-cta"
    );
    if (!btns) return;
    const cleanups: Array<() => void> = [];
    btns.forEach((btn) => {
      const onMove = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      };
      const onLeave = () => {
        btn.style.transform = "";
      };
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  // ── 4. Karaoke hero scroll-reveal ─────────────────────────────────
  useEffect(() => {
    const heroSection = rootRef.current?.querySelector<HTMLElement>("#hero");
    const words = rootRef.current?.querySelectorAll<HTMLElement>("#hero-text .w");
    if (!heroSection || !words || words.length === 0) return;
    const total = words.length;

    const onScroll = () => {
      const rect = heroSection.getBoundingClientRect();
      const sectionHeight = heroSection.offsetHeight;
      const viewportH = window.innerHeight;
      const scrolled = -rect.top;
      const totalScroll = sectionHeight - viewportH;
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll));
      const litCount = Math.floor(Math.min(1, progress * 1.4) * total);
      words.forEach((w, i) => {
        if (i < litCount) w.classList.add("lit");
        else w.classList.remove("lit");
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={rootRef}
      className="x3-root"
      // Содержимое больше 60KB — авто-extract из /XEROCODE_FULL.html.
      // Безопасно: HTML — наш собственный source-of-truth, не пользовательский input.
      dangerouslySetInnerHTML={{ __html: XEROCODE_V3_BODY_HTML }}
    />
  );
}
