<script setup lang="ts">
import { ref, computed, watch, toRaw, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { useChat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import { getTextFromMessage, toFileUIParts } from '@nuxt/ui/utils/ai'
import type { FileUIPart, UIMessage } from 'ai'
import type { ChatPromptQueueItem } from '@nuxt/ui'
import { useModels } from '../../composables/useModels'
import { useChats } from '../../composables/useChats'
import { useCsrf } from '../../composables/useCsrf'
import { useRoute } from 'vue-router'
import ChatMessageContent from '../../components/chat/message/MessageContent.vue'
import ChatMessageActions from '../../components/chat/message/MessageActions.vue'
import ChatVisibility from '../../components/chat/ChatVisibility.vue'
import ChatTitle from '../../components/chat/ChatTitle.vue'
import ChatIndicator from '../../components/chat/Indicator.vue'
import Navbar from '../../components/Navbar.vue'
import ChatPrompt from '../../components/chat/Prompt.vue'
import { useChatSettings } from '../../composables/useChatSettings'
import type { Vote } from '../../../server/utils/drizzle'

const route = useRoute<'/chat/[id]'>()
const toast = useToast()
const { model } = useModels()
const { webSearch, reasoning } = useChatSettings()
const { fetchChats, chats } = useChats()
const { csrf, headerName } = useCsrf()

const data = await $fetch(`/api/chats/${route.params.id}`).catch(() => null)

const isOwner = computed(() => data?.isOwner ?? false)
const visibility = ref<'public' | 'private'>(data?.visibility ?? 'private')
const title = ref<string | null>(data?.title ?? null)

watch(() => chats.value.find(c => c.id === data?.id)?.label, (label) => {
  if (label && label !== 'Untitled') {
    title.value = label
  }
})

const votes = ref<Vote[]>([])
if (isOwner.value) {
  $fetch(`/api/chats/votes/${route.params.id}`).then((v) => {
    votes.value = v
  }).catch(() => {})
}

const input = ref('')

const {
  messages,
  status,
  error,
  sendMessage,
  regenerate,
  stop,
  experimental_queuedMessages,
  experimental_removeQueuedMessage,
  experimental_sendQueuedMessageNow
} = useChat({
  id: data?.id,
  // Messages sent while a response is in progress wait in `experimental_queuedMessages` and go out one at a time
  experimental_queue: true,
  messages: data?.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${data?.id}`,
    headers: { [headerName]: csrf() },
    body: () => ({
      model: model.value,
      webSearch: webSearch.value,
      reasoning: reasoning.value
    })
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      fetchChats()
    }
  },
  onError(error) {
    let message = error.message
    if (typeof message === 'string' && message[0] === '{') {
      try {
        message = JSON.parse(message).message || message
      } catch {
        // keep original message on malformed JSON
      }
    }

    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

const files = ref<File[]>([])

// A submitted message waits here while its files are read, then goes to the chat in the order it was sent
const pending = ref<ChatPromptQueueItem[]>([])
// The file behind each file part, so a queued message can go back to the prompt with its files
const filesByUrl = new Map<string, File>()
let reading = false

async function sendPending() {
  if (reading) return

  reading = true
  try {
    while (pending.value[0]) {
      const item = pending.value[0]
      const attached = item.files ?? []

      let parts: FileUIPart[]
      try {
        // Inlined as data URLs, an app with large files would upload them first and send their URLs
        parts = await toFileUIParts(attached)
      } catch {
        // It stays at the front, sending it now tries again
        toast.add({
          description: 'Failed to read the attached files',
          icon: 'i-lucide-alert-circle',
          color: 'error'
        })
        return
      }

      // Removed or put back in the prompt while its files were read
      if (pending.value[0] !== item) continue

      pending.value.shift()
      parts.forEach((part, index) => filesByUrl.set(part.url, attached[index]!))
      sendMessage(item.text.trim() ? { text: item.text, files: parts } : { files: parts })
    }
  } finally {
    reading = false
  }
}

function handleSubmit(e: Event) {
  e.preventDefault()

  if (!input.value.trim() && !files.value.length) return

  pending.value.push({ text: input.value, files: files.value })
  input.value = ''
  files.value = []
  sendPending()
}

function toQueueItem(message: UIMessage): ChatPromptQueueItem {
  return {
    id: message.id,
    text: getTextFromMessage(message),
    files: message.parts.flatMap(part => part.type === 'file' && filesByUrl.has(part.url) ? [filesByUrl.get(part.url)!] : [])
  }
}

function isSameItem(a: ChatPromptQueueItem, b: ChatPromptQueueItem) {
  return a.id ? a.id === b.id : toRaw(a) === toRaw(b)
}

// `UChatPrompt` edits the queue through `v-model:queue`: the chat holds the messages waiting for the response, `pending` the ones whose files are still read
const queue = computed<ChatPromptQueueItem[]>({
  get: () => [...experimental_queuedMessages.value.map(toQueueItem), ...pending.value],
  set: (next) => {
    for (const item of queue.value.filter(item => !next.some(n => isSameItem(n, item)))) {
      if (item.id) {
        experimental_removeQueuedMessage(item.id)
      } else {
        pending.value = pending.value.filter(p => !isSameItem(p, item))
      }
    }

    // A message submitted while the chat is busy
    const added = next.filter(item => !queue.value.some(q => isSameItem(q, item)))
    if (added.length) {
      pending.value.push(...added)
      sendPending()
    }
  }
})

// The file parts of the queued messages are the only ones that can go back to the prompt
watch(experimental_queuedMessages, (queued) => {
  const urls = new Set(queued.flatMap(message => message.parts.flatMap(part => part.type === 'file' ? [part.url] : [])))
  for (const url of filesByUrl.keys()) {
    if (!urls.has(url)) filesByUrl.delete(url)
  }
})

// The chat stops the response and sends the message next, one whose files are still read can't skip ahead
function onSend(item: ChatPromptQueueItem) {
  if (item.id) {
    experimental_sendQueuedMessageNow(item.id)
  } else {
    sendPending()
  }
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
  sendMessage({ text, messageId: message.id })
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

  regenerate({ messageId: message.id })
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
    regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    v-if="data?.id"
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none scroll-pt-(--ui-header-height)' }"
  >
    <template #header>
      <Navbar>
        <template #title>
          <ChatTitle
            :chat-id="data!.id"
            :title="title"
            :is-owner="isOwner"
            @update:title="title = $event"
          />
        </template>

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
          :messages="messages"
          :status="status"
          :class="['pt-(--ui-header-height)', !isOwner && 'pb-4 sm:pb-6']"
          :ui="{ footer: 'pt-4 sm:pt-6' }"
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

          <template #files="{ message, parts }">
            <UChatAttachment
              v-for="(part, index) in parts"
              :key="`${message.id}-${index}`"
              :name="part.filename"
              :type="part.mediaType"
              :url="part.url"
            />
          </template>

          <template #content="{ message, streaming }">
            <ChatMessageContent
              :message="message"
              :streaming="streaming"
              :editing="isOwner && editingMessageId === message.id"
              @save="saveEdit"
              @cancel-edit="cancelEdit"
            />
          </template>

          <template
            v-if="isOwner"
            #actions="{ message }"
          >
            <ChatMessageActions
              :message="message"
              :streaming="status === 'streaming' && message.id === messages[messages.length - 1]?.id"
              :editing="editingMessageId === message.id"
              :vote="getVote(message.id)"
              @edit="startEdit"
              @regenerate="regenerateMessage"
              @vote="vote"
            />
          </template>

          <template
            v-if="isOwner"
            #footer
          >
            <ChatPrompt
              v-model="input"
              v-model:files="files"
              v-model:queue="queue"
              :status="status"
              :error="error"
              class="[view-transition-name:chat-prompt] rounded-b-none backdrop-blur-sm"
              @submit="handleSubmit"
              @send="onSend"
              @stop="stop()"
              @reload="regenerate()"
            />
          </template>
        </UChatMessages>
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
