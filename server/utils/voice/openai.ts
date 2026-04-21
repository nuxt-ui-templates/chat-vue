import { HTTPError } from 'nitro'
import type { VoiceAdapter } from './index'

const STT_MODEL = process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe'
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts'
const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy'

function fileExtFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('mpeg')) return 'mp3'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

export const openaiVoice: VoiceAdapter = {
  name: 'openai',

  async transcribe(audio, mimeType) {
    const key = process.env.OPENAI_API_KEY
    if (!key) {
      throw new HTTPError({ statusCode: 501, statusMessage: 'OPENAI_API_KEY is not set' })
    }

    const form = new FormData()
    const blob = new Blob([audio], { type: mimeType || 'audio/webm' })
    form.set('file', blob, `audio.${fileExtFromMime(mimeType)}`)
    form.set('model', STT_MODEL)
    form.set('response_format', 'json')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new HTTPError({
        statusCode: 502,
        statusMessage: `OpenAI STT failed (${res.status}): ${detail.slice(0, 400)}`
      })
    }

    const data = await res.json() as { text?: string }
    return { text: (data.text || '').trim() }
  },

  async synthesize(text, opts) {
    const key = process.env.OPENAI_API_KEY
    if (!key) {
      throw new HTTPError({ statusCode: 501, statusMessage: 'OPENAI_API_KEY is not set' })
    }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: opts?.voice || DEFAULT_VOICE,
        input: text,
        format: 'mp3'
      })
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new HTTPError({
        statusCode: 502,
        statusMessage: `OpenAI TTS failed (${res.status}): ${detail.slice(0, 400)}`
      })
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return { audio: buf, contentType: 'audio/mpeg' }
  }
}
