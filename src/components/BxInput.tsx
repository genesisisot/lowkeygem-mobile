import React from 'react'

interface BxInputProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  error?: boolean
  maxLength?: number
  className?: string
  style?: React.CSSProperties
}

export function BxInput({
  label, value, onChange, placeholder, type = 'text',
  error, maxLength, className = '', style,
}: BxInputProps) {
  return (
    <div>
      {label && <label className="bx__label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`bx__input ${error ? 'bx__input--error' : ''} ${className}`.trim()}
        style={style}
      />
    </div>
  )
}

interface BxTextareaProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  className?: string
}

export function BxTextarea({
  label, value, onChange, placeholder, rows = 3, className = '',
}: BxTextareaProps) {
  return (
    <div>
      {label && <label className="bx__label">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`bx__input ${className}`.trim()}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />
    </div>
  )
}
