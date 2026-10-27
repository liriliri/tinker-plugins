import contain from 'licia/contain'
import isEmpty from 'licia/isEmpty'
import ltrim from 'licia/ltrim'
import normalizePath from 'licia/normalizePath'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

export function joinPath(parent: string | null, name: string): string {
  const trimmed = trim(name)
  if (!parent) {
    return trimmed
  }
  return `${parent}/${trimmed}`
}

export function validateEntryName(name: string): string | null {
  const trimmed = trim(name)
  if (isEmpty(trimmed)) {
    return 'empty'
  }
  if (contain(trimmed, '/') || contain(trimmed, '\\')) {
    return 'invalidChars'
  }
  if (trimmed === '.' || trimmed === '..') {
    return 'invalid'
  }
  return null
}

export function normalizePackagePath(path: string): string {
  let normalized = normalizePath(path)
  while (startWith(normalized, './')) {
    normalized = normalized.slice(2)
  }
  return ltrim(normalized, '/')
}
