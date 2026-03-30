import { useStorage } from '@vueuse/core'
import { MODELS } from '../../shared/utils/models'

export function useModels() {
  const model = useStorage<string>('model', 'anthropic/claude-haiku-4.5')

  return {
    models: MODELS,
    model
  }
}
