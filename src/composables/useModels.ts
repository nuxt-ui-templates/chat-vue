import { useStorage } from '@vueuse/core'
import { MODELS } from '../../shared/utils/models'

export function useModels() {
  const model = useStorage<string>('model', 'openai/gpt-5-nano')

  return {
    models: MODELS,
    model
  }
}
