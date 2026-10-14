import type { ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Document with a scanning line. Decorative only. */
export function MedicalIcon() {
  return (
    <Svg>
      <path d="M13 6h16l8 8v28a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M29 6v8h8" />
      <path d="M24 24v10M19 29h10" />
      <line className="ico-scan" x1="14" y1="16" x2="34" y2="16" stroke="#00D6C9" strokeWidth="2.2" />
    </Svg>
  )
}

/** Receipt whose lines draw themselves. */
export function InvoiceIcon() {
  return (
    <Svg>
      <path d="M12 6h24a2 2 0 0 1 2 2v34l-4-3-4 3-4-3-4 3-4-3-4 3V8a2 2 0 0 1 2-2z" />
      <path className="ico-draw" pathLength={30} d="M17 16h14" />
      <path className="ico-draw ico-d2" pathLength={30} d="M17 23h14" />
      <path className="ico-draw ico-d3" pathLength={30} d="M17 30h8" />
    </Svg>
  )
}

/** Car with spinning wheels. */
export function CarIcon() {
  return (
    <Svg>
      <g className="ico-bob">
        <path d="M7 31v-5l4-9a3 3 0 0 1 3-2h20a3 3 0 0 1 3 2l4 9v5" />
        <path d="M7 31h34" />
        <path d="M14 25h20" />
      </g>
      <g className="ico-spin">
        <circle cx="14" cy="34" r="4.5" fill="#071B35" fillOpacity="0.35" />
        <path d="M14 30v8M10 34h8" strokeWidth="1.8" />
      </g>
      <g className="ico-spin">
        <circle cx="34" cy="34" r="4.5" fill="#071B35" fillOpacity="0.35" />
        <path d="M34 30v8M30 34h8" strokeWidth="1.8" />
      </g>
    </Svg>
  )
}

/** Hard hat with a twinkling spark. */
export function ContractorIcon() {
  return (
    <Svg>
      <g className="ico-bob">
        <path d="M9 31a15 15 0 0 1 30 0" />
        <path d="M6 31h36v5H6z" />
        <path d="M24 16v15M18 18v13M30 18v13" strokeWidth="2" />
      </g>
      <path className="ico-spark" d="M40 9v7M36.5 12.5h7" strokeWidth="2" stroke="#00D6C9" />
    </Svg>
  )
}

/** Image frame that resizes in a loop. */
export function ResizerIcon() {
  return (
    <Svg>
      <rect x="8" y="8" width="32" height="32" rx="4" />
      <rect className="ico-resize" x="15" y="15" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.3" />
      <path d="M30 10h8v8M18 38h-8v-8" strokeWidth="2" />
    </Svg>
  )
}
