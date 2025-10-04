<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useClipboard } from '@vueuse/core'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import { useModels } from '../../composables/useModels'
import { useChats } from '../../composables/useChats'
import { useRoute } from 'vue-router'
import MarkdownRender from 'vue-renderer-markdown'

const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()
const { fetchChats } = useChats()

const chatData = await $fetch(`/api/chats/${route.params.id}`)

// if (!chatData) {
//   throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
// }

const input = ref('')

const chat = new Chat({
  id: chatData.id,
  messages: chatData.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${chatData.id}`,
    body: {
      model: model.value
    }
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      fetchChats()
    }
  },
  onError(error) {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim()) {
    chat.sendMessage({
      text: input.value
    })
    input.value = ''
  }
}

const copied = ref(false)

function copy(e: MouseEvent, message: UIMessage) {
  clipboard.copy(getTextFromMessage(message))

  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  if (chatData.messages?.length === 1) {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    v-if="chatData.id"
    id="chat"
    class="relative"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          :messages="chat.messages"
          :status="chat.status"
          :assistant="{ actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] }"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
          :spacing-offset="160"
        >
          <template #content="{ message }">
            <div class="space-y-4">
              <template
                v-for="(part, index) in message.parts"
                :key="`${part.type}-${index}-${message.id}`"
              >
                <UButton
                  v-if="part.type === 'reasoning' && part.state !== 'done'"
                  label="Thinking..."
                  variant="link"
                  color="neutral"
                  class="p-0"
                  loading
                />
              </template>
              <MarkdownRender
                :content="getTextFromMessage(message)"
              />
            </div>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          @submit="handleSubmit"
        >
          <UChatPromptSubmit
            :status="chat.status"
            color="neutral"
            @stop="chat.stop"
            @reload="chat.regenerate"
          />

          <template #footer>
            <ModelSelect v-model="model" />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
  <UContainer
    v-else
    class="flex-1 flex flex-col gap-4 sm:gap-6"
  >
    <UError

      :error="{ statusMessage: 'Chat not found', statusCode: 404 }"
    >
      <template #links>
        <UButton to="/">
          Back to home
        </UButton>
      </template>
    </UError>
  </UContainer>
</template>
