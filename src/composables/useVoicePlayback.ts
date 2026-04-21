import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useCsrf } from './useCsrf'

export const OPENAI_TTS_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'
]
export const AZURE_TTS_VOICES = [
  'en-US-AvaNeural', 'en-US-AndrewNeural', 'en-US-EmmaNeural', 'en-US-BrianNeural', 'en-US-JennyNeural'
]

const speaking = ref(false)
const currentAudio = ref<HTMLAudioElement | null>(null)

export function useVoicePlayback() {
  const { csrf, headerName } = useCsrf()
  const autoSpeak = useStorage('voice-auto-speak', false)
  const ttsVoice = useStorage<string>('voice-tts-voice', 'alloy')

  async function speak(text: string, voice?: string): Promise<void> {
    stop()
    const trimmed = text.trim().slice(0, 4000)
    if (!trimmed) return

    const res = await fetch('/api/voice/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [headerName]: csrf()
      },
      body: JSON.stringify({ text: trimmed, voice: voice || ttsVoice.value || undefined })
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(msg || `TTS failed (${res.status})`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio.value = audio
    speaking.value = true
    audio.onended = () => {
      speaking.value = false
      URL.revokeObjectURL(url)
      if (currentAudio.value === audio) currentAudio.value = null
    }
    audio.onerror = () => {
      speaking.value = false
      URL.revokeObjectURL(url)
      if (currentAudio.value === audio) currentAudio.value = null
    }
    await audio.play()
  }

  function stop() {
    if (currentAudio.value) {
      try { currentAudio.value.pause() } catch { /* ignore */ }
      currentAudio.value = null
    }
    speaking.value = false
  }

  return { speak, stop, speaking, autoSpeak, ttsVoice }
}
