import React from 'react'

type PillColor = 'amber' | 'green' | 'purple' | 'gray'

interface BxBadgeProps {
  children: React.ReactNode
  color?: PillColor
  className?: string
}

const colorMap: Record<PillColor, string> = {
  amber: 'bx__pill bx__pill--amber',
  green: 'bx__pill bx__pill--green',
  purple: 'bx__pill bx__pill--purple',
  gray: 'bx__pill bx__pill--gray',
}

export function BxBadge({ children, color = 'gray', className = '' }: BxBadgeProps) {
  return (
    <span className={`${colorMap[color]} ${className}`.trim()}>
      {children}
    </span>
  )
}

interface BxStatusDotProps {
  color?: 'green' | 'amber' | 'red' | 'gray'
  className?: string
}

const dotColorMap: Record<string, string> = {
  green: 'bx__dot bx__dot--green',
  amber: 'bx__dot bx__dot--amber',
  red: 'bx__dot bx__dot--red',
  gray: 'bx__dot bx__dot--gray',
}

export function BxStatusDot({ color = 'gray', className = '' }: BxStatusDotProps) {
  return <span className={`${dotColorMap[color]} ${className}`.trim()} />
}
