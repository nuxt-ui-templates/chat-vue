import { useSession, type HTTPEvent, type Session } from 'h3'

interface UserSession extends Session {
  user?: {
    id: string
    name: string
    email: string
    avatar: string
    username: string
    provider: 'github'
    providerId: number
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
