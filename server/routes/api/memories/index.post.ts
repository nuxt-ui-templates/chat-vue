import { defineHandler, HTTPError } from 'nitro'
import { readValidatedBody } from 'nitro/h3'
import { z } from 'zod'
import { useUserSession } from '../../../utils/session'
import { useDrizzle, tables, eq, sql } from '../../../utils/drizzle'

const MAX_PER_USER = 50

export default defineHandler(async (event) => {
  const session = await useUserSession(event)
  const userId = session.data.user?.id
  if (!userId) {
    throw new HTTPError({ statusCode: 401, statusMessage: 'Sign in to save memories' })
  }

  const { content } = await readValidatedBody(event, z.object({
    content: z.string().trim().min(1).max(2000)
  }).parse)

  const db = useDrizzle()
  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tables.memories)
    .where(eq(tables.memories.userId, userId))

  if (Number(count) >= MAX_PER_USER) {
    throw new HTTPError({ statusCode: 409, statusMessage: `Memory limit reached (${MAX_PER_USER}). Delete some first.` })
  }

  const [row] = await db.insert(tables.memories).values({
    userId,
    content
  }).returning()

  return row
})
