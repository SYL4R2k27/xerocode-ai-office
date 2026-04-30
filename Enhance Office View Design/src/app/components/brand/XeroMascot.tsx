/**
 * XEROCODE Mascot — "Xero" living spark
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 22
 *
 * Behaviour:
 * - Follows cursor with lerp(0.06)
 * - Eyes track cursor (±2px pupil offset)
 * - States: idle / thinking / happy / love / error / sleep / wink / surprise
 * - Click → cycles emotion (wave of reactions)
 * - Hover на CTA → thinking
 * - Sleep mode after 60s no movement
 * - Respects prefers-reduced-motion
 *
 * NO TRAIL — fixed: убран "лазерный" след.
 */
import { useEffect, useRef, useState } from "react";

export type MascotState =
  | "idle"
  | "thinking"
  | "happy"
  | "love"
  | "wink"
  | "surprise"
  | "error"
  | "sleep";

interface XeroMascotProps {
  enabled?: boolean;
  state?: MascotState;
  size?: number;
  offsetX?: number;
  offsetY?: number;
}

// Палитра тел маскота под состояние
const BODY_GRADIENTS: Record<MascotState, string> = {
  idle:     "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #A88AFF 30%, #7C5CFF 60%, #00D4FF 100%)",
  thinking: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #A88AFF 30%, #7C5CFF 60%, #00D4FF 100%)",
  happy:    "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFE0A0 30%, #FFB547 60%, #FF8B47 100%)",
  love:     "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFB0D5 30%, #FF6BFF 60%, #C748FF 100%)",
  wink:     "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #A88AFF 30%, #7C5CFF 60%, #00D4FF 100%)",
  surprise: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFF6A0 30%, #FFE547 60%, #FFB547 100%)",
  error:    "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FF8888 30%, #FF3B5C 60%, #2D1880 100%)",
  sleep:    "radial-gradient(circle at 35% 30%, #C7C7E0 0%, #7575A8 50%, #4A4A7C 100%)",
};

const HALO_COLORS: Record<MascotState, string> = {
  idle:     "rgba(124,92,255,0.45)",
  thinking: "rgba(124,92,255,0.55)",
  happy:    "rgba(255,181,71,0.55)",
  love:     "rgba(255,107,255,0.55)",
  wink:     "rgba(124,92,255,0.45)",
  surprise: "rgba(255,229,71,0.55)",
  error:    "rgba(255,59,92,0.55)",
  sleep:    "rgba(117,117,168,0.20)",
};

// Эмоция, которая случайно проигрывается при клике
const CLICK_EMOTIONS: MascotState[] = ["happy", "love", "wink", "surprise"];

