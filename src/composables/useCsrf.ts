const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function getCsrfToken(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match?.[1] ?? ''
}

export function useCsrf() {
  return {
    csrf: getCsrfToken,
    headerName: CSRF_HEADER
  }
}
