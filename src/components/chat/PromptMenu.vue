<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useChatSettings } from '../../composables/useChatSettings'

const props = defineProps<{
  /** Opens the file picker, the menu offers to add files when it is set. */
  open?: () => void
}>()

const { webSearch, reasoning } = useChatSettings()

const items = computed<DropdownMenuItem[][]>(() => [props.open
  ? [{
      label: 'Add files or photos',
      icon: 'i-lucide-paperclip',
      onSelect: () => props.open?.()
    }]
  : [], [{
  label: 'Web search',
  icon: 'i-lucide-globe',
  type: 'checkbox',
  checked: webSearch.value,
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
}]])
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
