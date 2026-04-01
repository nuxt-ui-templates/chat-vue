import { defineHandler, HTTPError } from 'nitro'
import { getValidatedRouterParams, readValidatedBody } from 'nitro/h3'
import { z } from 'zod'
import { useUserSession } from '../../../../utils/session'
import { useDrizzle, tables, eq, and } from '../../../../utils/drizzle'

export default defineHandler(async (event) => {
  const session = await useUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { messageId, isUpvoted } = await readValidatedBody(event, z.object({
    messageId: z.string(),
    isUpvoted: z.boolean().optional()
  }).parse)

  const db = useDrizzle()

  const chat = await db.query.chats.findFirst({
    where: (chat, { eq }) => and(eq(chat.id, id as string), eq(chat.userId, session.data.user?.id || session.id!))
  })

  if (!chat) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const message = await db.query.messages.findFirst({
    where: (message, { eq }) => and(eq(message.id, messageId), eq(message.chatId, id as string))
  })

  if (!message) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Message not found' })
  }

  const existing = await db.select().from(tables.votes).where(
    and(
      eq(tables.votes.chatId, id as string),
      eq(tables.votes.messageId, messageId)
    )
  )

  if (isUpvoted === undefined) {
    await db.delete(tables.votes).where(
      and(
        eq(tables.votes.chatId, id as string),
        eq(tables.votes.messageId, messageId)
      )
    )
  } else if (existing.length > 0) {
    await db.update(tables.votes)
      .set({ isUpvoted })
      .where(and(
        eq(tables.votes.chatId, id as string),
        eq(tables.votes.messageId, messageId)
      ))
  } else {
    await db.insert(tables.votes).values({
      chatId: id as string,
      messageId,
      isUpvoted
    })
  }

  return { chatId: id, messageId, isUpvoted }
})
