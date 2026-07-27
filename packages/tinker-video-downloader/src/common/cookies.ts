import trim from 'licia/trim'
import startWith from 'licia/startWith'
import map from 'licia/map'
import filter from 'licia/filter'
import type { CookieEntry } from './types'

/** Netscape cookies.txt → entries (domain / name / value). */
export function parseCookiesTxt(content: string): Omit<CookieEntry, 'id'>[] {
  return filter(
    map(content.split(/\r?\n/), (raw) => {
      let line = trim(raw)
      if (!line) return null

      if (startWith(line, '#HttpOnly_')) {
        line = line.slice('#HttpOnly_'.length)
      } else if (startWith(line, '#')) {
        return null
      }

      const parts = line.split('\t')
      if (parts.length < 7) return null

      const domain = trim(parts[0] || '')
      const name = trim(parts[5] || '')
      const value = parts[6] ?? ''
      if (!domain || !name) return null

      return { domain, name, value }
    }),
    Boolean,
  ) as Omit<CookieEntry, 'id'>[]
}

/** Serialize entries to Netscape cookies.txt for yt-dlp `--cookies`. */
export function serializeCookiesTxt(cookies: CookieEntry[]): string {
  const lines = [
    '# Netscape HTTP Cookie File',
    '# https://curl.se/rfc/cookie_spec.html',
    '# This is a generated file! Do not edit.',
    '',
    ...map(
      filter(cookies, (c) => !!trim(c.domain) && !!trim(c.name)),
      (c) => {
        const domain = trim(c.domain)
        const name = trim(c.name)
        const includeSubdomains = startWith(domain, '.') ? 'TRUE' : 'FALSE'
        return [
          domain,
          includeSubdomains,
          '/',
          'FALSE',
          '0',
          name,
          c.value,
        ].join('\t')
      },
    ),
  ]

  return lines.join('\n') + '\n'
}
