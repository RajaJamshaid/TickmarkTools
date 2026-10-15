/** Magnifier with a pulsing sparkle and an orbiting highlight. Decorative only. */
export function SmartSearchIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="21" cy="21" r="13" />
      <path d="M31 31l11 11" />
      <path
        className="ico-spark"
        d="M21 14.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z"
        fill="currentColor"
        strokeWidth="1.2"
      />
      <circle className="ico-orbit" cx="21" cy="21" r="13" strokeDasharray="5 77" strokeWidth="3.4" stroke="#fff" />
    </svg>
  )
}
