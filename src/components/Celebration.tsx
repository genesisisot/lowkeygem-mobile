import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OUT, useReducedMotion } from '../lib/motion';

interface CelebrationProps {
  show: boolean;
  onDone: () => void;
  /** Particle count (default 40). */
  count?: number;
  /** ms before auto-dismiss (default 1700). */
  duration?: number;
}

const COLORS = ['var(--bx-accent)', '#e11d6b', 'var(--bx-accent-2)', '#41e0d0', '#f4d03f', '#0f9d76'];

/**
 * A lightweight, dependency-free confetti burst for celebratory moments
 * (new match, job completed). Respects prefers-reduced-motion by rendering
 * nothing animated. Mount once and toggle `show`.
 */
export function Celebration({ show, onDone, count = 40, duration = 1700 }: CelebrationProps) {
  const reduce = useReducedMotion();

  // Pre-compute random particle trajectories once per "show" cycle.
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 140 + Math.random() * 220;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 60, // bias upward so it "pops"
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 8,
        delay: Math.random() * 0.08,
        round: Math.random() > 0.5,
      };
    });
    // Re-randomize each time it's shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, count]);

  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(onDone, reduce ? 400 : duration);
    return () => window.clearTimeout(t);
  }, [show, onDone, duration, reduce]);

  if (reduce) return null; // no motion for reduced-motion users

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.6 }}
              transition={{ duration: 1.1, ease: EASE_OUT, delay: p.delay }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.round ? '9999px' : '2px',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
