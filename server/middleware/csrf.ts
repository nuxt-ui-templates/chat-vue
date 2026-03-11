import { defineHandler, HTTPError } from 'nitro'
import { getCookie, setCookie } from 'nitro/h3'
import { randomUUID } from 'node:crypto'

const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export default defineHandler((event) => {
  let token = getCookie(event, CSRF_COOKIE)

  if (!token) {
    token = randomUUID()
    setCookie(event, CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
  }

  if (!SAFE_METHODS.includes(event.req.method)) {
    const headerToken = event.req.headers.get(CSRF_HEADER)
    if (!headerToken || headerToken !== token) {
      throw new HTTPError({ statusCode: 403, statusMessage: 'CSRF token mismatch' })
    }
  }
})