export function XeroMascot({
  enabled = true,
  state: externalState,
  size = 56,
  offsetX = -100,
  offsetY = 30,
}: XeroMascotProps) {
  const mascotRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const eyeLRef = useRef<HTMLDivElement>(null);
  const eyeRRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MascotState>("idle");
  const lastMoveRef = useRef(Date.now());
  const positionRef = useRef({ x: 50, y: typeof window !== "undefined" ? window.innerHeight * 0.7 : 600 });
  const stateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // External override
  useEffect(() => {
    if (externalState) setState(externalState);
  }, [externalState]);

  // Helper: temporarily set a state, then return to idle
  const flashState = (s: MascotState, durationMs = 700) => {
    if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    setState(s);
    stateTimeoutRef.current = setTimeout(() => {
      if (!externalState) setState("idle");
    }, durationMs);
  };

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mouseX = window.innerWidth * 0.3;
    let mouseY = window.innerHeight * 0.7;
    let rafId = 0;
    let clickStreak = 0;
    let clickStreakTimer: ReturnType<typeof setTimeout> | null = null;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveRef.current = Date.now();
      if (state === "sleep" && !externalState) setState("idle");
    };

    const onClick = () => {
      if (externalState) return;

      // Стрик кликов: после 3+ кликов подряд — love
      clickStreak++;
      if (clickStreakTimer) clearTimeout(clickStreakTimer);
      clickStreakTimer = setTimeout(() => { clickStreak = 0; }, 1500);

      let emotion: MascotState;
      if (clickStreak >= 3) {
        emotion = "love";
        clickStreak = 0;
      } else {
        emotion = CLICK_EMOTIONS[Math.floor(Math.random() * CLICK_EMOTIONS.length)];
      }
      flashState(emotion, 800);
    };

    // Hover на CTA-элементы → thinking
    const ctaSelectors =
      "[data-mascot-trigger], button[type='submit'], a[href]:not([data-no-mascot])";

    const onCtaEnter = () => {
      if (externalState) return;
      setState("thinking");
    };
    const onCtaLeave = () => {
      if (externalState) return;
      setState("idle");
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick);

    const ctas = document.querySelectorAll<HTMLElement>(ctaSelectors);
    ctas.forEach((el) => {
      el.addEventListener("mouseenter", onCtaEnter);
      el.addEventListener("mouseleave", onCtaLeave);
    });

    // Tab visibility — если юзер ушёл на другую вкладку, маскот спит
    const onVisibility = () => {
      if (document.hidden && !externalState) {
        setState("sleep");
      } else if (!document.hidden && state === "sleep" && !externalState) {
        setState("idle");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = () => {
      const m = mascotRef.current;
      if (!m) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const targetX = mouseX + offsetX;
      const targetY = mouseY + offsetY;
      positionRef.current.x += (targetX - positionRef.current.x) * 0.06;
      positionRef.current.y += (targetY - positionRef.current.y) * 0.06;

      const w = m.offsetWidth;
      positionRef.current.x = Math.max(8, Math.min(window.innerWidth - w - 8, positionRef.current.x));
      positionRef.current.y = Math.max(8, Math.min(window.innerHeight - w - 8, positionRef.current.y));

      m.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0)`;

      // Eye tracking — pupils look at cursor
      const cx = positionRef.current.x + w / 2;
      const cy = positionRef.current.y + w / 2;
      const ang = Math.atan2(mouseY - cy, mouseX - cx);
      const offX = Math.cos(ang) * 2;
      const offY = Math.sin(ang) * 2;
      if (eyeLRef.current) eyeLRef.current.style.transform = `translate(${offX}px, ${offY}px)`;
      if (eyeRRef.current) eyeRRef.current.style.transform = `translate(${offX}px, ${offY}px)`;

      // Sleep after 60s idle
      if (Date.now() - lastMoveRef.current > 60_000 && state !== "sleep" && !externalState) {
        setState("sleep");
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
      if (clickStreakTimer) clearTimeout(clickStreakTimer);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      ctas.forEach((el) => {
        el.removeEventListener("mouseenter", onCtaEnter);
        el.removeEventListener("mouseleave", onCtaLeave);
      });
    };
  }, [enabled, externalState, offsetX, offsetY, state]);

  if (!enabled) return null;

  // Animation per-state (на body)
  const isHappy = state === "happy" || state === "love";
  const isThinking = state === "thinking";
  const isSurprise = state === "surprise";
  const isWink = state === "wink";
  const isError = state === "error";
  const isSleep = state === "sleep";

  // Eye rendering helpers
  const eyeBase = {
    position: "absolute" as const,
    width: 6,
    height: 6,
    background: "var(--void-950)",
    borderRadius: "50%",
    top: "38%",
    transition: "transform 200ms ease-out, height 150ms ease-out",
  };

  // Состояния глаз
  const eyeShapeL = (() => {
    if (isWink) {
      return { ...eyeBase, height: 1, top: "calc(38% + 2.5px)", borderRadius: 1 };
    }
    if (isHappy) {
      return { ...eyeBase, height: 2, top: "calc(38% + 2px)", borderRadius: 2 };
    }
    if (isSurprise) {
      return { ...eyeBase, width: 8, height: 8, top: "36%" };
    }
    if (isError) {
      return { ...eyeBase, transform: "rotate(45deg) scaleY(0.3)" };
    }
    if (isSleep) {
      return { ...eyeBase, height: 1, top: "calc(38% + 2.5px)", borderRadius: 1 };
    }
    return eyeBase;
  })();

  const eyeShapeR = (() => {
    if (isWink) {
      // только левый глаз подмигивает
      return eyeBase;
    }
    if (isHappy) {
      return { ...eyeBase, height: 2, top: "calc(38% + 2px)", borderRadius: 2 };
    }
    if (isSurprise) {
      return { ...eyeBase, width: 8, height: 8, top: "36%" };
    }
    if (isError) {
      return { ...eyeBase, transform: "rotate(-45deg) scaleY(0.3)" };
    }
    if (isSleep) {
      return { ...eyeBase, height: 1, top: "calc(38% + 2.5px)", borderRadius: 1 };
    }
    return eyeBase;
  })();

  return (
    <div
      ref={mascotRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        zIndex: 1000,
        pointerEvents: "none",
        transition: "opacity 600ms ease",
        opacity: isSleep ? 0.4 : 1,
        willChange: "transform",
        filter: `drop-shadow(0 0 24px ${HALO_COLORS[state]})`,
        animation: isHappy
          ? "xc-mascot-bounce 0.6s var(--ease-spring) infinite"
          : "xc-mascot-idle 3s ease-in-out infinite",
      }}
    >
      {/* Halo (glow) */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HALO_COLORS[state]} 0%, transparent 60%)`,
          animation: "xc-mascot-glow 2s ease-in-out infinite",
        }}
      />

      {/* Body */}
      <div
        ref={bodyRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: BODY_GRADIENTS[state],
          position: "relative",
          transition: "background 400ms ease",
          animation: isThinking ? "xc-mascot-spin 1s linear infinite" : undefined,
          transform: isSurprise ? "scale(1.15)" : undefined,
        }}
      >
        {/* Eyes (скрыты во время thinking — вращается) */}
        {!isThinking && (
          <>
            <div
              ref={eyeLRef}
              style={{ ...eyeShapeL, left: "30%" }}
            />
            <div
              ref={eyeRRef}
              style={{ ...eyeShapeR, right: "30%" }}
            />
          </>
        )}

        {/* Рот / выражение */}
        {isHappy && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "62%",
              transform: "translateX(-50%)",
              width: 14,
              height: 7,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
              borderBottom: "2px solid var(--void-950)",
              borderLeft: "2px solid transparent",
              borderRight: "2px solid transparent",
              borderTop: "0",
            }}
          />
        )}
        {isSurprise && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "62%",
              transform: "translateX(-50%)",
              width: 7,
              height: 8,
              borderRadius: "50%",
              background: "var(--void-950)",
            }}
          />
        )}
        {isError && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "64%",
              transform: "translateX(-50%)",
              width: 10,
              height: 2,
              borderRadius: 2,
              background: "var(--void-950)",
            }}
          />
        )}
        {state === "love" && (
          <>
            {/* Heart eyes */}
            <span
              style={{
                position: "absolute",
                left: "26%",
                top: "32%",
                fontSize: 10,
                lineHeight: 1,
                color: "#FF3B5C",
              }}
            >
              ♥
            </span>
            <span
              style={{
                position: "absolute",
                right: "26%",
                top: "32%",
                fontSize: 10,
                lineHeight: 1,
                color: "#FF3B5C",
              }}
            >
              ♥
            </span>
          </>
        )}
        {isSleep && (
          <span
            style={{
              position: "absolute",
              right: "8%",
              top: "10%",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--ink-200)",
              opacity: 0.7,
              animation: "xc-mascot-glow 2s ease-in-out infinite",
            }}
          >
            z
          </span>
        )}
      </div>
    </div>
  );
}
