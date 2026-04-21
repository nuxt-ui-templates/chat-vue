import { ref } from 'vue'
import { $fetch } from 'ofetch'
import { useCsrf } from './useCsrf'

export interface Memory {
  id: string
  userId: string
  content: string
  createdAt: string
}

const memories = ref<Memory[]>([])
const loaded = ref(false)

export function useMemories() {
  const { csrf, headerName } = useCsrf()

  async function fetchMemories() {
    try {
      const rows = await $fetch<Memory[]>('/api/memories')
      memories.value = rows
    } catch {
      memories.value = []
    } finally {
      loaded.value = true
    }
  }

  async function addMemory(content: string) {
    const row = await $fetch<Memory>('/api/memories', {
      method: 'POST',
      headers: { [headerName]: csrf() },
      body: { content }
    })
    memories.value = [row, ...memories.value]
    return row
  }

  async function deleteMemory(id: string) {
    const snapshot = memories.value
    memories.value = memories.value.filter(m => m.id !== id)
    try {
      await $fetch(`/api/memories/${id}`, {
        method: 'DELETE',
        headers: { [headerName]: csrf() }
      })
    } catch (e) {
      memories.value = snapshot
      throw e
    }
  }

  return { memories, loaded, fetchMemories, addMemory, deleteMemory }
}
