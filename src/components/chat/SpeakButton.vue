<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { useVoicePlayback } from '../../composables/useVoicePlayback'

const props = defineProps<{
  text: string
}>()

const toast = useToast()
const { speak, stop, speaking } = useVoicePlayback()
const busy = ref(false)

async function onClick() {
  if (speaking.value) {
    stop()
    return
  }
  busy.value = true
  try {
    await speak(props.text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Speech failed'
    toast.add({ description: msg, icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UTooltip :text="speaking ? 'Stop' : 'Speak'">
    <UButton
      :icon="busy ? 'i-lucide-loader-2' : (speaking ? 'i-lucide-circle-stop' : 'i-lucide-volume-2')"
      color="neutral"
      variant="ghost"
      size="xs"
      :class="busy ? '[&_.iconify]:animate-spin' : ''"
      :disabled="busy || !text"
      @click="onClick"
    />
  </UTooltip>
</template>
