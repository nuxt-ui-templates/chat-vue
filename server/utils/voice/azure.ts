import { HTTPError } from 'nitro'
import type { VoiceAdapter } from './index'

const DEFAULT_VOICE = process.env.AZURE_TTS_VOICE || 'en-US-AvaNeural'
const DEFAULT_LANG = process.env.AZURE_STT_LANGUAGE || 'en-US'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sttContentType(mime: string): string {
  // Azure accepts webm/opus, ogg/opus, wav (PCM). Default to webm/opus from browsers.
  if (mime.includes('webm')) return 'audio/webm; codecs=opus'
  if (mime.includes('ogg')) return 'audio/ogg; codecs=opus'
  if (mime.includes('wav')) return 'audio/wav; codecs=audio/pcm; samplerate=16000'
  if (mime.includes('mp4')) return 'audio/mp4'
  return 'audio/webm; codecs=opus'
}

export const azureVoice: VoiceAdapter = {
  name: 'azure',

  async transcribe(audio, mimeType) {
    const key = process.env.AZURE_SPEECH_KEY
    const region = process.env.AZURE_SPEECH_REGION
    if (!key || !region) {
      throw new HTTPError({ statusCode: 501, statusMessage: 'Azure Speech is not configured' })
    }

    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(DEFAULT_LANG)}&format=detailed`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': sttContentType(mimeType),
        Accept: 'application/json'
      },
      body: new Uint8Array(audio)
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new HTTPError({
        statusCode: 502,
        statusMessage: `Azure STT failed (${res.status}): ${detail.slice(0, 400)}`
      })
    }

    const data = await res.json() as {
      RecognitionStatus?: string
      DisplayText?: string
      NBest?: Array<{ Display?: string, Lexical?: string }>
    }

    if (data.RecognitionStatus && data.RecognitionStatus !== 'Success') {
      return { text: '' }
    }

    const text = data.DisplayText || data.NBest?.[0]?.Display || ''
    return { text: text.trim() }
  },

  async synthesize(text, opts) {
    const key = process.env.AZURE_SPEECH_KEY
    const region = process.env.AZURE_SPEECH_REGION
    if (!key || !region) {
      throw new HTTPError({ statusCode: 501, statusMessage: 'Azure Speech is not configured' })
    }

    const voice = opts?.voice || DEFAULT_VOICE
    const ssml = `<speak version="1.0" xml:lang="${DEFAULT_LANG}"><voice name="${voice}">${escapeXml(text)}</voice></speak>`

    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'chat-vue-voice'
      },
      body: ssml
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new HTTPError({
        statusCode: 502,
        statusMessage: `Azure TTS failed (${res.status}): ${detail.slice(0, 400)}`
      })
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return { audio: buf, contentType: 'audio/mpeg' }
  }
}
