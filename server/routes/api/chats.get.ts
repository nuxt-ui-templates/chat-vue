import { defineHandler } from 'nitro'
import { useUserSession } from '../../utils/session'
import { useDrizzle, tables, eq } from '../../utils/drizzle'

export default defineHandler(async (event) => {
  const session = await useUserSession(event)

  return (await useDrizzle().select().from(tables.chats).where(eq(tables.chats.userId, session.data.user?.id || session.id!))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})
