<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter, useRoute } from 'vue-router'
import { $fetch } from 'ofetch'
import ModalConfirm from '../components/ModalConfirm.vue'
import { useChats } from '../composables/useChats'
import { useUserSession } from '../composables/useUserSession'

const router = useRouter()
const route = useRoute<'/chat/[id]' | '/'>()
const toast = useToast()
const overlay = useOverlay()
const { loggedIn, openInPopup, fetchSession } = useUserSession()
const { groups, fetchChats } = useChats()

await fetchSession()
await fetchChats()

const open = ref(false)

const deleteModal = overlay.create(ModalConfirm, {
  props: {
    title: 'Delete chat',
    description: 'Are you sure you want to delete this chat? This cannot be undone.'
  }
})


watch(loggedIn, () => {
  fetchChats()
  open.value = false
})

const items = computed(() => groups.value?.flatMap((group) => {
  return [{
    label: group.label,
    type: 'label' as const
  }, ...group.items.map(item => ({
    ...item,
    slot: 'chat' as const,
    icon: undefined,
    class: item.label === 'Untitled' ? 'text-muted' : ''
  }))]
}))

async function deleteChat(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) {
    return
  }

  await $fetch(`/api/chats/${id}`, { method: 'DELETE' })

  toast.add({
    title: 'Chat deleted',
    description: 'Your chat has been deleted',
    icon: 'i-lucide-trash'
  })

  fetchChats()

  if ((route as RouteLocationNormalizedLoaded<'/chat/[id]'>).params?.id === id) {
    router.push('/')
  }
}

defineShortcuts({
  c: () => {
    router.push('/')
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="border-r-0 py-4"
    >
      <template #header="{ collapsed }">
        <ULink
          to="/"
          class="flex items-center gap-0.5"
        >
          <UIcon
            name="i-logos-vue"
            class="h-5 w-auto shrink-0"
          />
          <span
            v-if="!collapsed"
            class="text-xl font-bold text-highlighted"
          >Chat</span>
        </ULink>

        <div
          v-if="!collapsed"
          class="flex items-center gap-1.5 ms-auto"
        >
          <UDashboardSearchButton collapsed />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'New chat' }"
            variant="soft"
            block
            to="/"
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSearchButton collapsed />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu
          v-if="loggedIn"
          :collapsed="collapsed"
        />
        <UButton
          v-else
          :label="collapsed ? '' : 'Login with GitHub'"
          icon="i-simple-icons:github"
          color="neutral"
          variant="ghost"
          class="w-full"
          @click="openInPopup('/auth/github')"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      placeholder="Search chats..."
      :groups="[{
        id: 'links',
        items: [{
          label: 'New chat',
          to: '/',
          icon: 'i-lucide-square-pen'
        }]
      }, ...groups]"
    />

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0">
      <RouterView :key="route.path" />
    </div>
  </UDashboardGroup>
</template>
