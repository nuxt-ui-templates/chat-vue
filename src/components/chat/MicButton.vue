<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { useVoiceCapture } from '../../composables/useVoiceCapture'
import { useCsrf } from '../../composables/useCsrf'

const props = withDefaults(defineProps<{
  autoSend?: boolean
  disabled?: boolean
}>(), {
  autoSend: false,
  disabled: false
})

const emit = defineEmits<{
  transcript: [text: string]
  send: [text: string]
  error: [message: string]
}>()

const toast = useToast()
const { csrf, headerName } = useCsrf()
const { recording, level, supported, start, stop, cancel } = useVoiceCapture()

const busy = ref(false)
const holdStartedAt = ref(0)
const MIN_HOLD_MS = 250

async function begin() {
  if (props.disabled || busy.value || recording.value) return
  try {
    holdStartedAt.value = Date.now()
    await start()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Microphone error'
    emit('error', msg)
    toast.add({ description: msg, icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

async function end() {
  if (!recording.value) return
  const held = Date.now() - holdStartedAt.value
  if (held < MIN_HOLD_MS) {
    await cancel()
    return
  }
  busy.value = true
  try {
    const { blob, mimeType } = await stop()
    const form = new FormData()
    form.set('audio', blob, `audio.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`)
    form.set('mimeType', mimeType)

    const res = await fetch('/api/voice/transcribe', {
      method: 'POST',
      headers: { [headerName]: csrf() },
      body: form
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(msg || `Transcription failed (${res.status})`)
    }
    const { text } = await res.json() as { text?: string }
    const clean = (text || '').trim()
    if (!clean) {
      toast.add({ description: "Didn't catch that — try again.", icon: 'i-lucide-mic-off', color: 'warning' })
      return
    }
    emit('transcript', clean)
    if (props.autoSend) emit('send', clean)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Transcription failed'
    emit('error', msg)
    toast.add({ description: msg, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    busy.value = false
  }
}

// Keyboard: hold SPACE to talk (when no input is focused)
function onKeyDown(e: KeyboardEvent) {
  if (e.code !== 'Space' || e.repeat) return
  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  e.preventDefault()
  begin()
}
function onKeyUp(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  e.preventDefault()
  end()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 && e.pointerType === 'mouse') return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  begin()
}
function onPointerUp() {
  end()
}
function onPointerCancel() {
  cancel()
}
</script>

<template>
  <UTooltip :text="supported ? 'Hold to talk (or hold Space)' : 'Mic not supported'">
    <button
      type="button"
      class="mic-press relative inline-flex items-center justify-center rounded-full size-9 select-none outline-none touch-none transition-colors"
      :class="[
        recording ? 'bg-primary-500 text-white' : 'bg-elevated text-toned hover:bg-accented',
        (disabled || !supported) ? 'opacity-50 pointer-events-none' : ''
      ]"
      :data-recording="recording ? 'true' : 'false'"
      :aria-pressed="recording"
      :aria-label="recording ? 'Release to send' : 'Hold to talk'"
      :disabled="disabled || !supported || busy"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @pointercancel="onPointerCancel"
      @contextmenu.prevent
    >
      <span
        v-if="recording"
        class="absolute inset-0 rounded-full ring-2 ring-primary-300/70 animate-ping"
      />
      <span
        v-if="recording"
        class="absolute inset-0 rounded-full bg-primary-500/40"
        :style="{ transform: `scale(${1 + level * 0.6})` }"
      />
      <UIcon
        :name="busy ? 'i-lucide-loader-2' : (recording ? 'i-lucide-mic' : 'i-lucide-mic')"
        :class="['relative size-4.5', busy ? 'animate-spin' : '']"
      />
    </button>
  </UTooltip>
</template>
