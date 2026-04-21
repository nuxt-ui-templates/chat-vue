// Run Drizzle migrations before building, but only if a usable DB target is
// configured. On stateless hosts (e.g. Vercel) without Turso set, we skip
// silently so the build never fails on missing credentials. In production,
// migrations against Turso should either run here (when TURSO_* is set) or be
// applied out-of-band.
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const hasTurso = !!process.env.TURSO_DATABASE_URL
const allowLocal = process.env.ALLOW_LOCAL_SQLITE_MIGRATE === '1'

if (!hasTurso && !allowLocal) {
  console.log('[prebuild] skipping db:migrate (no TURSO_DATABASE_URL, ALLOW_LOCAL_SQLITE_MIGRATE!=1)')
  process.exit(0)
}

if (!hasTurso) {
  try {
    mkdirSync('.data', { recursive: true })
  } catch {
    // ignore
  }
}

const result = spawnSync('pnpm', ['run', 'db:migrate'], { stdio: 'inherit' })
process.exit(result.status ?? 1)
