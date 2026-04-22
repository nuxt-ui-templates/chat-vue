<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { useToast } from '@nuxt/ui/composables'
import Navbar from '../components/Navbar.vue'
import { useMemories } from '../composables/useMemories'
import { useUserSession } from '../composables/useUserSession'
import { useVoicePlayback, OPENAI_TTS_VOICES, AZURE_TTS_VOICES } from '../composables/useVoicePlayback'

const toast = useToast()
const { loggedIn, openInPopup } = useUserSession()
const { memories, loaded, fetchMemories, addMemory, deleteMemory } = useMemories()
const { autoSpeak, ttsVoice, speak } = useVoicePlayback()

const newMemory = ref('')
const saving = ref(false)

const provider = ref<'openai' | 'azure' | null>(null)
onMounted(async () => {
  if (loggedIn.value) await fetchMemories()
  try {
    const res = await $fetch<{ provider: 'openai' | 'azure' | null }>('/api/voice/status')
    provider.value = res.provider
  } catch {
    provider.value = null
  }
})

const voiceOptions = computed(() => {
  if (provider.value === 'azure') return AZURE_TTS_VOICES
  return OPENAI_TTS_VOICES
})

async function onAdd() {
  const content = newMemory.value.trim()
  if (!content) return
  saving.value = true
  try {
    await addMemory(content)
    newMemory.value = ''
    toast.add({ title: 'Memory saved', icon: 'i-lucide-check' })
  } catch (e) {
    toast.add({
      description: e instanceof Error ? e.message : 'Failed to save',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function onDelete(id: string) {
  try {
    await deleteMemory(id)
  } catch {
    toast.add({ description: 'Failed to delete', icon: 'i-lucide-alert-circle', color: 'error' })
  }
}

async function previewVoice() {
  try {
    await speak('This is how I will sound in your conversations.')
  } catch (e) {
    toast.add({
      description: e instanceof Error ? e.message : 'Preview failed',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel
    id="settings"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <Navbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-6 py-8 max-w-2xl">
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Settings — Agent Platform
          </h1>
          <p class="text-muted text-sm">
            Configure Hermes Agent: persistent memory, voice provider, and playback preferences.
          </p>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-brain" />
              <h2 class="font-semibold">
                Memory
              </h2>
            </div>
          </template>

          <div class="flex flex-col gap-3">
            <p class="text-sm text-muted">
              Facts the assistant should always remember across chats. Kept short helps most.
            </p>

            <template v-if="!loggedIn">
              <UAlert
                color="warning"
                variant="subtle"
                icon="i-lucide-log-in"
                title="Sign in to use memory"
                description="Memories are tied to your account."
              >
                <template #actions>
                  <UButton
                    label="Sign in with GitHub"
                    icon="i-simple-icons:github"
                    color="neutral"
                    @click="openInPopup('/auth/github')"
                  />
                </template>
              </UAlert>
            </template>

            <template v-else>
              <div class="flex gap-2">
                <UInput
                  v-model="newMemory"
                  placeholder="e.g. I prefer concise answers with citations"
                  class="flex-1"
                  :ui="{ base: 'w-full' }"
                  :maxlength="2000"
                  @keydown.enter="onAdd"
                />
                <UButton
                  icon="i-lucide-plus"
                  :loading="saving"
                  label="Add"
                  @click="onAdd"
                />
              </div>

              <p
                v-if="loaded && memories.length === 0"
                class="text-xs text-muted italic"
              >
                No memories yet.
              </p>

              <ul class="flex flex-col gap-2">
                <li
                  v-for="m in memories"
                  :key="m.id"
                  class="flex items-start gap-2 rounded-md bg-elevated/50 p-3"
                >
                  <UIcon
                    name="i-lucide-circle-dot"
                    class="mt-0.5 size-3.5 text-muted shrink-0"
                  />
                  <div class="flex-1 text-sm whitespace-pre-wrap">
                    {{ m.content }}
                  </div>
                  <UButton
                    icon="i-lucide-x"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    aria-label="Delete memory"
                    @click="onDelete(m.id)"
                  />
                </li>
              </ul>
            </template>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-mic" />
              <h2 class="font-semibold">
                Voice
              </h2>
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium">
                  Provider
                </p>
                <p class="text-xs text-muted">
                  Configured via <code>VOICE_PROVIDER</code> environment variable.
                </p>
              </div>
              <UBadge
                :color="provider ? 'primary' : 'error'"
                variant="subtle"
              >
                {{ provider ? (provider === 'openai' ? 'OpenAI' : 'Azure Speech') : 'Not configured' }}
              </UBadge>
            </div>

            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium">
                  TTS voice
                </p>
                <p class="text-xs text-muted">
                  Used when the assistant speaks replies.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <USelectMenu
                  v-model="ttsVoice"
                  :items="voiceOptions"
                  size="sm"
                  class="w-44"
                />
                <UButton
                  icon="i-lucide-play"
                  size="sm"
                  variant="soft"
                  aria-label="Preview voice"
                  @click="previewVoice"
                />
              </div>
            </div>

            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium">
                  Auto-speak replies
                </p>
                <p class="text-xs text-muted">
                  Play TTS automatically when the assistant finishes.
                </p>
              </div>
              <USwitch v-model="autoSpeak" />
            </div>

            <p class="text-xs text-muted">
              Push-to-talk uses the on-screen mic button or hold <kbd>Space</kbd>. PWAs can't bind to physical side buttons.
            </p>
          </div>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
