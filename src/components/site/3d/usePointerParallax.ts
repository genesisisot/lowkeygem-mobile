import { useRef } from 'react'

/**
 * Tracks the pointer in normalized [-1, 1] space without triggering React
 * re-renders (writes to a ref read inside useFrame). Returns the ref plus an
 * onPointerMove handler to spread onto the canvas wrapper.
 */
export function usePointerParallax() {
  const pointer = useRef({ x: 0, y: 0 })

  const onPointerMove = (e: React.PointerEvent) => {
    pointer.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -((e.clientY / window.innerHeight) * 2 - 1),
    }
  }

  return { pointer, onPointerMove }
}
