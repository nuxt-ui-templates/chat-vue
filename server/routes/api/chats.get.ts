import { defineEventHandler } from 'h3'
import { useUserSession } from '../../utils/session'
import { useDrizzle, tables, eq } from '../../utils/drizzle'

export default defineEventHandler(async (event) => {
  const { data: session } = await useUserSession(event)

  return (await useDrizzle().select().from(tables.chats).where(eq(tables.chats.userId, session.user?.id || session.id!))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})
