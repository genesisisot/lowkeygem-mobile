import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { EASE_OUT, useReducedMotion } from '../lib/motion';

interface CountUpProps {
  /** Target numeric value to count to. */
  value: number;
  /** Format the (animating) number into the displayed string. Defaults to locale integer. */
  format?: (n: number) => string;
  /** Animation duration in seconds. */
  duration?: number;
}

/**
 * Animates a number from 0 → value on mount and whenever `value` changes.
 * Respects prefers-reduced-motion (snaps straight to the value).
 */
export function CountUp({ value, format, duration = 1 }: CountUpProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString());
  const text = useTransform(mv, (n) => fmt(n));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE_OUT });
    return controls.stop;
  }, [value, reduce, duration, mv]);

  return <motion.span>{text}</motion.span>;
}
