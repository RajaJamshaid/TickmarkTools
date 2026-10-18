/**
 * Simple on-device image-quality heuristics used for live capture guidance only.
 * Thresholds are initial heuristics that still need tuning on real phones. They never block a capture.
 */

export type QualityIssue = 'too-dark' | 'too-bright' | 'low-contrast' | 'blurry'

export interface QualityReport {
  brightness: number
  contrast: number
  sharpness: number
  issues: QualityIssue[]
}

export const THRESHOLDS = { dark: 60, bright: 235, contrast: 25, sharpness: 40 } as const

export function toGray(rgba: ArrayLike<number>, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height)
  for (let i = 0; i < out.length; i++) {
    const o = i * 4
    out[i] = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2]
  }
  return out
}

export function assessGray(gray: ArrayLike<number>, width: number, height: number): QualityReport {
  const n = width * height
  if (n === 0 || gray.length < n) return { brightness: 0, contrast: 0, sharpness: 0, issues: [] }

  let sum = 0
  for (let i = 0; i < n; i++) sum += gray[i]
  const mean = sum / n
  let sq = 0
  for (let i = 0; i < n; i++) sq += (gray[i] - mean) ** 2
  const contrast = Math.sqrt(sq / n)

  // Variance of a 4-neighbour Laplacian: low values mean few sharp edges (blur or blank).
  let lapSum = 0
  let lapSq = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = gray[y * width + x]
      const lap = 4 * c - gray[(y - 1) * width + x] - gray[(y + 1) * width + x] - gray[y * width + x - 1] - gray[y * width + x + 1]
      lapSum += lap
      lapSq += lap * lap
      count++
    }
  }
  const sharpness = count > 0 ? lapSq / count - (lapSum / count) ** 2 : 0

  const issues: QualityIssue[] = []
  if (mean < THRESHOLDS.dark) issues.push('too-dark')
  if (mean > THRESHOLDS.bright) issues.push('too-bright')
  if (contrast < THRESHOLDS.contrast) issues.push('low-contrast')
  if (sharpness < THRESHOLDS.sharpness) issues.push('blurry')
  return { brightness: mean, contrast, sharpness, issues }
}
