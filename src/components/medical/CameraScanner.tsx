import { useEffect, useRef, useState } from 'react'
import { Flashlight, SwitchCamera, X } from 'lucide-react'
import { CAMERA_ERROR_MESSAGES, CameraError, getTorchSupport, openCamera, setTorch, stopStream } from '../../lib/medical/camera'
import type { CameraErrorCode } from '../../lib/medical/camera'
import { captureFromVideo } from '../../lib/medical/imageCapture'
import type { CapturedImage } from '../../lib/medical/imageCapture'
import { logEvent } from '../../lib/medical/safeLog'
import { assessGray, toGray } from '../../lib/medical/quality'
import type { QualityIssue } from '../../lib/medical/quality'

const GUIDANCE: Record<QualityIssue, string> = {
  'too-dark': 'Too dark. Move to better light.',
  'too-bright': 'Too bright or glare. Tilt the page or reduce direct light.',
  'low-contrast': 'Low contrast. Place the page on a plain, contrasting surface.',
  blurry: 'Image looks soft. Hold steady, move slightly back, and let the camera focus.',
}

type State = { status: 'starting' } | { status: 'live' } | { status: 'error'; code: CameraErrorCode }

interface Props {
  pageNumber: number
  onCaptured: (image: CapturedImage) => void
  onClose: () => void
  onManualEntry: () => void
  onPickFile: () => void
}

const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua'

export default function CameraScanner({ pageNumber, onCaptured, onClose, onManualEntry, onPickFile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<State>({ status: 'starting' })
  const [attempt, setAttempt] = useState(0)
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [torch, setTorchState] = useState({ supported: false, on: false })
  const [issues, setIssues] = useState<QualityIssue[]>([])
  const [busy, setBusy] = useState(false)
  const [captureFailed, setCaptureFailed] = useState(false)

  // Open the camera; ALWAYS stop every track on cleanup (device change, retry, close, unmount).
  useEffect(() => {
    let cancelled = false
    setState({ status: 'starting' })
    openCamera({ isSecureContext: window.isSecureContext, mediaDevices: navigator.mediaDevices }, deviceId)
      .then(async (stream) => {
        if (cancelled) {
          stopStream(stream)
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        const track = stream.getVideoTracks()[0]
        setActiveId(track?.getSettings().deviceId)
        setTorchState({ supported: track ? getTorchSupport(track) : false, on: false })
        setState({ status: 'live' })
        try {
          const all = await navigator.mediaDevices.enumerateDevices()
          if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'))
        } catch {
          /* device list is optional */
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const code = err instanceof CameraError ? err.code : 'unknown'
        logEvent('camera.open.failed', { permissionDenied: code === 'permission-denied' })
        setState({ status: 'error', code })
      })
    return () => {
      cancelled = true
      stopStream(streamRef.current)
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [deviceId, attempt])

  // Release the camera if the page is being hidden or navigated away from.
  useEffect(() => {
    const release = () => {
      stopStream(streamRef.current)
      streamRef.current = null
    }
    window.addEventListener('pagehide', release)
    return () => window.removeEventListener('pagehide', release)
  }, [])

  // Live on-device guidance from a small downscaled frame. Frames are never stored or sent anywhere.
  useEffect(() => {
    if (state.status !== 'live') return
    const canvas = document.createElement('canvas')
    const id = window.setInterval(() => {
      const v = videoRef.current
      if (!v || v.videoWidth === 0) return
      const w = 320
      const h = Math.max(1, Math.round((v.videoHeight / v.videoWidth) * w))
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(v, 0, 0, w, h)
      const next = assessGray(toGray(ctx.getImageData(0, 0, w, h).data, w, h), w, h).issues
      setIssues((prev) => (prev.join() === next.join() ? prev : next))
    }, 700)
    return () => window.clearInterval(id)
  }, [state.status])

  const capture = async () => {
    const video = videoRef.current
    if (!video || busy || state.status !== 'live') return
    setBusy(true)
    setCaptureFailed(false)
    try {
      onCaptured(await captureFromVideo(video))
    } catch {
      setCaptureFailed(true)
      setBusy(false)
    }
  }

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await setTorch(track, !torch.on)
      setTorchState((t) => ({ ...t, on: !t.on }))
    } catch {
      setTorchState({ supported: false, on: false })
    }
  }

  const switchCamera = () => {
    if (devices.length < 2) return
    const idx = devices.findIndex((d) => d.deviceId === activeId)
    setDeviceId(devices[(idx + 1) % devices.length].deviceId)
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-navy text-white shadow-card">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-heading text-base font-semibold">Scan page {pageNumber}</p>
        <button type="button" onClick={onClose} aria-label="Close camera" className={`rounded-full p-2 hover:bg-white/10 ${ring}`}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {state.status === 'error' ? (
        <div role="alert" className="space-y-4 px-5 pb-6 pt-2">
          <p className="text-sm text-slate-200">{CAMERA_ERROR_MESSAGES[state.code]}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`rounded-full bg-aqua px-4 py-2 text-sm font-semibold text-navy ${ring}`}>
              Try again
            </button>
            <button type="button" onClick={onPickFile} className={`rounded-full border border-white/30 px-4 py-2 text-sm font-semibold ${ring}`}>
              Choose an image file
            </button>
            <button type="button" onClick={onManualEntry} className={`rounded-full border border-white/30 px-4 py-2 text-sm font-semibold ${ring}`}>
              Enter details manually
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto aspect-[3/4] max-h-[70vh] w-full bg-black sm:aspect-video">
            <video ref={videoRef} playsInline muted autoPlay aria-label="Live camera preview" className="h-full w-full object-contain" />
            {state.status === 'starting' && (
              <p role="status" className="absolute inset-0 grid place-items-center text-sm text-slate-200">
                Starting camera…
              </p>
            )}
            {state.status === 'live' && <div aria-hidden="true" className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed border-aqua/80" />}
          </div>
          <p aria-live="polite" className="min-h-[2.75rem] px-4 pt-3 text-center text-sm text-slate-200">
            {captureFailed
              ? 'That capture failed. Please try again.'
              : state.status !== 'live'
                ? ' '
                : issues.length > 0
                  ? GUIDANCE[issues[0]]
                  : 'Keep the whole page inside the frame and hold steady, then tap the shutter.'}
          </p>
          <div className="flex items-center justify-center gap-6 px-4 pb-6 pt-2">
            <button
              type="button"
              onClick={toggleTorch}
              disabled={!torch.supported}
              aria-pressed={torch.on}
              aria-label={torch.on ? 'Turn light off' : 'Turn light on'}
              className={`rounded-full border border-white/30 p-3 disabled:opacity-30 ${torch.on ? 'bg-white/20' : ''} ${ring} ${torch.supported ? '' : 'invisible'}`}
            >
              <Flashlight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={capture}
              disabled={state.status !== 'live' || busy}
              aria-label={`Capture page ${pageNumber}`}
              className={`grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-aqua disabled:opacity-40 ${ring}`}
            >
              <span className="sr-only">Capture</span>
            </button>
            <button
              type="button"
              onClick={switchCamera}
              aria-label="Switch camera"
              className={`rounded-full border border-white/30 p-3 ${ring} ${devices.length > 1 ? '' : 'invisible'}`}
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
          <p className="px-4 pb-4 text-center text-xs text-slate-400">Framing guide only. The page is not detected automatically. Nothing is recorded or uploaded.</p>
        </>
      )}
    </div>
  )
}
