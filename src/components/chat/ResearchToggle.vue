<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <UTooltip :text="model ? 'Research mode on — plans, searches, cites' : 'Research mode off'">
    <UButton
      size="sm"
      :icon="'i-lucide-telescope'"
      :color="model ? 'primary' : 'neutral'"
      :variant="model ? 'soft' : 'ghost'"
      :aria-pressed="model"
      square
      @click="model = !model"
    />
  </UTooltip>
</template>
