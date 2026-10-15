import { useState } from 'react'
import type { CSSProperties } from 'react'
import { STICKERS } from '../data/stickers'
import type { ToolId } from '../data/tools'

interface Props {
  id: ToolId
  size: number
  className?: string
  /** Skip the floating animation (used for small thumbnails). */
  still?: boolean
  /** Animation delay in seconds. */
  delay?: number
  eager?: boolean
}

/** Decorative cartoon sticker for a tool. The tool name is always shown next to it as text. */
export default function ToolSticker({ id, size, className = '', still = false, delay = 0, eager = false }: Props) {
  const [failed, setFailed] = useState(false)

  const box = failed ? (
    <span
      className={`sticker bg-slate-200 ${className}`}
      style={className ? undefined : { width: size, height: size }}
    />
  ) : (
    <img
      src={STICKERS[id]}
      alt=""
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`sticker select-none ${className}`}
    />
  )

  if (still) return box
  return (
    <span className="sticker-wrap" style={{ '--sd': `${delay}s` } as CSSProperties}>
      {box}
    </span>
  )
}
