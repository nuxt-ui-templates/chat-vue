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

function onLogoError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.visibility = 'hidden'
}

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
      <div class="relative flex-1 flex flex-col overflow-hidden">
        <div
          class="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          :style="{ backgroundImage: 'url(/hermes-bg.png)', opacity: 0.5 }"
          aria-hidden="true"
        />
        <div
          class="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-default/30 via-default/10 to-default/70"
          aria-hidden="true"
        />

        <UContainer class="relative z-10 flex-1 flex flex-col justify-center gap-5 sm:gap-7 py-8">
          <div class="flex items-center gap-3">
            <img
              :src="'/hermes-logo.png'"
              alt="Hermes Agent"
              width="56"
              height="56"
              class="size-12 sm:size-14 rounded-2xl bg-white/80 dark:bg-white/90 ring-1 ring-black/5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] shrink-0"
              @error="onLogoError"
            >
            <div class="flex flex-col leading-tight">
              <span class="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold">Hermes Agent</span>
              <h1 class="text-2xl sm:text-3xl text-highlighted font-bold">
                Welcome to the platform for Hermes Agent
              </h1>
              <span class="text-sm text-muted mt-1">{{ greeting }}</span>
            </div>
          </div>

          <p class="text-muted text-sm">
            Hold the mic (or <kbd class="text-xs">Space</kbd>) to talk. Tap the telescope for deep research.
          </p>

          <UChatPrompt
            v-model="input"
            :status="loading ? 'streaming' : 'ready'"
            class="[view-transition-name:chat-prompt] backdrop-blur-xl bg-default/70 ring-1 ring-default/40 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] rounded-2xl"
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

          <nav
            aria-label="Quick prompts"
            class="flex flex-wrap gap-2"
          >
            <UButton
              v-for="quickChat in quickChats"
              :key="quickChat.label"
              :icon="quickChat.icon"
              :label="quickChat.label"
              size="sm"
              color="neutral"
              variant="outline"
              class="rounded-full backdrop-blur-md bg-default/60 ring-1 ring-default/40 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)] hover:bg-default/80 transition-colors"
              @click="createChat(quickChat.label)"
            />
          </nav>

          <section
            aria-labelledby="hermes-about"
            class="mt-2 sm:mt-4 grid gap-4 sm:grid-cols-2 text-sm"
          >
            <h2
              id="hermes-about"
              class="sr-only"
            >
              About Hermes Agent
            </h2>

            <article class="rounded-xl bg-default/60 backdrop-blur-md ring-1 ring-default/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] p-4">
              <h3 class="text-highlighted font-semibold mb-1">
                Hold-to-talk voice chat
              </h3>
              <p class="text-muted">
                Push the on-screen microphone (or hold <kbd>Space</kbd>) to record. Top-tier speech-to-text — OpenAI <code>gpt-4o-mini-transcribe</code> or Azure Neural Speech — turns your voice into text instantly, then the assistant streams a reply you can listen to.
              </p>
            </article>

            <article class="rounded-xl bg-default/60 backdrop-blur-md ring-1 ring-default/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] p-4">
              <h3 class="text-highlighted font-semibold mb-1">
                Deep research with citations
              </h3>
              <p class="text-muted">
                Toggle the telescope to enable Deep Research mode. Hermes Agent plans its approach, runs multi-step web searches across distinct angles, reconciles conflicting sources, and cites every non-obvious claim.
              </p>
            </article>

            <article class="rounded-xl bg-default/60 backdrop-blur-md ring-1 ring-default/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] p-4">
              <h3 class="text-highlighted font-semibold mb-1">
                Persistent memory across chats
              </h3>
              <p class="text-muted">
                Save facts, preferences, or guidelines once on the Settings page; Hermes Agent applies them to every new conversation so you never repeat yourself.
              </p>
            </article>

            <article class="rounded-xl bg-default/60 backdrop-blur-md ring-1 ring-default/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] p-4">
              <h3 class="text-highlighted font-semibold mb-1">
                Choose your model
              </h3>
              <p class="text-muted">
                Switch between Anthropic Claude Opus 4.7, Claude Sonnet 4.6, GPT-5, GPT-5 Mini, Gemini 3 Pro, and Gemini 3 Flash from the composer. Voice can run on OpenAI or Azure Cognitive Services.
              </p>
            </article>
          </section>

          <p class="sr-only">
            Hermes Agent — voice AI chatbot, mobile-first PWA, hold-to-talk push-to-talk, Whisper-grade transcription, neural text-to-speech, persistent memory, deep web research, citations, multi-model: Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5, GPT-5, GPT-5 Mini, Gemini 3 Pro, Gemini 3 Flash. Optional Microsoft Azure Speech backend.
          </p>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
