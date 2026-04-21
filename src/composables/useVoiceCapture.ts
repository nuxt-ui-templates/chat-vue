import { ref, onBeforeUnmount } from 'vue'

export type CaptureResult = { blob: Blob, mimeType: string, durationMs: number }

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c
  }
  return ''
}

export function useVoiceCapture() {
  const recording = ref(false)
  const level = ref(0) // 0-1 amplitude for UI feedback
  const error = ref<string | null>(null)
  const supported = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined'

  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let raf = 0
  let startedAt = 0
  let stopResolver: ((r: CaptureResult) => void) | null = null
  let stopRejecter: ((e: unknown) => void) | null = null

  function tick() {
    if (!analyser) return
    const buf = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i]! - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / buf.length)
    level.value = Math.min(1, rms * 2.5)
    raf = requestAnimationFrame(tick)
  }

  function cleanup() {
    cancelAnimationFrame(raf)
    raf = 0
    level.value = 0
    analyser?.disconnect()
    analyser = null
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {})
    audioCtx = null
    stream?.getTracks().forEach(t => t.stop())
    stream = null
    recorder = null
    chunks = []
    recording.value = false
  }

  async function start() {
    if (recording.value) return
    error.value = null
    if (!supported) {
      error.value = 'Microphone is not supported in this browser.'
      throw new Error(error.value)
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
    } catch (e) {
      error.value = 'Microphone permission denied.'
      throw e
    }

    const mimeType = pickMimeType()
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data)
    }
    recorder.onerror = (e) => {
      error.value = 'Recording failed.'
      stopRejecter?.(e)
      cleanup()
    }
    recorder.onstop = () => {
      const type = recorder?.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunks, { type })
      const durationMs = Date.now() - startedAt
      const result: CaptureResult = { blob, mimeType: type, durationMs }
      stopResolver?.(result)
      stopResolver = null
      stopRejecter = null
      cleanup()
    }

    // Analyser for live amplitude
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new AC()
      const source = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      tick()
    } catch {
      // analyser is nice-to-have; ignore failures
    }

    startedAt = Date.now()
    recorder.start()
    recording.value = true
  }

  function stop(): Promise<CaptureResult> {
    return new Promise<CaptureResult>((resolve, reject) => {
      if (!recording.value || !recorder) {
        reject(new Error('not recording'))
        return
      }
      stopResolver = resolve
      stopRejecter = reject
      try {
        recorder.stop()
      } catch (e) {
        reject(e)
        cleanup()
      }
    })
  }

  async function cancel() {
    if (!recording.value) return
    try { recorder?.stop() } catch { /* ignore */ }
    cleanup()
  }

  onBeforeUnmount(() => cleanup())

  return { recording, level, error, supported, start, stop, cancel }
}
