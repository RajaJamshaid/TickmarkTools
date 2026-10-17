import { describe, expect, it } from 'vitest'
import { resolveRoute } from './route'

describe('resolveRoute', () => {
  it('routes the Medical Bill Checker page, with or without a trailing slash', () => {
    expect(resolveRoute('/tools/medical-bill-checker')).toBe('medical-bill-checker')
    expect(resolveRoute('/tools/medical-bill-checker/')).toBe('medical-bill-checker')
  })

  it('keeps everything else on the homepage', () => {
    expect(resolveRoute('/')).toBe('home')
    expect(resolveRoute('')).toBe('home')
    expect(resolveRoute('/tools/car-repair-quote-checker')).toBe('home')
  })
})
