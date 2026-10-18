/**
 * Privacy-safe diagnostics. Only event names and numeric/boolean metadata are ever emitted, so bill
 * text, names, account numbers, images, and error messages cannot end up in logs. Dev builds only.
 */
export type LogValue = number | boolean

export function sanitizeMeta(meta: Record<string, unknown>): Record<string, LogValue> {
  const out: Record<string, LogValue> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[k.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40)] = v
  }
  return out
}

export function logEvent(name: string, meta: Record<string, unknown> = {}): void {
  if (import.meta.env.DEV) console.debug(`[medical-bill] ${name.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 60)}`, sanitizeMeta(meta))
}
