import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/** One shared observer for every Reveal keeps scrolling and clicks responsive. */
const callbacks = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          callbacks.get(entry.target)?.()
          callbacks.delete(entry.target)
          observer?.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    )
  }
  return observer
}

/** Fades and lifts content in once when it scrolls into view. */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    callbacks.set(el, () => setShown(true))
    const io = getObserver()
    io.observe(el)
    return () => {
      io.unobserve(el)
      callbacks.delete(el)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={{ '--d': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
