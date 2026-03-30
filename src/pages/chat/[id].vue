<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import type { UIMessage } from 'ai'
import { useClipboard } from '@vueuse/core'
import { isReasoningStreaming, isToolStreaming, getTextFromMessage } from '@nuxt/ui/utils/ai'
import { useModels } from '../../composables/useModels'
import { useChats } from '../../composables/useChats'
import { useCsrf } from '../../composables/useCsrf'
import { useRoute } from 'vue-router'
import MarkdownRender from 'vue-renderer-markdown'
import type { WeatherUIToolInvocation } from '../../../server/utils/tools/weather'
import type { ChartUIToolInvocation } from '../../../server/utils/tools/chart'
import DashboardNavbar from '../../components/dashboard/Navbar.vue'
import ChatIndicator from '../../components/chat/Indicator.vue'
import ChatToolChart from '../../components/chat/tool/Chart.vue'
import ChatToolWeather from '../../components/chat/tool/Weather.vue'
import ChatToolSources from '../../components/chat/tool/Sources.vue'
import { getMergedParts } from '../../utils/ai'
import { getSearchQuery, getSources } from '../../utils/tool'

const route = useRoute<'/chat/[id]'>()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()
const { fetchChats } = useChats()
const { csrf, headerName } = useCsrf()

const data = await $fetch(`/api/chats/${route.params.id}`)

const input = ref('')

const chat = new Chat({
  id: data?.id,
  messages: data?.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${data?.id}`,
    headers: { [headerName]: csrf() },
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
  if (data.messages?.length === 1) {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    v-if="data?.id"
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
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
          <template #indicator>
            <div class="flex items-center gap-1.5">
              <ChatIndicator />

              <UChatShimmer
                text="Thinking..."
                class="text-sm"
              />
            </div>
          </template>

          <template #content="{ message }">
            <template
              v-for="(part, index) in getMergedParts(message.parts)"
              :key="`${message.id}-${part.type}-${index}`"
            >
              <UChatReasoning
                v-if="isReasoningUIPart(part)"
                :text="part.text"
                :streaming="isReasoningStreaming(message, index, chat)"
                chevron="leading"
              >
                <MarkdownRender :content="part.text" />
              </UChatReasoning>

              <template v-else-if="isToolUIPart(part)">
                <ChatToolChart
                  v-if="getToolName(part) === 'chart'"
                  :invocation="{ ...(part as ChartUIToolInvocation) }"
                />
                <ChatToolWeather
                  v-else-if="getToolName(part) === 'weather'"
                  :invocation="{ ...(part as WeatherUIToolInvocation) }"
                />
                <UChatTool
                  v-else-if="getToolName(part) === 'web_search' || getToolName(part) === 'google_search'"
                  :text="isToolStreaming(part) ? 'Searching the web...' : 'Searched the web'"
                  :suffix="getSearchQuery(part)"
                  :streaming="isToolStreaming(part)"
                  chevron="leading"
                >
                  <ChatToolSources :sources="getSources(part)" />
                </UChatTool>
              </template>

              <template v-else-if="isTextUIPart(part)">
                <!-- Only render markdown for assistant messages to prevent XSS from user input -->
                <MarkdownRender
                  v-if="message.role === 'assistant'"
                  :content="part.text"
                />
                <!-- User messages are rendered as plain text (safely escaped by Vue) -->
                <p
                  v-else-if="message.role === 'user'"
                  class="whitespace-pre-wrap"
                >
                  {{ part.text }}
                </p>
              </template>
            </template>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          :ui="{ base: 'px-1.5' }"
          @submit="handleSubmit"
        >
          <template #footer>
            <ModelSelect v-model="model" />

            <UChatPromptSubmit
              :status="chat.status"
              color="neutral"
              size="sm"
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
      class="min-h-full"
    >
      <template #links>
        <UButton
          to="/"
          size="lg"
          label="Back to home"
        />
      </template>
    </UError>
  </UContainer>
</template>
