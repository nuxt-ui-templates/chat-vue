import { defineHandler } from 'nitro'
import { readValidatedBody, setResponseHeader } from 'nitro/h3'
import { z } from 'zod'
import { useUserSession } from '../../../utils/session'
import { getVoiceAdapter } from '../../../utils/voice'

export default defineHandler(async (event) => {
  await useUserSession(event)

  const { text, voice } = await readValidatedBody(event, z.object({
    text: z.string().min(1).max(4000),
    voice: z.string().max(80).optional()
  }).parse)

  const adapter = getVoiceAdapter()
  const { audio, contentType } = await adapter.synthesize(text, { voice })

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'Content-Length', String(audio.byteLength))
  return new Uint8Array(audio)
})
