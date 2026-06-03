import { Environment, Lightformer } from '@react-three/drei'

/**
 * A baked, procedural lighting environment in the brand palette. `frames={1}`
 * renders it exactly once (not every frame) and there is **no network fetch** —
 * unlike a preset HDR ("city" etc.) which downloads a multi-MB equirect map and
 * is the single biggest load cost in a 3D scene. Gives the gem/shards their
 * glassy reflections for almost nothing.
 */
export function SceneEnv() {
  return (
    <Environment resolution={32} frames={1}>
      {/* Purple-dominant fills so the metallic gem reflects violet, not blue.
          Resolution 32 + frames=1: baked once, effectively free. */}
      <Lightformer intensity={4} color="#b794ff" position={[0, 3, 4]} scale={8} />
      <Lightformer intensity={3} color="#7c3aed" position={[-4, -1, 2]} scale={7} />
      <Lightformer intensity={2.4} color="#ffffff" position={[0, 5, -2]} scale={5} />
      <Lightformer intensity={1.6} color="#e86fa0" position={[4, 2, 3]} scale={5} />
    </Environment>
  )
}
