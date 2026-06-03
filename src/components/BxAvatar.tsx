import React from 'react'

interface BxAvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
  online?: boolean
  verified?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32, borderRadius: 9, fontSize: 11 },
  md: { width: 40, height: 40, borderRadius: 12, fontSize: 13 },
  lg: { width: 56, height: 56, borderRadius: '50%' as const, fontSize: 20 },
}

export function BxAvatar({ src, name = '', size = 'md', className = '', style, online, verified }: BxAvatarProps) {
  const dims = sizeMap[size]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className={`bx__av ${className}`.trim()} style={{ ...dims, ...style }}>
      {src?.startsWith('http') ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initials}</span>
      )}
      {online && (
        <span className="bx__dot bx__dot--green" style={{ position: 'absolute', bottom: 0, right: 0 }} />
      )}
      {verified && (
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: 'var(--bx-accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bx-card)' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      )}
    </div>
  )
}
