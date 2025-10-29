import { useStorage } from '@vueuse/core'

export function useModels() {
  const models = [
    'openai/gpt-5-nano',
    'anthropic/claude-haiku-4.5',
    'google/gemini-2.5-flash'
  ]


  const model = useStorage<string>('model', 'openai/gpt-5-nano')

  return {
    models,
    model
  }
}
