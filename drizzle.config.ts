import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './database/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
