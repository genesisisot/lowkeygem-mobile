import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Profile } from './data'

/**
 * A single freelancer rendered as a faceted, glowing crystal with a billboarded
 * skill label + star rating. The shard lerps toward `slot`/`scale`/`glow` props,
 * which only change on a mode-flip or reshuffle — so the parent can drive whole
 * layout transitions (leaderboard ↔ equal orbit) declaratively and smoothly.
 */
export function SkillShard({
  profile,
  slot,
  scale = 1,
  glow = 1,
  showLabel = true,
  onPointerDown,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  profile: Profile
  slot: [number, number, number]
  scale?: number
  glow?: number
  showLabel?: boolean
  onPointerDown?: (e: any) => void
  onClick?: (e: any) => void
  onPointerOver?: (e: any) => void
  onPointerOut?: (e: any) => void
}) {
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const labelGroup = useRef<THREE.Group>(null)
  const target = useRef(new THREE.Vector3(...slot))

  useFrame(() => {
    if (!group.current) return
    target.current.set(...slot)
    group.current.position.lerp(target.current, 0.08)
    const s = THREE.MathUtils.lerp(group.current.scale.x, scale, 0.1)
    group.current.scale.setScalar(s)
    group.current.rotation.y += 0.004
    if (mat.current) {
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(
        mat.current.emissiveIntensity,
        0.4 + glow * 1.6,
        0.1
      )
      mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, 0.35 + glow * 0.65, 0.1)
    }
    if (labelGroup.current) {
      const lm = labelGroup.current
      lm.visible = glow > 0.5
    }
  })

  return (
    <group
      ref={group}
      position={slot}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Invisible, raycastable hit target so the small shards are easy to tap. */}
      <mesh>
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Faceted crystal */}
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          ref={mat}
          color={profile.color}
          emissive={profile.color}
          emissiveIntensity={1}
          metalness={0.3}
          roughness={0.15}
          flatShading
          transparent
          opacity={1}
        />
      </mesh>
      {/* Bright core */}
      <mesh scale={0.32}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>

      {showLabel && (
        <Billboard ref={labelGroup} position={[0, 0.9, 0]}>
          <Text fontSize={0.2} color="#f6f1ea" anchorX="center" anchorY="middle">
            {profile.name}
          </Text>
          <Text
            position={[0, -0.24, 0]}
            fontSize={0.13}
            color={profile.color}
            anchorX="center"
            anchorY="middle"
          >
            {profile.skill}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
