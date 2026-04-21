<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { $fetch } from 'ofetch'
import { useChats } from '../composables/useChats'
import { useCsrf } from '../composables/useCsrf'
import { useUserSession } from '../composables/useUserSession'
import { useVoicePlayback } from '../composables/useVoicePlayback'
import Navbar from '../components/Navbar.vue'
import MicButton from '../components/chat/MicButton.vue'
import ResearchToggle from '../components/chat/ResearchToggle.vue'
import AutoSpeakToggle from '../components/chat/AutoSpeakToggle.vue'

const { fetchChats } = useChats()
const { csrf, headerName } = useCsrf()
const { user } = useUserSession()
const { autoSpeak } = useVoicePlayback()
const input = ref('')
const loading = ref(false)
const researchMode = ref(false)
const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  let timeGreeting = 'Good evening'
  if (hour < 12) timeGreeting = 'Good morning'
  else if (hour < 18) timeGreeting = 'Good afternoon'

  const name = user.value?.name?.split(' ')[0] || user.value?.username

  return name ? `${timeGreeting}, ${name}` : `${timeGreeting}`
})

async function createChat(prompt: string) {
  if (!prompt.trim()) return
  input.value = prompt
  loading.value = true
  try {
    const chat = await $fetch('/api/chats', {
      method: 'POST',
      headers: { [headerName]: csrf() },
      body: { input: prompt }
    })
    await fetchChats()
    const params = new URLSearchParams()
    if (researchMode.value) params.set('research', '1')
    if (autoSpeak.value) params.set('speak', '1')
    const qs = params.toString()
    router.push(`/chat/${chat?.id}${qs ? `?${qs}` : ''}`)
  } finally {
    loading.value = false
  }
}

function onSubmit() {
  createChat(input.value)
}

function onTranscript(text: string) {
  input.value = input.value ? `${input.value} ${text}` : text
}

const quickChats = [
  { label: 'Why use Nuxt UI?', icon: 'i-logos-nuxt-icon' },
  { label: 'Help me create a Vue composable', icon: 'i-logos-vue' },
  { label: 'Latest on Claude 4.7 release', icon: 'i-lucide-telescope' },
  { label: 'What is the weather in Bordeaux?', icon: 'i-lucide-sun' },
  { label: 'Show me a chart of sales data', icon: 'i-lucide-line-chart' }
]
</script>

<template>
  <UDashboardPanel
    id="home"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <Navbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          {{ greeting }}
        </h1>

        <p class="text-muted text-sm -mt-2">
          Hold the mic (or <kbd class="text-xs">Space</kbd>) to talk. Tap the telescope for deep research.
        </p>

        <UChatPrompt
          v-model="input"
          :status="loading ? 'streaming' : 'ready'"
          class="[view-transition-name:chat-prompt]"
          variant="subtle"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-1">
              <ModelSelect />
              <ResearchToggle v-model="researchMode" />
              <AutoSpeakToggle v-model="autoSpeak" />
            </div>

            <div class="flex items-center gap-2">
              <MicButton
                :auto-send="true"
                @transcript="onTranscript"
                @send="createChat"
              />
              <UChatPromptSubmit
                color="neutral"
                size="sm"
              />
            </div>
          </template>
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickChat in quickChats"
            :key="quickChat.label"
            :icon="quickChat.icon"
            :label="quickChat.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            @click="createChat(quickChat.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
