import { useSession, type HTTPEvent, type Session } from 'nitro/deps/h3'

export interface UserSession extends Session {
  user?: {
    id: string
    name: string
    avatar: string
    username: string
  }
}

export function useUserSession (event: HTTPEvent) {
  if (!process.env.SESSION_PASSWORD) {
    throw new Error('SESSION_PASSWORD environment variable is not set')
  }
  return useSession<UserSession>(event, {
    password: process.env.SESSION_PASSWORD
  })
}
