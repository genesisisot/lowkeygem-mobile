import React from 'react'
import { motion } from 'motion/react'

type BxVariant = 'primary' | 'ghost' | 'danger'

interface BxButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: BxVariant
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  type?: 'button' | 'submit'
}

const variantClass: Record<BxVariant, string> = {
  primary: 'bx__btn',
  ghost: 'bx__btn bx__btn--ghost',
  danger: 'bx__btn bx__btn--danger',
}

export function BxButton({
  children, onClick, variant = 'primary', size = 'md',
  disabled, className = '', style, type = 'button',
}: BxButtonProps) {
  const cls = `${variantClass[variant]} ${size === 'sm' ? 'bx__btn--sm' : ''} ${className}`.trim()
  return (
    <motion.button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      style={style}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      {children}
    </motion.button>
  )
}
