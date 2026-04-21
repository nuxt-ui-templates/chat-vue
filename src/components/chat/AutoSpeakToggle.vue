<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <UTooltip :text="model ? 'Auto-speak replies on' : 'Auto-speak replies off'">
    <UButton
      size="sm"
      :icon="model ? 'i-lucide-volume-2' : 'i-lucide-volume-x'"
      :color="model ? 'primary' : 'neutral'"
      :variant="model ? 'soft' : 'ghost'"
      :aria-pressed="model"
      square
      @click="model = !model"
    />
  </UTooltip>
</template>
