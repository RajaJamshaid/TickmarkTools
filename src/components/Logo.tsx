export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${light ? 'logo-light' : ''}`}>
      <span aria-hidden="true" className="logo-badge">
        <svg viewBox="0 0 32 32" className="relative h-5 w-5" fill="none" stroke="#E8FBFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path className="logo-check" pathLength={30} d="M7 17l6 6 12-13" />
        </svg>
      </span>
      <span className="font-heading text-xl font-bold tracking-tight">
        <span className="logo-a">Tickmark</span>
        <span className="logo-b">Tools</span>
      </span>
    </span>
  )
}
