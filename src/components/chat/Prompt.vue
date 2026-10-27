<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatStatus } from 'ai'
import type { ChatPromptQueueItem } from '@nuxt/ui'
import ModelSelect from '../ModelSelect.vue'
import ChatPromptMenu from './PromptMenu.vue'
import ChatDictateButton from './DictateButton.vue'

const props = withDefaults(defineProps<{
  status?: ChatStatus
  error?: Error
  disabled?: boolean
}>(), {
  status: 'ready',
  error: undefined
})

const emit = defineEmits<{
  submit: [event: Event]
  send: []
  stop: []
  reload: []
}>()

const input = defineModel<string>({ default: '' })
// Attachments are only enabled where the parent binds `v-model:files`
const files = defineModel<File[]>('files')
// Messages sent during a response wait in a queue where the parent binds `v-model:queue`
const queue = defineModel<ChatPromptQueueItem[]>('queue')

const dictation = ref<'idle' | 'recording' | 'transcribing'>('idle')
const dictationPreview = ref('')
const placeholder = computed(() => {
  if (dictation.value !== 'idle') {
    return dictationPreview.value || (dictation.value === 'recording' ? 'Listening...' : 'Transcribing...')
  }
  if (queue.value && (props.status === 'submitted' || props.status === 'streaming')) {
    return 'Queue a follow-up...'
  }
  return undefined
})

const canDictate = computed(() => dictation.value !== 'idle' || (props.status === 'ready' && !input.value.trim() && !files.value?.length))

function appendTranscript(text: string) {
  input.value = input.value.trim() ? `${input.value.trimEnd()} ${text}` : text
}
</script>

<template>
  <UChatPrompt
    v-model="input"
    v-model:files="files"
    v-model:queue="queue"
    accept="image/*,application/pdf"
    :status="status"
    :error="error"
    :disabled="disabled"
    :placeholder="placeholder"
    color="neutral"
    variant="subtle"
    :ui="{ base: ['px-1.5', dictation !== 'idle' && 'placeholder:italic'] }"
    @submit="emit('submit', $event)"
    @send="emit('send')"
  >
    <template #footer="{ open }">
      <ChatPromptMenu :open="files ? open : undefined" />

      <div class="flex items-center gap-1">
        <ModelSelect />

        <ChatDictateButton
          v-if="canDictate"
          v-model:state="dictation"
          v-model:preview="dictationPreview"
          :disabled="disabled"
          @transcript="appendTranscript"
        />
        <UChatPromptSubmit
          v-else
          :status="status"
          :disabled="disabled"
          color="neutral"
          size="sm"
          @stop="emit('stop')"
          @reload="emit('reload')"
        />
      </div>
    </template>
  </UChatPrompt>
</template>
