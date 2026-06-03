import React from 'react'
import { motion } from 'motion/react'

interface BxCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hover?: boolean
}

export function BxCard({ children, className = '', style, onClick, hover = true }: BxCardProps) {
  const Tag = onClick ? motion.button : motion.div
  const extraProps = onClick ? { whileHover: { y: -3 }, whileTap: { scale: 0.98 } } : (hover ? { whileHover: { y: -3 } } : {})

  return (
    <Tag
      className={`bx__card ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...extraProps}
    >
      {children}
    </Tag>
  )
}

interface BxCardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function BxCardHeader({ title, subtitle, action }: BxCardHeaderProps) {
  return (
    <div className="bx__card-head">
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bx-ink)' }}>{title}</div>
        {subtitle && <div className="bx__text-sm">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
