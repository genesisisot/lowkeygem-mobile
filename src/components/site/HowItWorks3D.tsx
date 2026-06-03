import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { motion, useScroll, useMotionValueEvent } from 'motion/react'
import * as THREE from 'three'
import { BrandGem } from './3d/BrandGem'
import { SkillShard } from './3d/SkillShard'
import { SceneEnv } from './3d/SceneEnv'
import { PROFILES } from './3d/data'

export interface Step { n: string; t: string; d: string }

const CAST = PROFILES.slice(0, 4)
const lerp = THREE.MathUtils.lerp
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// Maps global progress p across [a,b] → 0..1 for a single beat.
const beat = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

/**
 * A four-beat cinematic that plays as the visitor scrolls:
 *  1) a profile shard forms, 2) shards shuffle (equal discovery),
 *  3) two shards converge into a match, 4) the gem drops into escrow + releases.
 * Reads scroll progress from a ref so scrolling never re-renders the canvas.
 */
function Sequence({ progress, xOffset }: { progress: React.MutableRefObject<number>; xOffset: number }) {
  const s0 = useRef<THREE.Group>(null)
  const s1 = useRef<THREE.Group>(null)
  const shuffle = useRef<THREE.Group>(null)
  const gem = useRef<THREE.Group>(null)
  const vault = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const p = progress.current
    const b1 = beat(p, 0, 0.25)
    const b2 = beat(p, 0.25, 0.5)
    const b3 = beat(p, 0.5, 0.75)
    const b4 = beat(p, 0.75, 1)

    // Beat 2: the shuffle ring spins while it's the active beat.
    if (shuffle.current) {
      shuffle.current.rotation.y += 0.01 + b2 * 0.04
      const vis = b2 > 0.02 && b3 < 0.98
      shuffle.current.visible = vis
      shuffle.current.scale.setScalar(lerp(0.2, 1, b2))
    }

    // Beat 3: two shards converge to center, then a match.
    if (s0.current && s1.current) {
      const conv = b3
      s0.current.position.x = lerp(-2.4, -0.35, conv)
      s1.current.position.x = lerp(2.4, 0.35, conv)
      const showPair = b2 > 0.6 && b4 < 0.5
      s0.current.visible = showPair
      s1.current.visible = showPair
    }

    // Beat 4: the gem descends into the escrow vault and pulses on release.
    if (gem.current) {
      gem.current.visible = b3 > 0.5
      gem.current.position.y = lerp(1.4, -0.2, b4)
      const pulse = b4 > 0.7 ? 1 + Math.sin(p * 60) * 0.04 : 1
      gem.current.scale.setScalar(lerp(0.6, 1, clamp01(b3 * 2)) * pulse)
    }
    if (vault.current) {
      vault.current.visible = b4 > 0.05
      const m = vault.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = lerp(0.2, 1.4, b4)
      vault.current.rotation.z += 0.005
    }

    // Beat 1: the first shard scales/fades in.
    if (s0.current && b1 < 1) {
      const intro = b1
      s0.current.visible = intro > 0.05
      s0.current.scale.setScalar(lerp(0.1, 1, intro))
    }
  })

  return (
    // Offset to the open right side on desktop so the 3D never sits behind the
    // step copy; centered on mobile (copy moves below it there).
    <group position={[xOffset, 0, 0]}>
      {/* Beat 1 + 3 principals */}
      <group ref={s0} position={[-2.4, 0, 0]}>
        <SkillShard profile={CAST[0]} slot={[0, 0, 0]} />
      </group>
      <group ref={s1} position={[2.4, 0, 0]} visible={false}>
        <SkillShard profile={CAST[1]} slot={[0, 0, 0]} />
      </group>

      {/* Beat 2 shuffle ring */}
      <group ref={shuffle} visible={false}>
        {CAST.map((p, i) => {
          const t = (i / CAST.length) * Math.PI * 2
          return (
            <SkillShard
              key={p.name}
              profile={p}
              slot={[Math.cos(t) * 2.2, Math.sin(t * 2) * 0.4, Math.sin(t) * 2.2]}
              showLabel={false}
            />
          )
        })}
      </group>

      {/* Beat 4 gem + escrow vault */}
      <group ref={gem} visible={false}>
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <BrandGem scale={0.8} lean={false} spin={0.6} />
        </Float>
      </group>
      <mesh ref={vault} position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1.3, 0.09, 16, 48]} />
        <meshStandardMaterial color="#41e0d0" emissive="#41e0d0" emissiveIntensity={0.6} metalness={0.6} roughness={0.2} />
      </mesh>

      <Sparkles count={40} scale={9} size={2} speed={0.25} color="#b794ff" opacity={0.4} />
    </group>
  )
}

export default function HowItWorks3D({ steps }: { steps: Step[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [activeStep, setActiveStep] = useState(0)
  const compact = typeof window !== 'undefined' && window.innerWidth < 768
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progress.current = v
    const idx = Math.min(steps.length - 1, Math.floor(v * steps.length))
    setActiveStep(idx)
  })

  return (
    <section ref={sectionRef} id="how" className="lk__howit">
      <div className="lk__howit-sticky">
        <div className="lk__howit-canvas">
          <Canvas camera={{ position: [0, 0, compact ? 9 : 7], fov: compact ? 50 : 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[5, 6, 5]} intensity={2.6} color="#e86fa0" />
            <pointLight position={[-6, -2, 3]} intensity={2} color="#7c3aed" />
            <Sequence progress={progress} xOffset={compact ? 0 : 2.6} />
            <SceneEnv />
            <EffectComposer>
              <Bloom intensity={0.85} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur resolutionScale={0.3} />
            </EffectComposer>
          </Canvas>
        </div>

        <div className="lk__howit-copy">
          <span className="lk__eyebrow">How it works</span>
          <div className="lk__howit-steps">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                className="lk__howit-step"
                style={{ pointerEvents: activeStep === i ? 'auto' : 'none' }}
                animate={{
                  opacity: activeStep === i ? 1 : 0,
                  y: activeStep === i ? 0 : 16,
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="lk__step-num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </motion.div>
            ))}
          </div>
          <div className="lk__howit-progress">
            {steps.map((s, i) => (
              <span key={s.n} className={`lk__howit-dot${activeStep >= i ? ' is-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
