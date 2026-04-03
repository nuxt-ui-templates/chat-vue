import { defineHandler, HTTPError } from 'nitro'
import { getValidatedRouterParams } from 'nitro/h3'
import { useUserSession } from '../../../utils/session'
import { useDrizzle } from '../../../utils/drizzle'
import { z } from 'zod'


export default defineHandler(async (event) => {
  const session = await useUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await useDrizzle().query.chats.findFirst({
    where: (chat, { eq }) => eq(chat.id, id as string),
    with: {
      messages: {
        orderBy: (message, { asc }) => asc(message.createdAt)
      }
    }
  })

  if (!chat) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const userId = session.data.user?.id || session.id!
  const isOwner = chat.userId === userId

  if (chat.visibility === 'private' && !isOwner) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const { userId: _, ...rest } = chat
  return { ...rest, isOwner }
})
