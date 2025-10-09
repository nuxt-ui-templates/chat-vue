import { createSharedComposable } from '@vueuse/core'
import { ref, computed } from 'vue'
import type { UserSession } from '../../server/utils/session'
import { $fetch } from 'ofetch'

export const useUserSession = createSharedComposable(() => {
  const session = ref<UserSession | null>(null)

  const clearSession = async () => {
    await $fetch('/api/session', {
      method: 'DELETE',
    })
    session.value = null
  }

  const fetchSession = async () => {
    session.value = await $fetch<UserSession>('/api/session').catch(() => null)
  }

  const popupListener = (e: StorageEvent) => {
    if (e.key === 'temp-auth-popup') {
      fetchSession()
      window.removeEventListener('storage', popupListener)
    }
  }
  const openInPopup = (route: string, size: { width?: number, height?: number } = {}) => {
    // Set a local storage item to tell the popup that we pending auth
    localStorage.setItem('temp-auth-popup', 'true')

    const width = size.width ?? 960
    const height = size.height ?? 600
    const top = (window.top?.outerHeight ?? 0) / 2
      + (window.top?.screenY ?? 0)
      - height / 2
    const left = (window.top?.outerWidth ?? 0) / 2
      + (window.top?.screenX ?? 0)
      - width / 2

    window.open(
      route,
      'nuxt-auth-utils-popup',
      `width=${width}, height=${height}, top=${top}, left=${left}, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no`,
    )

    window.addEventListener('storage', popupListener)
  }

  return {
    loggedIn: computed(() => Boolean(session.value?.user)),
    user: computed(() => session.value?.user || null),
    session,
    openInPopup,
    fetchSession,
    clearSession,
  }
})
