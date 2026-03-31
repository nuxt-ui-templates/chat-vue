import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:.data/sqlite.db',
    authToken: process.env.TURSO_AUTH_TOKEN
  }
})
