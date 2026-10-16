import type { CSSProperties } from 'react'

interface Blob {
  size: string
  pos: CSSProperties
  color: string
  dur: string
  delay: string
}

const LIGHT: Blob[] = [
  { size: '42rem', pos: { left: '-12rem', top: '-14rem' }, color: 'rgba(23,185,245,0.30)', dur: '20s', delay: '0s' },
  { size: '36rem', pos: { right: '-10rem', top: '2rem' }, color: 'rgba(79,70,229,0.20)', dur: '24s', delay: '-6s' },
]

const DARK: Blob[] = [
  { size: '40rem', pos: { left: '-12rem', top: '-12rem' }, color: 'rgba(23,185,245,0.35)', dur: '22s', delay: '0s' },
  { size: '36rem', pos: { right: '-10rem', top: '20%' }, color: 'rgba(79,70,229,0.38)', dur: '26s', delay: '-8s' },
  { size: '32rem', pos: { left: '30%', bottom: '-16rem' }, color: 'rgba(79,70,229,0.24)', dur: '24s', delay: '-4s' },
]

/** Decorative blobs plus a faint grid, used inside the navy price box. Only animates when `animated` is set. */
export default function Aurora({ variant, animated = false }: { variant: 'light' | 'dark'; animated?: boolean }) {
  const blobs = variant === 'dark' ? DARK : LIGHT
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`aurora-blob ${animated ? 'aurora-anim' : ''}`}
          style={{
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
            animationDuration: b.dur,
            animationDelay: b.delay,
            ...b.pos,
          }}
        />
      ))}
      <div className={`absolute inset-0 ${variant === 'dark' ? 'wallpaper-grid' : 'wallpaper-grid-light'}`} />
    </div>
  )
}
