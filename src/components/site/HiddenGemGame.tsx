import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { ArrowUpRight } from 'lucide-react'
import { MagneticButton } from './primitives'
import { useCanvasActive } from './3d/useCanvasActive'
import { SkillShard } from './3d/SkillShard'
import { SceneEnv } from './3d/SceneEnv'
import { PROFILES, shuffle } from './3d/data'

const COUNT = 12
const GEMS = 3
const ROUND_SECONDS = 22
const CAST = PROFILES.slice(0, COUNT)

// Fixed ring slots the shards get shuffled between each reshuffle.
const SLOTS: [number, number, number][] = Array.from({ length: COUNT }, (_, i) => {
  const t = (i / COUNT) * Math.PI * 2
  const r = 3
  return [Math.cos(t) * r, Math.sin(t * 3) * 0.7, Math.sin(t) * r]
})

function Field({
  slotOf,
  glowOf,
  scaleOf,
  active,
  onPick,
}: {
  slotOf: number[]
  glowOf: (i: number) => number
  scaleOf: (i: number) => number
  active: boolean
  onPick: (i: number) => void
}) {
  const ring = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (active && ring.current) ring.current.rotation.y += delta * 0.12
  })
  return (
    <group ref={ring}>
      {CAST.map((p, i) => (
        <SkillShard
          key={p.name}
          profile={p}
          slot={SLOTS[slotOf[i]]}
          glow={glowOf(i)}
          scale={scaleOf(i)}
          showLabel={false}
          onPointerDown={(e) => {
            e.stopPropagation()
            onPick(i)
          }}
        />
      ))}
      <Sparkles count={50} scale={11} size={2.4} speed={0.3} color="#b794ff" opacity={0.4} />
    </group>
  )
}

export default function HiddenGemGame() {
  const { ref, active } = useCanvasActive<HTMLDivElement>()
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND_SECONDS)
  const [toast, setToast] = useState<string | null>(null)

  // Which profile indices are gems this round; current slot mapping; hint flash.
  const [gems, setGems] = useState<Set<number>>(new Set())
  const [slotOf, setSlotOf] = useState<number[]>(() => CAST.map((_, i) => i))
  const [revealed, setRevealed] = useState<Record<number, 'gem' | 'dud'>>({})
  const [hint, setHint] = useState(false)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reshuffle = useCallback(() => {
    setSlotOf((prev) => shuffle(prev))
    setHint(true)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(false), 650)
  }, [])

  const start = () => {
    const gemSet = new Set(shuffle(CAST.map((_, i) => i)).slice(0, GEMS))
    setGems(gemSet)
    setRevealed({})
    setScore(0)
    setTime(ROUND_SECONDS)
    setSlotOf(CAST.map((_, i) => i))
    setPhase('playing')
    setToast(null)
    reshuffle()
  }

  // Countdown + periodic reshuffle while playing.
  useEffect(() => {
    if (phase !== 'playing') return
    const tick = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    const shuf = setInterval(reshuffle, 2600)
    return () => {
      clearInterval(tick)
      clearInterval(shuf)
    }
  }, [phase, reshuffle])

  useEffect(() => {
    if (phase === 'playing' && time === 0) setPhase('over')
  }, [time, phase])

  // Win early if all gems found.
  useEffect(() => {
    if (phase === 'playing' && score >= GEMS) {
      const t = setTimeout(() => setPhase('over'), 700)
      return () => clearTimeout(t)
    }
  }, [score, phase])

  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current) }, [])

  const onPick = (i: number) => {
    if (phase !== 'playing' || revealed[i]) return
    if (gems.has(i)) {
      setRevealed((r) => ({ ...r, [i]: 'gem' }))
      setScore((s) => s + 1)
      setToast(`Hidden gem found — ${CAST[i].name} · ${CAST[i].skill} ✦`)
    } else {
      setRevealed((r) => ({ ...r, [i]: 'dud' }))
      setToast('Not a gem — keep watching the flash.')
    }
  }

  const glowOf = (i: number) => {
    const r = revealed[i]
    if (r === 'gem') return 1.6
    if (r === 'dud') return 0.2
    if (hint) return gems.has(i) ? 1.7 : 0.6 // the trackable tell
    return 1
  }
  const scaleOf = (i: number) => {
    const r = revealed[i]
    if (r === 'gem') return 1.5
    if (r === 'dud') return 0.7
    return 1
  }

  const slotMap = useMemo(() => slotOf, [slotOf])

  return (
    <section className="lk__section lk__game" style={{ paddingTop: 0 }}>
      <div className="lk__wrap">
        <span className="lk__eyebrow">Play · Find the hidden gem</span>
        <h2 className="lk__heading" style={{ marginTop: 18 }}>
          Most platforms bury talent. Can you spot it?
        </h2>
        <p className="lk__lead">
          Watch the crowd flash, then catch the {GEMS} hidden gems before the clock runs out.
          This is exactly the talent ranking algorithms hide — we shuffle so everyone's seen.
        </p>

        <div className="lk__game-stage">
          <div ref={ref} className="lk__game-canvas">
            <Canvas camera={{ position: [0, 0, 8], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[5, 6, 5]} intensity={2.6} color="#e86fa0" />
              <pointLight position={[-6, -2, 3]} intensity={2} color="#7c3aed" />
              <Field
                slotOf={slotMap}
                glowOf={glowOf}
                scaleOf={scaleOf}
                active={active && phase === 'playing'}
                onPick={onPick}
              />
              <SceneEnv />
              <EffectComposer>
                <Bloom intensity={0.85} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur resolutionScale={0.3} />
              </EffectComposer>
            </Canvas>

            {/* HUD */}
            <div className="lk__game-hud">
              <span className="lk__game-stat">Gems <b>{score}/{GEMS}</b></span>
              <span className="lk__game-stat">Time <b>{time}s</b></span>
            </div>

            {toast && phase === 'playing' && <div className="lk__game-toast">{toast}</div>}

            {phase !== 'playing' && (
              <div className="lk__game-overlay">
                {phase === 'idle' ? (
                  <>
                    <h3>Find the hidden gem</h3>
                    <p>{GEMS} gems are hiding in the crowd. They flash when the deck reshuffles.</p>
                    <button className="lk__btn lk__btn--primary" onClick={start}>
                      Start playing
                    </button>
                  </>
                ) : (
                  <>
                    <h3>{score === GEMS ? 'Sharp eye! ✦' : 'Round over'}</h3>
                    <p>
                      You surfaced <b>{score}</b> of {GEMS} gem{GEMS > 1 ? 's' : ''} most platforms
                      would've buried. That's the whole point of Fairly.
                    </p>
                    <div className="lk__game-actions">
                      <button className="lk__btn lk__btn--ghost" onClick={start}>Play again</button>
                      <MagneticButton href="/signup" className="lk__btn lk__btn--primary">
                        Get discovered <ArrowUpRight size={16} />
                      </MagneticButton>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
