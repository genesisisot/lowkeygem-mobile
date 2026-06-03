import React from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { BxButton } from './BxButton'

interface BxEmptyProps {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel?: string
  onCtaClick?: () => void
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

export function BxEmpty({
  icon: Icon, title, description,
  ctaLabel, onCtaClick,
  secondaryLabel, onSecondaryClick,
}: BxEmptyProps) {
  return (
    <motion.div
      className="bx__empty"
      style={{ padding: '60px 20px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--bx-accent-rgb),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Icon style={{ width: 36, height: 36, color: 'var(--bx-accent-2)' }} />
      </motion.div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--bx-muted)', maxWidth: 280, margin: '0 auto 24px' }}>
        {description}
      </p>
      <div className="bx__row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {ctaLabel && onCtaClick && (
          <BxButton onClick={onCtaClick}>{ctaLabel}</BxButton>
        )}
        {secondaryLabel && onSecondaryClick && (
          <BxButton variant="ghost" onClick={onSecondaryClick}>{secondaryLabel}</BxButton>
        )}
      </div>
    </motion.div>
  )
}
