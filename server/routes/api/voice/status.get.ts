import { defineHandler } from 'nitro'
import { getActiveVoiceProvider } from '../../../utils/voice'

export default defineHandler(() => {
  return { provider: getActiveVoiceProvider() }
})
