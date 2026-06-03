import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BrandGem } from './3d/BrandGem'
import { SkillShard } from './3d/SkillShard'
import { SceneEnv } from './3d/SceneEnv'
import { PROFILES } from './3d/data'

type Mode = 'fair' | 'algorithm'

const SHARDS = PROFILES.slice(0, 8)
// The lowest-rated profile is the "hidden gem" that gets buried by ranking but
// rises and shines under fair discovery.
const HIDDEN_GEM = SHARDS.reduce(
  (lo, p, i) => (p.rating < SHARDS[lo].rating ? i : lo),
  0
)

interface Layout {
  slot: [number, number, number]
  scale: number
  glow: number
}

/** Position/scale/glow for each shard in a given mode. */
function computeLayout(mode: Mode): Layout[] {
  const n = SHARDS.length
  if (mode === 'fair') {
    // Equal-radius ring — same scale + brightness for everyone.
    const R = 2.7
    return SHARDS.map((_, i) => {
      const t = (i / n) * Math.PI * 2
      return {
        slot: [Math.cos(t) * R, Math.sin(t * 2) * 0.45, Math.sin(t) * R] as [number, number, number],
        scale: 1,
        glow: 1,
      }
    })
  }
  // Algorithm mode: a biased leaderboard down the open right side. Sort by
  // rating desc; the top few are big & bright, everyone below shrinks and fades
  // into the dark — the "burial" the fair ring undoes.
  const order = SHARDS.map((_, i) => i).sort((a, b) => SHARDS[b].rating - SHARDS[a].rating)
  const layout: Layout[] = new Array(n)
  order.forEach((idx, rank) => {
    layout[idx] = {
      slot: [2.2 + (rank % 2) * 0.45, 2.9 - rank * 0.82, 0],
      scale: Math.max(0.32, 1.5 - rank * 0.17),
      glow: Math.max(0.05, 1.35 - rank * 0.2),
    }
  })
  return layout
}

function Scene({
  mode,
  pointer,
  spinVel,
  active,
  matched,
  hovered,
  onPick,
  onHover,
}: {
  mode: Mode
  pointer: React.MutableRefObject<{ x: number; y: number }>
  spinVel: React.MutableRefObject<number>
  active: boolean
  matched: number | null
  hovered: number | null
  onPick: (i: number) => void
  onHover: (i: number | null) => void
}) {
  const scene = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Group>(null)
  const layout = useMemo(() => computeLayout(mode), [mode])

  useFrame((_, delta) => {
    if (!active) return
    // Parallax: whole scene leans toward the cursor.
    if (scene.current) {
      const tx = pointer.current.y * 0.18
      const ty = pointer.current.x * 0.3
      scene.current.rotation.x += (tx - scene.current.rotation.x) * 0.04
      scene.current.rotation.y += (ty - scene.current.rotation.y) * 0.04
    }
    // Ring spins in fair mode (+ drag momentum); settles to 0 in algorithm mode.
    if (ring.current) {
      if (mode === 'fair') {
        ring.current.rotation.y += delta * 0.18 + spinVel.current
      } else {
        ring.current.rotation.y += (0 - ring.current.rotation.y) * 0.06 + spinVel.current
      }
      spinVel.current *= 0.92
    }
  })

  return (
    <group ref={scene}>
      <BrandGem pointer={pointer} active={active} scale={1.15} lean={false} />

      <group ref={ring}>
        {SHARDS.map((p, i) => {
          const isMatched = matched === i
          const base = layout[i]
          const isHidden = i === HIDDEN_GEM
          return (
            <SkillShard
              key={p.name}
              profile={p}
              slot={isMatched ? [0, 0, 0] : base.slot}
              scale={
                (isMatched ? 1.5 : base.scale * (mode === 'fair' && isHidden ? 1.15 : 1)) *
                (hovered === i ? 1.18 : 1)
              }
              glow={isMatched ? 1 : mode === 'fair' ? 1 : base.glow}
              showLabel={hovered === i || matched === i}
              onClick={(e) => {
                e.stopPropagation()
                onPick(i)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                onHover(i)
              }}
              onPointerOut={() => onHover(null)}
            />
          )
        })}
      </group>

      {/* A small sparkle burst at the gem when a match fires. */}
      {matched !== null && (
        <Sparkles count={24} scale={2.2} size={5} speed={1.2} color="#ffd34d" opacity={0.9} />
      )}
    </group>
  )
}

