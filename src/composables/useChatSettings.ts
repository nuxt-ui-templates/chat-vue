import { useStorage } from '@vueuse/core'

export function useChatSettings() {
  const webSearch = useStorage<boolean>('web-search', true)
  const reasoning = useStorage<boolean>('reasoning', true)

  return {
    webSearch,
    reasoning
  }
}
