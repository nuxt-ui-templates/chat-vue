<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { $fetch } from 'ofetch'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useModels } from '../../composables/useModels'
import { useChats } from '../../composables/useChats'
import { useCsrf } from '../../composables/useCsrf'
import { useVoicePlayback } from '../../composables/useVoicePlayback'
import { useRoute } from 'vue-router'
import ChatMessageContent from '../../components/chat/message/MessageContent.vue'
import ChatMessageActions from '../../components/chat/message/MessageActions.vue'
import ChatVisibility from '../../components/chat/ChatVisibility.vue'
import ChatIndicator from '../../components/chat/Indicator.vue'
import MicButton from '../../components/chat/MicButton.vue'
import ResearchToggle from '../../components/chat/ResearchToggle.vue'
import AutoSpeakToggle from '../../components/chat/AutoSpeakToggle.vue'
import SpeakButton from '../../components/chat/SpeakButton.vue'
import Navbar from '../../components/Navbar.vue'
import type { Vote } from '../../../server/utils/drizzle'

const route = useRoute<'/chat/[id]'>()
const toast = useToast()
const { model } = useModels()
const { fetchChats } = useChats()
const { csrf, headerName } = useCsrf()
const { autoSpeak, speak, stop: stopSpeaking } = useVoicePlayback()

const researchMode = ref(route.query.research === '1')
if (route.query.speak === '1') autoSpeak.value = true

const data = await $fetch(`/api/chats/${route.params.id}`).catch(() => null)

const isOwner = computed(() => data?.isOwner ?? false)
const visibility = ref<'public' | 'private'>(data?.visibility ?? 'private')

const votes = ref<Vote[]>([])
if (isOwner.value) {
  $fetch(`/api/chats/votes/${route.params.id}`).then((v) => {
    votes.value = v
  }).catch(() => {})
}

const input = ref('')

const chat = new Chat({
  id: data?.id,
  messages: data?.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${data?.id}`,
    headers: { [headerName]: csrf() },
    body: () => ({
      model: model.value,
      researchMode: researchMode.value
    })
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

function extractText(m: UIMessage): string {
  return m.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { text: string }).text)
    .join('\n')
    .trim()
}

// Auto-speak the final assistant message when finished streaming.
const lastSpokenId = ref<string | null>(null)
watch(
  () => ({ status: chat.status, messages: chat.messages.slice() }),
  ({ status, messages }) => {
    if (status !== 'ready' || !autoSpeak.value) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant' || lastSpokenId.value === last.id) return
    const text = extractText(last)
    if (!text) return
    lastSpokenId.value = last.id
    speak(text).catch(() => {})
  },
  { deep: true }
)

function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim()) {
    chat.sendMessage({ text: input.value })
    input.value = ''
  }
}

function onTranscript(text: string) {
  input.value = input.value ? `${input.value} ${text}` : text
}

function onVoiceSend(text: string) {
  const combined = input.value ? `${input.value} ${text}`.trim() : text
  if (!combined) return
  stopSpeaking()
  chat.sendMessage({ text: combined })
  input.value = ''
}

const editingMessageId = ref<string | null>(null)

function startEdit(message: UIMessage) {
  if (editingMessageId.value) return
  editingMessageId.value = message.id
}

function cancelEdit() {
  editingMessageId.value = null
}

async function saveEdit(message: UIMessage, text: string) {
  try {
    await $fetch(`/api/chats/messages/${data!.id}`, {
      method: 'DELETE',
      headers: { [headerName]: csrf() },
      body: { messageId: message.id, type: 'edit' }
    })
  } catch {
    toast.add({
      description: 'Failed to update message',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  editingMessageId.value = null
  chat.sendMessage({ text, messageId: message.id })
}

async function regenerateMessage(message: UIMessage) {
  try {
    await $fetch(`/api/chats/messages/${data!.id}`, {
      method: 'DELETE',
      headers: { [headerName]: csrf() },
      body: { messageId: message.id, type: 'regenerate' }
    })
  } catch {
    toast.add({
      description: 'Failed to regenerate message',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  chat.regenerate({ messageId: message.id })
}

function getVote(messageId: string) {
  const vote = votes.value.find(v => v.messageId === messageId)
  if (!vote) return null
  return !!vote.isUpvoted
}

async function vote(message: UIMessage, isUpvoted: boolean) {
  const snapshot = votes.value.map(v => ({ ...v }))
  const toggling = getVote(message.id) === isUpvoted
  const next = toggling ? null : isUpvoted

  votes.value = next === null
    ? votes.value.filter(v => v.messageId !== message.id)
    : [
        ...votes.value.filter(v => v.messageId !== message.id),
        { chatId: data!.id, messageId: message.id, isUpvoted: next }
      ]

  try {
    await $fetch(`/api/chats/votes/${data!.id}`, {
      method: 'POST',
      headers: { [headerName]: csrf() },
      body: next === null ? { messageId: message.id } : { messageId: message.id, isUpvoted: next }
    })
  } catch {
    votes.value = snapshot
    toast.add({
      description: 'Failed to save vote',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

onMounted(() => {
  if (isOwner.value && data?.messages?.length === 1) {
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
      <Navbar>
        <ChatVisibility
          v-if="isOwner"
          :chat-id="data!.id"
          :visibility="visibility"
          @update:visibility="visibility = $event"
        />
      </Navbar>
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :spacing-offset="isOwner ? 160 : 0"
          class="pt-(--ui-header-height) pb-4 sm:pb-6"
        >
          <template #indicator>
            <div class="flex items-center gap-1.5">
              <ChatIndicator />

              <UChatShimmer
                :text="researchMode ? 'Researching...' : 'Thinking...'"
                class="text-sm"
              />
            </div>
          </template>

          <template #content="{ message }">
            <ChatMessageContent
              :message="message"
              :editing="isOwner && editingMessageId === message.id"
              @save="saveEdit"
              @cancel-edit="cancelEdit"
            />
            <div
              v-if="message.role === 'assistant' && chat.status !== 'streaming'"
              class="mt-1 -ml-1"
            >
              <SpeakButton :text="extractText(message)" />
            </div>
          </template>

          <template
            v-if="isOwner"
            #actions="{ message }"
          >
            <ChatMessageActions
              :message="message"
              :streaming="chat.status === 'streaming' && message.id === chat.messages[chat.messages.length - 1]?.id"
              :editing="editingMessageId === message.id"
              :vote="getVote(message.id)"
              @edit="startEdit"
              @regenerate="regenerateMessage"
              @vote="vote"
            />
          </template>
        </UChatMessages>

        <UChatPrompt
          v-if="isOwner"
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10 pb-safe"
          :ui="{ base: 'px-1.5' }"
          @submit="handleSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-1">
              <ModelSelect v-model="model" />
              <ResearchToggle v-model="researchMode" />
              <AutoSpeakToggle v-model="autoSpeak" />
            </div>

            <div class="flex items-center gap-2">
              <MicButton
                :auto-send="!input.trim()"
                @transcript="onTranscript"
                @send="onVoiceSend"
              />

              <UChatPromptSubmit
                :status="chat.status"
                color="neutral"
                size="sm"
                @stop="chat.stop()"
                @reload="chat.regenerate()"
              />
            </div>
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
