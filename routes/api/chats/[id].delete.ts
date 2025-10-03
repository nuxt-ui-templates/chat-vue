import { defineEventHandler, getValidatedRouterParams } from 'h3'
import { useUserSession } from '../../../utils/session'
import { useDrizzle, tables, eq, and } from '../../../utils/drizzle'
import { z } from 'zod'


export default defineEventHandler(async (event) => {
  const { data: session } = await useUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const db = useDrizzle()

  return await db.delete(tables.chats)
    .where(and(eq(tables.chats.id, id as string), eq(tables.chats.userId, session.user?.id || session.id!)))
    .returning()
})
