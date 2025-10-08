import { FetchError, $fetch } from 'ofetch'
import { getRandomValues } from 'uncrypto'
import type { H3Event } from 'nitro/deps/h3'
import { eventHandler, getQuery, redirect, HTTPError, getRequestURL, setCookie, deleteCookie, getCookie } from 'nitro/deps/h3'
import { withQuery } from 'ufo'
import { defu } from 'defu'
import type { Endpoints } from '@octokit/types'
import { useUserSession } from '../../utils/session'

interface RequestAccessTokenResponse {
  access_token?: string
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
  error_uri?: string
}

interface RequestAccessTokenOptions {
  headers?: Record<string, string>
  body?: Record<string, string>
  params?: Record<string, string>
}

export default eventHandler(async (event: H3Event) => {
  const config = {
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
  }

  const query = getQuery<{ code?: string, error?: string, state?: string }>(event)

  if (query.error) {
    throw new HTTPError({
      statusCode: 401,
      message: `GitHub login failed: ${query.error || 'Unknown error'}`,
      data: query,
    })
  }

  if (!config.clientId || !config.clientSecret) {
    throw new HTTPError({
      statusCode: 500,
      message: 'Missing GitHub client ID or secret',
      data: config,
    })
  }

  const requestURL = getRequestURL(event)
  const redirectURL = `${requestURL.protocol}//${requestURL.host}${requestURL.pathname}`
  const state = await handleState(event)

  if (!query.code) {

    return redirect(
      event,
      withQuery('https://github.com/login/oauth/authorize' as string, {
        client_id: config.clientId,
        redirect_uri: redirectURL,
        state,
        // scope: 'repo'
      }),
    )
  }

  if (query.state !== state) {
    throw new HTTPError({
      statusCode: 500,
      message: 'Invalid state',
      data: {
        query,
        state,
      },
    })
  }

  const token = await requestAccessToken('https://github.com/login/oauth/access_token' as string, {
    body: {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectURL,
      code: query.code,
    },
  })

  if (token.error || !token.access_token) {
    throw new HTTPError({
      statusCode: 500,
      message: 'Failed to get access token',
      data: token,
    })
  }

  const accessToken = token.access_token

  const user: Endpoints['GET /user']['response']['data'] = await $fetch(`https://api.github.com/user`, {
    headers: {
      'User-Agent': `Github-OAuth-${config.clientId}`,
      'Authorization': `token ${accessToken}`,
    },
  })

  // Success
  const session = await useUserSession(event)

  await session.update(defu({
    user: {
      id: user.id.toString(),
      username: user.login,
      name: user.name || user.login,
      avatar: user.avatar_url,
    },
  }, session.data))

  return redirect(event, '/')
})

async function requestAccessToken(url: string, options: RequestAccessTokenOptions): Promise<RequestAccessTokenResponse> {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...options.headers,
  }

  // Encode the body as a URLSearchParams if the content type is 'application/x-www-form-urlencoded'.
  const body = headers['Content-Type'] === 'application/x-www-form-urlencoded'
    ? new URLSearchParams(options.body || options.params || {},
      ).toString()
    : options.body

  return $fetch<RequestAccessTokenResponse>(url, {
    method: 'POST',
    headers,
    body,
  }).catch((error) => {
    /**
     * For a better error handling, only unauthorized errors are intercepted, and other errors are re-thrown.
     */
    if (error instanceof FetchError && error.status === 401) {
      return error.data
    }
    throw error
  })
}

async function handleState(event: H3Event) {
  let state = getCookie(event, 'github-auth-state')
  if (state) {
    deleteCookie(event, 'github-auth-state')
    return state
  }

  state = encodeBase64Url(getRandomBytes(8))
  setCookie(event, 'github-auth-state', state)
  return state
}

function encodeBase64Url(input: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function getRandomBytes(size: number = 32) {
  return getRandomValues(new Uint8Array(size))
}
