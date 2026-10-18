import { describe, expect, it } from 'vitest'
import { sanitizeMeta } from './safeLog'

describe('sanitizeMeta', () => {
  it('keeps only finite numbers and booleans', () => {
    const out = sanitizeMeta({ pages: 2, ok: true, provider: 'Acme Clinic', account: '12345', err: new Error('x'), nan: NaN, nested: { a: 1 } })
    expect(out).toEqual({ pages: 2, ok: true })
  })

  it('sanitizes key names', () => {
    expect(sanitizeMeta({ 'a b/c': 1 })).toEqual({ abc: 1 })
  })
})
