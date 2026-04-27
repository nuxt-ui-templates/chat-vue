import { defineHandler, HTTPError } from 'nitro'
import { getValidatedRouterParams, readValidatedBody } from 'nitro/h3'
import { useUserSession } from '../../../../utils/session'
import { useDrizzle, tables, eq, and } from '../../../../utils/drizzle'
import { z } from 'zod'


export default defineHandler(async (event) => {
  const session = await useUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { title } = await readValidatedBody(event, z.object({
    title: z.string().trim().min(1).max(100)
  }).parse)

  const db = useDrizzle()

  const chat = await db.query.chats.findFirst({
    where: (chat) => and(
      eq(chat.id, id as string),
      eq(chat.userId, session.data.user?.id || session.id!)
    )
  })

  if (!chat) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  const [updated] = await db.update(tables.chats)
    .set({ title })
    .where(and(
      eq(tables.chats.id, id as string),
      eq(tables.chats.userId, session.data.user?.id || session.id!)
    ))
    .returning()

  if (!updated) {
    throw new HTTPError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  return updated
})
