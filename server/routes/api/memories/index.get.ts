import { defineHandler } from 'nitro'
import { useUserSession } from '../../../utils/session'
import { useDrizzle, tables, eq, desc } from '../../../utils/drizzle'

export default defineHandler(async (event) => {
  const session = await useUserSession(event)
  const userId = session.data.user?.id
  if (!userId) {
    return []
  }

  const db = useDrizzle()
  return db.select().from(tables.memories)
    .where(eq(tables.memories.userId, userId))
    .orderBy(desc(tables.memories.createdAt))
})
