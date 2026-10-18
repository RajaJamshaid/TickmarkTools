/**
 * Camera helpers with injectable browser objects so they can be unit-tested without a browser.
 * Nothing here records, uploads, or stores video.
 */

export type CameraErrorCode = 'insecure-context' | 'unsupported' | 'permission-denied' | 'no-device' | 'in-use' | 'overconstrained' | 'unknown'

export const CAMERA_ERROR_MESSAGES: Record<CameraErrorCode, string> = {
  'insecure-context': 'Camera access needs a secure (HTTPS) connection. Open this page over HTTPS, or enter your bill details manually.',
  unsupported: 'This browser does not support camera access. Try a current version of Chrome, Safari, Edge, or Firefox, or enter your bill details manually.',
  'permission-denied': 'Camera permission was denied. You can allow it in your browser’s site settings and try again, or enter your bill details manually.',
  'no-device': 'No camera was found on this device. You can choose an image file or enter your bill details manually.',
  'in-use': 'The camera is busy or could not start. Close other apps that may be using it and try again.',
  overconstrained: 'This camera could not provide the requested video. Try switching cameras.',
  unknown: 'The camera could not be started. You can try again, choose an image file, or enter your bill details manually.',
}

export class CameraError extends Error {
  readonly code: CameraErrorCode
  constructor(code: CameraErrorCode) {
    super(code)
    this.name = 'CameraError'
    this.code = code
  }
}

export interface CameraEnv {
  isSecureContext: boolean
  mediaDevices?: { getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> } | undefined
}

export function classifyCameraError(err: unknown): CameraErrorCode {
  const name = typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'permission-denied'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'no-device'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'in-use'
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'overconstrained'
    default:
      return 'unknown'
  }
}

export function buildConstraints(deviceId?: string): MediaStreamConstraints {
  return {
    audio: false,
    video: deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  }
}

/** Opens the camera. Must be called from a user action. Throws CameraError with a specific code. */
export async function openCamera(env: CameraEnv, deviceId?: string): Promise<MediaStream> {
  if (!env.isSecureContext) throw new CameraError('insecure-context')
  const md = env.mediaDevices
  if (!md || typeof md.getUserMedia !== 'function') throw new CameraError('unsupported')
  try {
    return await md.getUserMedia(buildConstraints(deviceId))
  } catch (err) {
    const code = classifyCameraError(err)
    if (code === 'overconstrained' && deviceId) {
      try {
        return await md.getUserMedia(buildConstraints())
      } catch (retryErr) {
        throw new CameraError(classifyCameraError(retryErr))
      }
    }
    throw new CameraError(code)
  }
}

/** Stops every track so the camera light turns off. Safe to call with null or more than once. */
export function stopStream(stream: { getTracks(): { stop(): void }[] } | null | undefined): number {
  if (!stream) return 0
  const tracks = stream.getTracks()
  for (const t of tracks) t.stop()
  return tracks.length
}

interface TorchTrack {
  getCapabilities?: () => unknown
  applyConstraints(constraints: unknown): Promise<void>
}

export function getTorchSupport(track: Pick<TorchTrack, 'getCapabilities'>): boolean {
  const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null
  return typeof caps === 'object' && caps !== null && (caps as { torch?: unknown }).torch === true
}

export async function setTorch(track: TorchTrack, on: boolean): Promise<void> {
  await track.applyConstraints({ advanced: [{ torch: on }] })
}
