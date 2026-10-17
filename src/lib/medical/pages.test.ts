import { describe, expect, it } from 'vitest'
import { MAX_PAGES, addPage, hammingDistance, removePage, replacePage, validateFile } from './pages'
import type { CapturedPage } from './pages'

const page = (id: string, fingerprint: string): CapturedPage => ({ id, fingerprint, width: 10, height: 10, blob: {} as Blob, previewUrl: `blob:${id}` })
const zeros = '0'.repeat(256)
const flip = (count: number): string => '1'.repeat(count) + '0'.repeat(256 - count)

describe('hammingDistance', () => {
  it('counts differing bits and handles length mismatch', () => {
    expect(hammingDistance('0101', '0111')).toBe(1)
    expect(hammingDistance('01', '011')).toBe(Infinity)
  })
})

describe('addPage', () => {
  it('adds distinct pages in order', () => {
    const first = addPage([], page('a', zeros))
    expect(first.status).toBe('added')
    if (first.status !== 'added') return
    const second = addPage(first.pages, page('b', flip(60)))
    expect(second.status).toBe('added')
    if (second.status === 'added') expect(second.pages.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('warns about a near-identical page instead of adding it', () => {
    const result = addPage([page('a', zeros)], page('b', flip(3)))
    expect(result).toEqual({ status: 'possible-duplicate', matchIndex: 0 })
  })

  it('adds a near-identical page when the user confirms', () => {
    const result = addPage([page('a', zeros)], page('b', flip(3)), { force: true })
    expect(result.status).toBe('added')
  })

  it('does not treat missing fingerprints as duplicates', () => {
    expect(addPage([page('a', '')], page('b', '')).status).toBe('added')
  })

  it('enforces the page limit', () => {
    const pages = Array.from({ length: MAX_PAGES }, (_, i) => page(`p${i}`, flip(i * 20)))
    expect(addPage(pages, page('x', flip(250)))).toEqual({ status: 'limit' })
  })
})

describe('replace / remove', () => {
  const pages = [page('a', zeros), page('b', flip(60))]
  it('replaces a page in place (retake)', () => {
    expect(replacePage(pages, 'a', page('c', flip(100))).map((p) => p.id)).toEqual(['c', 'b'])
  })
  it('removes a page', () => {
    expect(removePage(pages, 'a').map((p) => p.id)).toEqual(['b'])
  })
})

describe('validateFile', () => {
  it('accepts supported images', () => {
    expect(validateFile({ type: 'image/jpeg', size: 1000 })).toBeNull()
  })
  it('rejects unsupported, empty, and oversized files', () => {
    expect(validateFile({ type: 'application/pdf', size: 1000 })).toContain('JPEG')
    expect(validateFile({ type: 'image/png', size: 0 })).toContain('empty')
    expect(validateFile({ type: 'image/png', size: 50 * 1024 * 1024 })).toContain('MB')
  })
})
