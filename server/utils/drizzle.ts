import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import * as schema from '../database/schema'

export { sql, eq, and, or, asc, desc, inArray } from 'drizzle-orm'

export const tables = schema

let _db: ReturnType<typeof drizzle<typeof schema>>

export function useDrizzle() {
  if (!_db) {
    _db = drizzle(createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:.data/sqlite.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    }), { schema })
  }
  return _db
}

export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
export type Vote = typeof schema.votes.$inferSelect
