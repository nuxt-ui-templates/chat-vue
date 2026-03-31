import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import * as schema from '../database/schema'

export { sql, eq, and, or, desc } from 'drizzle-orm'

export const tables = schema

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:.data/sqlite.db',
  authToken: process.env.TURSO_AUTH_TOKEN
})

export function useDrizzle() {
  return drizzle(client, { schema })
}

export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
