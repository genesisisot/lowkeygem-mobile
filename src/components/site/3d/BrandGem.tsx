import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * The Fairly brand mark as a faceted 3D jewel: a crown (table + girdle) over a
 * pointed pavilion, low-poly so facets catch light, with a bright inner core.
 * Spins on Y and (optionally) leans toward the pointer.
 *
 * Perf: deliberately uses a cheap faceted MeshStandardMaterial (emissive purple
 * + metalness for jewel reflections) instead of MeshTransmissionMaterial — the
 * latter re-renders the whole scene into a texture every frame (the single
 * biggest GPU cost) and tints unpredictably toward blue. This stays a reliable
 * brand-violet and costs almost nothing.
 */
export function BrandGem({
  pointer,
  active = true,
  scale = 1.45,
  spin = 0.5,
  lean = true,
}: {
  pointer?: React.MutableRefObject<{ x: number; y: number }>
  active?: boolean
  scale?: number
  spin?: number
  lean?: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const FACETS = 8

  useFrame((_, delta) => {
    if (!group.current || !active) return
    group.current.rotation.y += delta * spin
    if (lean && pointer) {
      const targetX = pointer.current.y * 0.4
      const targetZ = -pointer.current.x * 0.3
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05
      group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.05
    }
  })

  const material = (
    <meshStandardMaterial
      color="#7c3aed"
      emissive="#7c3aed"
      emissiveIntensity={0.55}
      metalness={0.85}
      roughness={0.18}
      flatShading
    />
  )

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.9}>
      <group ref={group} scale={scale}>
        {/* Crown: table widening to the girdle */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.55, 1.05, 0.62, FACETS, 1, false]} />
          {material}
        </mesh>
        {/* Pavilion: girdle narrowing to a point */}
        <mesh position={[0, -0.74, 0]} rotation={[Math.PI, Math.PI / FACETS, 0]}>
          <coneGeometry args={[1.05, 1.7, FACETS, 1, false]} />
          {material}
        </mesh>
        {/* Bright inner core */}
        <mesh scale={0.35} position={[0, 0.1, 0]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#c9a6ff" toneMapped={false} />
        </mesh>
      </group>
    </Float>
  )
}
