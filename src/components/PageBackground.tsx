import type { CSSProperties } from 'react'

interface Blob {
  size: string
  pos: CSSProperties
  color: string
  anim?: boolean
  dur?: string
}

const BLOBS: Blob[] = [
  { size: '44rem', pos: { left: '-14rem', top: '-8rem' }, color: 'rgba(23,185,245,0.28)', anim: true, dur: '22s' },
  { size: '38rem', pos: { right: '-12rem', top: '4rem' }, color: 'rgba(79,70,229,0.18)', anim: true, dur: '26s' },
  { size: '34rem', pos: { left: '30%', top: '22%' }, color: 'rgba(0,214,201,0.16)' },
  { size: '40rem', pos: { right: '-14rem', top: '38%' }, color: 'rgba(79,70,229,0.14)' },
  { size: '36rem', pos: { left: '-12rem', top: '58%' }, color: 'rgba(23,185,245,0.16)' },
  { size: '34rem', pos: { right: '-8rem', top: '82%' }, color: 'rgba(0,214,201,0.16)' },
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