export default function Hero3D() {
  const pointer = useRef({ x: 0, y: 0 })
  const spinVel = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const [active, setActive] = useState(true)
  const [mode, setMode] = useState<Mode>('algorithm')
  const [matched, setMatched] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Narrow/portrait screens: pull the camera back + widen FOV so the ring and
  // leaderboard column stay fully on screen.
  const compact = typeof window !== 'undefined' && window.innerWidth < 768

  // Auto-demo: open on the biased leaderboard, then flip to fair so the
  // contrast teaches itself. After that the visitor is in control.
  useEffect(() => {
    const t = setTimeout(() => setMode('fair'), 1700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => { if (matchTimer.current) clearTimeout(matchTimer.current) }, [])

  const onPointerMove = (e: React.PointerEvent) => {
    pointer.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -((e.clientY / window.innerHeight) * 2 - 1),
    }
    if (dragging.current) {
      spinVel.current += (e.clientX - lastX.current) * 0.0009
      lastX.current = e.clientX
    }
  }
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    lastX.current = e.clientX
  }
  const endDrag = () => { dragging.current = false }

  const handlePick = (i: number) => {
    setMatched(i)
    if (matchTimer.current) clearTimeout(matchTimer.current)
    matchTimer.current = setTimeout(() => setMatched(null), 1200)
  }

  return (
    <div
      ref={containerRef}
      className="lk__hero-canvas"
      style={{ cursor: hovered !== null ? 'pointer' : 'grab' }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <Canvas camera={{ position: [0, 0, compact ? 9.6 : 7], fov: compact ? 52 : 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 6, 5]} intensity={3} color="#e86fa0" />
        <pointLight position={[-6, -2, 3]} intensity={2.4} color="#d64c7a" />
        <pointLight position={[0, -4, -4]} intensity={1.8} color="#b5295e" />
        <Scene
          mode={mode}
          pointer={pointer}
          spinVel={spinVel}
          active={active}
          matched={matched}
          hovered={hovered}
          onPick={handlePick}
          onHover={setHovered}
        />
        <SceneEnv />
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur resolutionScale={0.3} />
        </EffectComposer>
      </Canvas>

      {/* Algorithm ↔ Fairly flip (DOM overlay). */}
      <div className="lk__flip" role="group" aria-label="Discovery mode">
        <span className="lk__flip-label">Discovery</span>
        <div className="lk__flip-toggle" data-mode={mode}>
          <button
            type="button"
            className={`lk__flip-opt${mode === 'algorithm' ? ' is-active' : ''}`}
            onClick={() => setMode('algorithm')}
          >
            Algorithm
          </button>
          <button
            type="button"
            className={`lk__flip-opt${mode === 'fair' ? ' is-active' : ''}`}
            onClick={() => setMode('fair')}
          >
            Fairly
          </button>
          <span className="lk__flip-thumb" />
        </div>
        <span className="lk__flip-hint">
          {mode === 'algorithm'
            ? 'Ranking buries newcomers in the dark.'
            : 'Everyone shares the same stage. Tap a talent to match.'}
        </span>
      </div>

      {/* Match feedback */}
      {matched !== null && (
        <div className="lk__hero-match">
          ✦ It's a match with {SHARDS[matched].name} · {SHARDS[matched].skill}
        </div>
      )}
    </div>
  )
}
