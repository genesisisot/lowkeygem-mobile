import { useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { Heart, X, Star, Sparkles } from 'lucide-react'
import { MagneticButton } from './primitives'
import { PROFILES, type Profile } from './3d/data'

const DECK = PROFILES.slice(0, 8)

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function TopCard({
  profile,
  onSwipe,
}: {
  profile: Profile
  onSwipe: (dir: 1 | -1) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const likeOpacity = useTransform(x, [30, 140], [0, 1])
  const nopeOpacity = useTransform(x, [-140, -30], [1, 0])

  const handleEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 600) onSwipe(1)
    else if (info.offset.x < -120 || info.velocity.x < -600) onSwipe(-1)
  }

  return (
    <motion.div
      className="lk__swipe-card lk__swipe-card--top"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleEnd}
      initial={{ scale: 0.96, y: 16, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <CardFace profile={profile} />
      <motion.span className="lk__swipe-stamp lk__swipe-stamp--like" style={{ opacity: likeOpacity }}>
        MATCH
      </motion.span>
      <motion.span className="lk__swipe-stamp lk__swipe-stamp--nope" style={{ opacity: nopeOpacity }}>
        PASS
      </motion.span>
    </motion.div>
  )
}

function CardFace({ profile }: { profile: Profile }) {
  return (
    <>
      <div
        className="lk__swipe-avatar"
        style={{
          background: `radial-gradient(120% 120% at 30% 20%, ${profile.color}, #1a0f1f 80%)`,
        }}
      >
        <span>{initials(profile.name)}</span>
      </div>
      <div className="lk__swipe-body">
        <h4>{profile.name}</h4>
        <p style={{ color: profile.color }}>{profile.skill}</p>
        <div className="lk__swipe-stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={15}
              fill={i < Math.round(profile.rating) ? '#ffd34d' : 'transparent'}
              color={i < Math.round(profile.rating) ? '#ffd34d' : 'rgba(246,241,234,0.3)'}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export function FairMatchDemo() {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [matched, setMatched] = useState<Profile | null>(null)
  const [seen, setSeen] = useState(1)

  const len = DECK.length
  const current = DECK[index % len]
  const behind1 = DECK[(index + 1) % len]
  const behind2 = DECK[(index + 2) % len]

  const swipe = (d: 1 | -1) => {
    setDir(d)
    if (d === 1) {
      setMatched(current)
      window.setTimeout(() => setMatched(null), 1500)
    }
    window.setTimeout(() => {
      setIndex((i) => i + 1)
      setSeen((s) => Math.min(len, s + 1))
    }, 240)
  }

  return (
    <section className="lk__section lk__swipe" style={{ paddingTop: 0 }}>
      <div className="lk__wrap lk__swipe-wrap">
        <div className="lk__swipe-intro">
          <span className="lk__eyebrow">Try it · Tinder-style matching</span>
          <h2 className="lk__heading" style={{ marginTop: 18 }}>
            Swipe through talent. When both say yes, you match.
          </h2>
          <p className="lk__lead">
            Browsing is a deck, not a leaderboard. Swipe right to show interest, left to pass —
            and every profile gets its turn in front of you. No bidding, no burying.
          </p>
          <div className="lk__swipe-meter">
            <span>Equal exposure</span>
            <div className="lk__swipe-bar">
              <span style={{ width: `${(seen / len) * 100}%` }} />
            </div>
            <small>{seen}/{len} profiles surfaced — no one buried</small>
          </div>
          <div className="lk__swipe-cta">
            <MagneticButton href="/signup" className="lk__btn lk__btn--primary">
              Start matching
            </MagneticButton>
          </div>
        </div>

        <div className="lk__swipe-stage">
          {/* Stacked cards behind for depth */}
          <div className="lk__swipe-card lk__swipe-card--back2" aria-hidden>
            <CardFace profile={behind2} />
          </div>
          <div className="lk__swipe-card lk__swipe-card--back1" aria-hidden>
            <CardFace profile={behind1} />
          </div>

          <AnimatePresence>
            <motion.div
              key={index}
              className="lk__swipe-cardwrap"
              exit={{
                x: dir * 680,
                rotate: dir * 22,
                opacity: 0,
                transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              }}
            >
              <TopCard profile={current} onSwipe={swipe} />
            </motion.div>
          </AnimatePresence>

          {/* Action buttons (accessible alternative to dragging) */}
          <div className="lk__swipe-controls">
            <button className="lk__swipe-btn lk__swipe-btn--nope" onClick={() => swipe(-1)} aria-label="Pass">
              <X size={24} />
            </button>
            <button className="lk__swipe-btn lk__swipe-btn--like" onClick={() => swipe(1)} aria-label="Match">
              <Heart size={22} />
            </button>
          </div>

          {/* Match celebration */}
          <AnimatePresence>
            {matched && (
              <motion.div
                className="lk__swipe-match"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Sparkles size={20} />
                <span>It's a match with {matched.name}!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
