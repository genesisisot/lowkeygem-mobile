import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Renders `children` only once the placeholder scrolls within `rootMargin` of
 * the viewport. Used to hold off the heavy 3D sections' dynamic import() until
 * the visitor is near them — so the hero loads and becomes interactive first
 * instead of three canvases fighting for bandwidth on initial paint.
 */
export function DeferMount({
  children,
  rootMargin = '700px',
  minHeight = '80vh',
}: {
  children: ReactNode
  rootMargin?: string
  minHeight?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  )
}
