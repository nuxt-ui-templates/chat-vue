<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatStatus } from 'ai'
import ModelSelect from '../ModelSelect.vue'
import ChatPromptMenu from './PromptMenu.vue'
import ChatDictateButton from './DictateButton.vue'

const props = withDefaults(defineProps<{
  status?: ChatStatus
  error?: Error
}>(), {
  status: 'ready',
  error: undefined
})

const emit = defineEmits<{
  submit: [event: Event]
  stop: []
  reload: []
}>()

const input = defineModel<string>({ default: '' })

const dictation = ref<'idle' | 'recording' | 'transcribing'>('idle')
const dictationPreview = ref('')
const placeholder = computed(() => {
  if (dictation.value === 'idle') return undefined
  return dictationPreview.value || (dictation.value === 'recording' ? 'Listening...' : 'Transcribing...')
})

const canDictate = computed(() => props.status === 'ready' && !input.value.trim())

function appendTranscript(text: string) {
  input.value = input.value.trim() ? `${input.value.trimEnd()} ${text}` : text
}
</script>

<template>
  <UChatPrompt
    v-model="input"
    :status="status"
    :error="error"
    :placeholder="placeholder"
    color="neutral"
    variant="subtle"
    :ui="{ base: ['px-1.5', dictation !== 'idle' && 'placeholder:italic'] }"
    @submit="emit('submit', $event)"
  >
    <template #footer>
      <ChatPromptMenu />

      <div class="flex items-center gap-1">
        <ModelSelect />

        <ChatDictateButton
          v-if="canDictate"
          v-model:state="dictation"
          v-model:preview="dictationPreview"
          @transcript="appendTranscript"
        />
        <UChatPromptSubmit
          v-else
          :status="status"
          color="neutral"
          size="sm"
          @stop="emit('stop')"
          @reload="emit('reload')"
        />
      </div>
    </template>
  </UChatPrompt>
</template>
