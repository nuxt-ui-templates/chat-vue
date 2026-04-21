import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { MODELS, DEFAULT_MODEL } from '../../shared/utils/models'

export function useModels() {
  const stored = useStorage<string>('model', DEFAULT_MODEL)

  const model = computed<string>({
    get: () => MODELS.some(m => m.value === stored.value) ? stored.value : DEFAULT_MODEL,
    set: (v) => { stored.value = v }
  })

  return {
    models: MODELS,
    model
  }
}
