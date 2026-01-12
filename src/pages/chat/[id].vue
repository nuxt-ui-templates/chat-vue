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
import type { WeatherUIToolInvocation } from '../../../server/utils/tools/weather'
import type { ChartUIToolInvocation } from '../../../server/utils/tools/chart'
import ToolWeather from '../../components/tool/ToolWeather.vue'
import ToolChart from '../../components/tool/ToolChart.vue'
import Reasoning from '../../components/Reasoning.vue'

const route = useRoute<'/chat/[id]'>()
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

function copy(_e: MouseEvent, message: UIMessage) {
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
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :assistant="chat.status !== 'streaming' ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] } : { actions: [] }"
          :spacing-offset="160"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
        >
          <template #content="{ message }">
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
            >
              <Reasoning
                v-if="part.type === 'reasoning'"
                :text="part.text"
                :is-streaming="part.state !== 'done'"
              />
              <!-- Only render markdown for assistant messages to prevent XSS from user input -->
              <MarkdownRender
                v-else-if="part.type === 'text' && message.role === 'assistant'"
                :content="getTextFromMessage(message)"
              />
              <!-- User messages are rendered as plain text (safely escaped by Vue) -->
              <p
                v-else-if="part.type === 'text' && message.role === 'user'"
                class="whitespace-pre-wrap"
              >
                {{ part.text }}
              </p>
              <ToolWeather
                v-else-if="part.type === 'tool-weather'"
                :invocation="(part as WeatherUIToolInvocation)"
              />
              <ToolChart
                v-else-if="part.type === 'tool-chart'"
                :invocation="(part as ChartUIToolInvocation)"
              />
            </template>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          @submit="handleSubmit"
        >
          <template #footer>
            <ModelSelect v-model="model" />

            <UChatPromptSubmit
              :status="chat.status"
              color="neutral"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
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
