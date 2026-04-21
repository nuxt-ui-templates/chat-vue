import { defineHandler, HTTPError } from 'nitro'
import { readFormData } from 'nitro/h3'
import { useUserSession } from '../../../utils/session'
import { getVoiceAdapter } from '../../../utils/voice'

const MAX_BYTES = 20 * 1024 * 1024

export default defineHandler(async (event) => {
  await useUserSession(event)

  const form = await readFormData(event)
  const file = form.get('audio')
  if (!(file instanceof Blob)) {
    throw new HTTPError({ statusCode: 400, statusMessage: 'Expected multipart field "audio" as Blob' })
  }
  if (file.size > MAX_BYTES) {
    throw new HTTPError({ statusCode: 413, statusMessage: 'Audio too large (20MB max)' })
  }
  if (file.size < 512) {
    return { text: '' }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || (form.get('mimeType') as string | null) || 'audio/webm'

  const adapter = getVoiceAdapter()
  const { text } = await adapter.transcribe(buf, mimeType)
  return { text, provider: adapter.name }
})
