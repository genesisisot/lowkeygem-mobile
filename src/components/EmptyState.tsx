import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  secondaryCtaLabel,
  onSecondaryCta,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(151,7,71,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon className="w-10 h-10" style={{ color: 'var(--bx-accent)' }} />
      </motion.div>

      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ fontSize: 20, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 8 }}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{ color: 'var(--bx-muted)', fontSize: 14, maxWidth: 320, marginBottom: 24 }}
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        className="sm:flex-row"
      >
        {ctaLabel && onCtaClick && (
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px', borderRadius: 13, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, color: '#fff',
              background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
              boxShadow: 'var(--bx-glow)',
            }}
          >
            {ctaLabel}
          </motion.button>
        )}

        {secondaryCtaLabel && onSecondaryCta && (
          <motion.button
            onClick={onSecondaryCta}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 24px', borderRadius: 13, border: '1px solid var(--bx-line)',
              background: 'var(--bx-card-2)', color: 'var(--bx-ink)',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            {secondaryCtaLabel}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
