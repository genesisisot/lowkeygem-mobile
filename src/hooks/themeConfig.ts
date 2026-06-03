export interface AccentPalette {
  id: string
  label: string
  accent: string
  accent2: string
  accentRgb: string
  accent2Rgb: string
  grad: string
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'purple',
    label: 'Purple (Original)',
    accent: '#970747',
    accent2: '#7c3aed',
    accentRgb: '151, 7, 71',
    accent2Rgb: '124, 58, 237',
    grad: 'linear-gradient(135deg, #970747 0%, #b81a6b 42%, #7c3aed 100%)',
  },
  {
    id: 'dark-blue',
    label: 'Dark Blue',
    accent: '#003883',
    accent2: '#2563eb',
    accentRgb: '0, 56, 131',
    accent2Rgb: '37, 99, 235',
    grad: 'linear-gradient(135deg, #003883 0%, #1a5bb5 42%, #2563eb 100%)',
  },
  {
    id: 'olive',
    label: 'Olive Green',
    accent: '#6a8519',
    accent2: '#94b830',
    accentRgb: '106, 133, 25',
    accent2Rgb: '148, 184, 48',
    grad: 'linear-gradient(135deg, #6a8519 0%, #8aad2e 42%, #94b830 100%)',
  },
  {
    id: 'amber',
    label: 'Amber',
    accent: '#d97706',
    accent2: '#f59e0b',
    accentRgb: '217, 119, 6',
    accent2Rgb: '245, 158, 11',
    grad: 'linear-gradient(135deg, #d97706 0%, #e88a1e 42%, #f59e0b 100%)',
  },
  {
    id: 'teal',
    label: 'Teal Green',
    accent: '#008671',
    accent2: '#14b8a6',
    accentRgb: '0, 134, 113',
    accent2Rgb: '20, 184, 166',
    grad: 'linear-gradient(135deg, #008671 0%, #0ba592 42%, #14b8a6 100%)',
  },
  {
    id: 'burnt-orange',
    label: 'Burnt Orange',
    accent: '#C46A14',
    accent2: '#e88d30',
    accentRgb: '196, 106, 20',
    accent2Rgb: '232, 141, 48',
    grad: 'linear-gradient(135deg, #C46A14 0%, #d97d22 42%, #e88d30 100%)',
  },
]

export type AccentPaletteId = (typeof ACCENT_PALETTES)[number]['id']
