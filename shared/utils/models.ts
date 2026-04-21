export type ModelTier = 'flagship' | 'balanced' | 'fast'

export interface ModelEntry {
  label: string
  value: string
  icon: string
  tier: ModelTier
}

export const MODELS: ModelEntry[] = [
  { label: 'Claude Opus 4.7', value: 'anthropic/claude-opus-4-7', icon: 'i-simple-icons:anthropic', tier: 'flagship' },
  { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6', icon: 'i-simple-icons:anthropic', tier: 'balanced' },
  { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4-5', icon: 'i-simple-icons:anthropic', tier: 'fast' },
  { label: 'GPT-5', value: 'openai/gpt-5', icon: 'i-simple-icons:openai', tier: 'flagship' },
  { label: 'GPT-5 Mini', value: 'openai/gpt-5-mini', icon: 'i-simple-icons:openai', tier: 'fast' },
  { label: 'Gemini 3 Pro', value: 'google/gemini-3-pro', icon: 'i-simple-icons:google', tier: 'flagship' },
  { label: 'Gemini 3 Flash', value: 'google/gemini-3-flash', icon: 'i-simple-icons:google', tier: 'fast' }
]

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-6'
