<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useModels } from '../../composables/useModels'
import { useChatSettings } from '../../composables/useChatSettings'

const { model } = useModels()
const { webSearch, reasoning } = useChatSettings()

// Web search is a provider-defined tool, only available on Anthropic and OpenAI models.
const supportsWebSearch = computed(() => !model.value.startsWith('google/'))

const items = computed<DropdownMenuItem[]>(() => [{
  label: 'Web search',
  icon: 'i-lucide-globe',
  type: 'checkbox',
  checked: webSearch.value && supportsWebSearch.value,
  disabled: !supportsWebSearch.value,
  description: supportsWebSearch.value ? undefined : 'Not available with this model',
  onUpdateChecked: (checked: boolean) => {
    webSearch.value = checked
  },
  onSelect: (e: Event) => e.preventDefault()
}, {
  label: 'Extended thinking',
  icon: 'i-lucide-brain',
  type: 'checkbox',
  checked: reasoning.value,
  onUpdateChecked: (checked: boolean) => {
    reasoning.value = checked
  },
  onSelect: (e: Event) => e.preventDefault()
}])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: 'top', align: 'start', alignOffset: -4 }"
    :ui="{ content: 'w-52' }"
    size="sm"
  >
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Open prompt menu"
      class="data-[state=open]:bg-elevated"
    />
  </UDropdownMenu>
</template>
