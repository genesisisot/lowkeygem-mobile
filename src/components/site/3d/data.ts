// Shared, asset-free "talent" data for the marketing 3D scenes. No images —
// avatars are gradients + initials, so nothing extra is fetched at load.

export interface Profile {
  name: string
  skill: string
  /** hex accent used for the shard glow + gradient avatar */
  color: string
  rating: number // 0..5, half-steps
}

// Brand token colors (kept in sync with landing.css :root)
export const MAGENTA = '#ff1d68'
export const VIOLET = '#7c3aed'
export const CYAN = '#41e0d0'
export const VIOLET_SOFT = '#b794ff'

// A deliberate mix of trades, crafts and creative/tech work — discovery on
// Fairly isn't just for "tech", so the talent on screen shouldn't be either.
export const PROFILES: Profile[] = [
  { name: 'Ada',     skill: 'Shoe Maker',     color: MAGENTA,     rating: 5 },
  { name: 'Tunde',   skill: 'Carpenter',      color: VIOLET,      rating: 4.5 },
  { name: 'Chiamaka', skill: 'Fashion Designer', color: CYAN,     rating: 5 },
  { name: 'Emeka',   skill: 'Photographer',   color: VIOLET_SOFT, rating: 4.5 },
  { name: 'Zainab',  skill: 'Painter',        color: MAGENTA,     rating: 4 },
  { name: 'Kelechi', skill: 'Web Developer',  color: CYAN,        rating: 5 },
  { name: 'Bola',    skill: 'Caterer / Chef', color: VIOLET,      rating: 4.5 },
  { name: 'Ifeoma',  skill: 'Hair Stylist',   color: VIOLET_SOFT, rating: 4 },
  { name: 'Sani',    skill: 'Tailor',         color: MAGENTA,     rating: 5 },
  { name: 'Ngozi',   skill: 'Makeup Artist',  color: CYAN,        rating: 4.5 },
  { name: 'Femi',    skill: 'Welder',         color: VIOLET,      rating: 4 },
  { name: 'Amara',   skill: 'Graphic Design', color: VIOLET_SOFT, rating: 5 },
  { name: 'Obi',     skill: 'Electrician',    color: MAGENTA,     rating: 4.5 },
  { name: 'Halima',  skill: 'Event Planner',  color: CYAN,        rating: 4.5 },
]

/** Deterministic shuffle helper (Fisher–Yates with a seedable RNG). */
export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
