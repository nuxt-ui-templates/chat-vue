import { HTTPError } from 'nitro'
import { openaiVoice } from './openai'
import { azureVoice } from './azure'

export interface VoiceAdapter {
  name: 'openai' | 'azure'
  transcribe(audio: Buffer, mimeType: string): Promise<{ text: string }>
  synthesize(text: string, opts?: { voice?: string }): Promise<{ audio: Buffer, contentType: string }>
}

export function getVoiceAdapter(): VoiceAdapter {
  const provider = (process.env.VOICE_PROVIDER || 'openai').toLowerCase()

  if (provider === 'azure') {
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      throw new HTTPError({
        statusCode: 501,
        statusMessage: 'Azure Speech is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.'
      })
    }
    return azureVoice
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new HTTPError({
      statusCode: 501,
      statusMessage: 'OpenAI voice is not configured. Set OPENAI_API_KEY or switch VOICE_PROVIDER=azure.'
    })
  }
  return openaiVoice
}

export function getActiveVoiceProvider(): 'openai' | 'azure' | null {
  try {
    return getVoiceAdapter().name
  } catch {
    return null
  }
}
