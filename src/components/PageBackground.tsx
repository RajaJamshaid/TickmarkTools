import type { CSSProperties } from 'react'

interface Blob {
  size: string
  pos: CSSProperties
  color: string
  anim?: boolean
  dur?: string
}

// One direction: cyan glow top-left flowing to indigo glow bottom-right (same as the button gradient).
const BLOBS: Blob[] = [
  { size: '46rem', pos: { left: '-16rem', top: '-10rem' }, color: 'rgba(23,185,245,0.26)', anim: true, dur: '22s' },
  { size: '38rem', pos: { left: '-14rem', top: '30%' }, color: 'rgba(23,185,245,0.14)' },
  { size: '40rem', pos: { right: '-14rem', top: '50%' }, color: 'rgba(79,70,229,0.14)' },
  { size: '46rem', pos: { right: '-16rem', top: '80%' }, color: 'rgba(79,70,229,0.2)' },
]

/** One continuous wallpaper behind the whole page, so there are no seams between sections. */
export default function PageBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className={`aurora-blob ${b.anim ? 'aurora-anim' : ''}`}
          style={{
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
            animationDuration: b.dur,
            ...b.pos,
          }}
        />
      ))}
      <div className="wallpaper-grid-page absolute inset-0" />
    </div>
  )
}
