import { describe, expect, it } from 'vitest'
import { assessGray, toGray } from './quality'

const make = (w: number, h: number, f: (x: number, y: number) => number): Uint8ClampedArray => {
  const a = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = f(x, y)
  return a
}

describe('toGray', () => {
  it('converts RGBA to luminance', () => {
    const gray = toGray([255, 255, 255, 255, 0, 0, 0, 255], 2, 1)
    expect(Array.from(gray)).toEqual([255, 0])
  })
})

describe('assessGray', () => {
  it('reports no issues for a sharp, well-exposed, high-contrast image', () => {
    const g = make(16, 16, (x, y) => ((x + y) % 2) * 255)
    expect(assessGray(g, 16, 16).issues).toEqual([])
  })

  it('flags a dark image', () => {
    const g = make(16, 16, () => 20)
    expect(assessGray(g, 16, 16).issues).toContain('too-dark')
  })

  it('flags an overexposed image', () => {
    const g = make(16, 16, () => 255)
    expect(assessGray(g, 16, 16).issues).toContain('too-bright')
  })

  it('flags a flat image as low contrast', () => {
    const g = make(16, 16, () => 128)
    expect(assessGray(g, 16, 16).issues).toContain('low-contrast')
  })

  it('flags a smooth gradient as blurry only', () => {
    const g = make(64, 16, (x) => x * 4)
    expect(assessGray(g, 64, 16).issues).toEqual(['blurry'])
  })

  it('handles empty input', () => {
    expect(assessGray(new Uint8ClampedArray(0), 0, 0).issues).toEqual([])
  })
})
