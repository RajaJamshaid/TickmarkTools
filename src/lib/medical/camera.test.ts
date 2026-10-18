import { describe, expect, it, vi } from 'vitest'
import { CAMERA_ERROR_MESSAGES, CameraError, buildConstraints, classifyCameraError, getTorchSupport, openCamera, stopStream } from './camera'
import type { CameraErrorCode } from './camera'

const namedError = (name: string) => Object.assign(new Error(name), { name })
const fakeStream = (trackCount = 1) => {
  const stops = Array.from({ length: trackCount }, () => vi.fn())
  return { stream: { getTracks: () => stops.map((stop) => ({ stop })) } as unknown as MediaStream, stops }
}
const codeOf = async (p: Promise<unknown>): Promise<CameraErrorCode | 'no-error'> => {
  try {
    await p
    return 'no-error'
  } catch (e) {
    return e instanceof CameraError ? e.code : 'unknown'
  }
}

describe('classifyCameraError', () => {
  it('maps browser error names', () => {
    expect(classifyCameraError(namedError('NotAllowedError'))).toBe('permission-denied')
    expect(classifyCameraError(namedError('NotFoundError'))).toBe('no-device')
    expect(classifyCameraError(namedError('NotReadableError'))).toBe('in-use')
    expect(classifyCameraError(namedError('OverconstrainedError'))).toBe('overconstrained')
    expect(classifyCameraError(new Error('x'))).toBe('unknown')
    expect(classifyCameraError(null)).toBe('unknown')
  })

  it('has a message for every code', () => {
    for (const code of Object.keys(CAMERA_ERROR_MESSAGES)) expect(CAMERA_ERROR_MESSAGES[code as CameraErrorCode].length).toBeGreaterThan(10)
  })
})

describe('openCamera', () => {
  it('refuses insecure contexts without touching the camera', async () => {
    const getUserMedia = vi.fn()
    expect(await codeOf(openCamera({ isSecureContext: false, mediaDevices: { getUserMedia } }))).toBe('insecure-context')
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('reports unsupported browsers', async () => {
    expect(await codeOf(openCamera({ isSecureContext: true, mediaDevices: undefined }))).toBe('unsupported')
  })

  it('reports permission denial and missing devices', async () => {
    const denied = { getUserMedia: vi.fn().mockRejectedValue(namedError('NotAllowedError')) }
    const none = { getUserMedia: vi.fn().mockRejectedValue(namedError('NotFoundError')) }
    expect(await codeOf(openCamera({ isSecureContext: true, mediaDevices: denied }))).toBe('permission-denied')
    expect(await codeOf(openCamera({ isSecureContext: true, mediaDevices: none }))).toBe('no-device')
  })

  it('returns the stream and prefers the environment camera', async () => {
    const { stream } = fakeStream()
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    await expect(openCamera({ isSecureContext: true, mediaDevices: { getUserMedia } })).resolves.toBe(stream)
    expect(getUserMedia).toHaveBeenCalledWith(buildConstraints())
    expect(JSON.stringify(buildConstraints())).toContain('environment')
    expect(buildConstraints().audio).toBe(false)
  })

  it('retries without a specific device if that device is unavailable', async () => {
    const { stream } = fakeStream()
    const getUserMedia = vi.fn().mockRejectedValueOnce(namedError('OverconstrainedError')).mockResolvedValueOnce(stream)
    await expect(openCamera({ isSecureContext: true, mediaDevices: { getUserMedia } }, 'abc')).resolves.toBe(stream)
    expect(getUserMedia).toHaveBeenCalledTimes(2)
  })
})

describe('stopStream', () => {
  it('stops every track', () => {
    const { stream, stops } = fakeStream(2)
    expect(stopStream(stream)).toBe(2)
    for (const stop of stops) expect(stop).toHaveBeenCalledTimes(1)
  })

  it('is safe with null/undefined', () => {
    expect(stopStream(null)).toBe(0)
    expect(stopStream(undefined)).toBe(0)
  })
})

describe('getTorchSupport', () => {
  it('is true only when the track reports torch', () => {
    expect(getTorchSupport({ getCapabilities: () => ({ torch: true }) })).toBe(true)
    expect(getTorchSupport({ getCapabilities: () => ({}) })).toBe(false)
    expect(getTorchSupport({})).toBe(false)
  })
})
