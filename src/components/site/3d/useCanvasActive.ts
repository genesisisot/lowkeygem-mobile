import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref to attach to the canvas wrapper and a boolean that is true only
 * while the element is on screen. Scenes gate their `useFrame` work on this so
 * offscreen canvases burn ~0% CPU/GPU — essential when several live on one page.
 */
export function useCanvasActive<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, active }
}
