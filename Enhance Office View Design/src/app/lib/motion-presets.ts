/**
 * XEROCODE · Motion Presets v3.0
 * Используй эти пресеты везде вместо inline-объектов motion.
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 09
 */

import type { Variants, Transition } from "motion/react";

// ──────────────────────────────────────────────────────────
// Easing curves
// ──────────────────────────────────────────────────────────

export const easings = {
  emphasis:   [0.32, 0.72, 0.0, 1.0] as const,   // ⭐ default
  decelerate: [0.0,  0.0,  0.2, 1.0] as const,
  accelerate: [0.4,  0.0,  1.0, 1.0] as const,
  spring:     [0.34, 1.56, 0.64, 1.0] as const,
  smooth:     [0.4,  0.0,  0.2, 1.0] as const,
} as const;

// ──────────────────────────────────────────────────────────
// Durations
// ──────────────────────────────────────────────────────────

export const durations = {
  instant: 0.10,
  quick:   0.15,
  snappy:  0.20,
  smooth:  0.30,
  slow:    0.45,
  glacial: 0.80,
} as const;

// ──────────────────────────────────────────────────────────
// PRESETS — used directly in <motion.div animate={...}>
// ──────────────────────────────────────────────────────────

/** 1. AI Pulse — when model is thinking */
export const aiPulse: Variants = {
  pulse: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/** 2. Aurora Shimmer — loading shimmer overlay */
export const auroraShimmer: Variants = {
  shimmer: {
    x: ["-100%", "200%"],
    transition: { duration: 1.6, repeat: Infinity, ease: "linear" },
  },
};

/** 3. Card Lift — interactive cards on hover */
export const cardLift: Variants = {
  rest: { y: 0, boxShadow: "var(--shadow-md)" },
  hover: {
    y: -4,
    boxShadow: "var(--shadow-lg), var(--shadow-glow)",
    transition: { duration: durations.snappy, ease: easings.smooth },
  },
};

/** 4. Stagger Reveal — list/grid appearance */
export const staggerList: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: easings.emphasis },
  },
};

/** 5. Modal Bloom — scale + blur fade */
export const modalBloom: Variants = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: durations.smooth, ease: easings.emphasis },
  },
};

/** 6. Page Transition — between routes */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.25, ease: easings.decelerate },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: durations.quick, ease: easings.accelerate },
  },
};

/** 7. Sidebar Slide */
export const sidebarSlide: Variants = {
  expanded: {
    width: 260,
    transition: { duration: durations.smooth, ease: easings.emphasis },
  },
  collapsed: {
    width: 64,
    transition: { duration: durations.smooth, ease: easings.emphasis },
  },
};

/** 8. Spring Pop — для CTA, важных элементов */
export const springPop: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.04,
    transition: { duration: durations.smooth, ease: easings.spring },
  },
  tap: { scale: 0.98 },
};

/** 9. Drawer Slide — bottom sheet, side panel */
export const drawerSlide: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0, opacity: 1,
    transition: { duration: durations.smooth, ease: easings.emphasis },
  },
  exit: {
    x: "100%", opacity: 0,
    transition: { duration: durations.snappy, ease: easings.accelerate },
  },
};

/** 10. Fade In — простое появление */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.slow, ease: easings.smooth },
  },
};

// ──────────────────────────────────────────────────────────
// Common transition shortcuts
// ──────────────────────────────────────────────────────────

export const t = {
  quick:   { duration: durations.quick,  ease: easings.smooth }   as Transition,
  snappy:  { duration: durations.snappy, ease: easings.smooth }   as Transition,
  smooth:  { duration: durations.smooth, ease: easings.emphasis } as Transition,
  slow:    { duration: durations.slow,   ease: easings.emphasis } as Transition,
  spring:  { type: "spring", stiffness: 400, damping: 25 }        as Transition,
};
