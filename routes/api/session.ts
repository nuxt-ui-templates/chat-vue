import { defineEventHandler, isMethod } from "h3"
import { useUserSession } from "../../utils/session"

export default defineEventHandler(async (event) => {
  if (isMethod(event, 'DELETE')) {
    const session = await useUserSession(event)
    await session.clear()
    return { success: true }
  }

  const session = await useUserSession(event)

  return session.data
})
