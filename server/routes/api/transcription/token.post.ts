import { gateway } from 'ai'
import { defineHandler, HTTPError } from 'nitro'
import { useUserSession } from '../../../utils/session'
import { TRANSCRIPTION_MODEL } from '../../../../shared/utils/models'

export default defineHandler(async (event) => {
  const session = await useUserSession(event)
  if (!session.data.user) {
    throw new HTTPError({ statusCode: 401, statusMessage: 'Login required' })
  }

  return gateway.experimental_transcription.getToken({
    model: TRANSCRIPTION_MODEL,
    expiresAfterSeconds: 300
  })
})
