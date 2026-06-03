/**
 * Shared motion tokens so animations feel consistent across the app.
 *
 * The app already uses the cubic-bezier (0.16, 1, 0.3, 1) "ease-out-expo" curve in a
 * few places (SwipeCard, dashboard.css); this centralizes it plus the common spring
 * presets. Always pair motion with `useReducedMotion()` (re-exported here) so users
 * who prefer reduced motion get instant, non-animated states.
 */
export { useReducedMotion } from 'motion/react';

import type { Transition, Variants } from 'motion/react';

/** Ease-out-expo — our signature "settle" curve. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Springs */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 420, damping: 32 };
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 300, damping: 18 };

/** A quick tween using the signature curve. */
export const tween = (duration = 0.35): Transition => ({ duration, ease: EASE_OUT });

/** Standard fade+rise used for cards/sections appearing. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: tween(0.4) },
};

/** Stagger container — children should use `fadeRise` (or similar). */
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** View-switch transition for AnimatePresence mode="wait". */
export const viewTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: tween(0.3) },
  exit: { opacity: 0, y: -8, transition: tween(0.2) },
};

/** Press feedback for buttons/cards (use as whileTap). */
export const pressScale = { scale: 0.96 };
export const hoverLift = { scale: 1.02 };
