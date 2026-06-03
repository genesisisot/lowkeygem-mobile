import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { ACCENT_PALETTES, type AccentPalette, type AccentPaletteId } from './themeConfig'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lowkey-theme'
const ACCENT_KEY = 'lowkey-accent'

function applyTheme(theme: Theme) {
  const attr = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-bx-theme', attr)
  document.querySelectorAll('.bx').forEach(el => el.setAttribute('data-bx-theme', attr))
  document.querySelectorAll('.dx').forEach(el => el.setAttribute('data-bx-theme', attr))
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialAccent(): AccentPalette {
  if (typeof window === 'undefined') return ACCENT_PALETTES[0]
  const stored = localStorage.getItem(ACCENT_KEY)
  if (stored) {
    const found = ACCENT_PALETTES.find(p => p.id === stored)
    if (found) return found
  }
  return ACCENT_PALETTES[0]
}

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
  accent: AccentPalette
  setAccent: (id: AccentPaletteId) => void
  palettes: AccentPalette[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [accent, setAccentState] = useState<AccentPalette>(getInitialAccent)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#080a10' : accent.accent)
    }
  }, [theme, accent])

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent.id)
    document.documentElement.setAttribute('data-bx-accent', accent.id)
    document.querySelectorAll('.bx').forEach(el => el.setAttribute('data-bx-accent', accent.id))
    document.querySelectorAll('.dx').forEach(el => el.setAttribute('data-bx-accent', accent.id))
  }, [accent])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const setAccent = useCallback((id: AccentPaletteId) => {
    const found = ACCENT_PALETTES.find(p => p.id === id)
    if (found) setAccentState(found)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark: theme === 'dark', toggleTheme, accent, setAccent, palettes: ACCENT_PALETTES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}
