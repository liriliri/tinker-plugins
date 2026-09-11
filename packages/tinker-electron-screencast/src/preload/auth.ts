import trim from 'licia/trim'
import isArr from 'licia/isArr'
import startWith from 'licia/startWith'
import Url from 'licia/Url'
import crypto from 'crypto'

export interface HttpAuth {
  username: string
  password: string
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function parseBasicAuthorization(
  header: string | string[] | undefined,
): HttpAuth | null {
  const value = isArr(header) ? header[0] : header
  if (!value || !startWith(value, 'Basic ')) {
    return null
  }
  try {
    const decoded = Buffer.from(value.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx < 0) {
      return { username: decoded, password: '' }
    }
    return {
      username: decoded.slice(0, idx),
      password: decoded.slice(idx + 1),
    }
  } catch {
    return null
  }
}

function checkBasicAuth(header: string | string[] | undefined, auth: HttpAuth) {
  const parsed = parseBasicAuthorization(header)
  if (!parsed) {
    return false
  }
  return (
    safeEqual(parsed.username, auth.username) &&
    safeEqual(parsed.password, auth.password)
  )
}

export function checkRequestAuth(
  req: { url?: string; headers: { authorization?: string | string[] } },
  auth: HttpAuth,
) {
  if (checkBasicAuth(req.headers.authorization, auth)) {
    return true
  }
  try {
    const value = Url.parse(req.url || '/').query?.authorization
    if (!value) {
      return false
    }
    const header = startWith(value, 'Basic ') ? value : `Basic ${value}`
    return checkBasicAuth(header, auth)
  } catch {
    return false
  }
}

export function resolveAuth(
  username: string,
  password: string,
): HttpAuth | undefined {
  if (!trim(username)) return undefined
  return { username, password }
}
