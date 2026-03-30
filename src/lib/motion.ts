/**
 * Framer Motion animation presets for SkillSwap KNUST.
 * All durations respect the 400ms maximum rule.
 * Use `useReducedMotion()` in components to skip animations where needed.
 */

import type { Transition, Variants } from "framer-motion";

// ─── Transition presets ────────────────────────────────────────

export const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const easeOut: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.2,
};

export const easeOutSlow: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.35,
};

export const fastTween: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.1,
};

// ─── Page transition ───────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeOut },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};

// ─── Fade up (content reveal) ─────────────────────────────────

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: easeOutSlow },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ─── Scale in (modals, popovers) ──────────────────────────────

export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: spring },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

// ─── Card hover lift ──────────────────────────────────────────

export const cardHoverVariants = {
  rest:  { y: 0,  boxShadow: "var(--shadow-sm)" },
  hover: { y: -2, boxShadow: "var(--shadow-md)", transition: fastTween },
  tap:   { scale: 0.98, transition: fastTween },
};

// ─── Button press ─────────────────────────────────────────────

export const buttonTapVariants = {
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

// ─── Stagger container ────────────────────────────────────────

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: easeOutSlow },
};

// ─── Counter ──────────────────────────────────────────────────

export const counterVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: springGentle },
};

// ─── Slide in from right (drawer, sheet) ─────────────────────

export const slideInRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springGentle },
  exit:    { x: "100%", opacity: 0, transition: { duration: 0.2 } },
};

// ─── Checkmark draw ───────────────────────────────────────────

export const checkCircleVariants: Variants = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { type: "tween", ease: "easeOut", duration: 0.35 }, opacity: { duration: 0.1 } },
  },
};
