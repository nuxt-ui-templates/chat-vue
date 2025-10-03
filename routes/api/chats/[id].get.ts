import { defineEventHandler, getValidatedRouterParams } from 'h3'
import { useUserSession } from '../../../utils/session'
import { useDrizzle, tables, eq, and } from '../../../utils/drizzle'
import { z } from 'zod'


export default defineEventHandler(async (event) => {
  const { data: session } = await useUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await useDrizzle().query.chats.findFirst({
    where: (chat, { eq }) => and(eq(chat.id, id as string), eq(chat.userId, session.user?.id || session.id!)),
    with: {
      messages: true
    }
  })

  return chat
})
