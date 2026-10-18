import { validateFile } from './pages'
import { toGray } from './quality'

/** Browser-only helpers. Images live in memory as Blobs; nothing is uploaded or persisted. */

export interface CapturedImage {
  blob: Blob
  width: number
  height: number
  fingerprint: string
}

/** Large frames are downscaled for memory. Small frames are never upscaled. */
const MAX_EDGE = 2600
const FP = 16

function fingerprintOf(source: CanvasImageSource): string {
  const c = document.createElement('canvas')
  c.width = FP
  c.height = FP
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return ''
  ctx.drawImage(source, 0, 0, FP, FP)
  const gray = toGray(ctx.getImageData(0, 0, FP, FP).data, FP, FP)
  let sum = 0
  for (let i = 0; i < gray.length; i++) sum += gray[i]
  const mean = sum / gray.length
  let bits = ''
  for (let i = 0; i < gray.length; i++) bits += gray[i] >= mean ? '1' : '0'
  return bits
}

async function drawToImage(source: CanvasImageSource, sw: number, sh: number): Promise<CapturedImage> {
  if (sw <= 0 || sh <= 0) throw new Error('empty-frame')
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh))
  const width = Math.round(sw * scale)
  const height = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no-canvas')
  ctx.drawImage(source, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) throw new Error('encode-failed')
  return { blob, width, height, fingerprint: fingerprintOf(canvas) }
}

export const captureFromVideo = (video: HTMLVideoElement): Promise<CapturedImage> => drawToImage(video, video.videoWidth, video.videoHeight)

export async function imageFromFile(file: File): Promise<CapturedImage> {
  const problem = validateFile(file)
  if (problem) throw new Error('invalid-file')
  const bitmap = await createImageBitmap(file)
  try {
    return await drawToImage(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}
