import { useSession, type HTTPEvent, type Session } from 'nitro/h3'

export interface UserSession extends Session {
  user?: {
    id: string
    name: string
    avatar: string
    username: string
  }
}

export function useUserSession (event: HTTPEvent) {
  // Fallback secret lets preview deploys boot without env config. Anonymous-only
  // sessions are fine in that mode; real deployments must set SESSION_SECRET.
  const password = process.env.SESSION_SECRET
    || 'insecure-preview-secret-do-not-use-in-production-0001'
  return useSession<UserSession>(event, { password })
}
