import { defineHandler, HTTPError } from 'nitro'
import { getValidatedRouterParams } from 'nitro/h3'
import { z } from 'zod'
import { useUserSession } from '../../../utils/session'
import { useDrizzle, tables, eq, and } from '../../../utils/drizzle'

export default defineHandler(async (event) => {
  const session = await useUserSession(event)
  const userId = session.data.user?.id
  if (!userId) {
    throw new HTTPError({ statusCode: 401, statusMessage: 'Sign in required' })
  }

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const db = useDrizzle()
  await db.delete(tables.memories)
    .where(and(eq(tables.memories.id, id), eq(tables.memories.userId, userId)))

  return { ok: true }
})
