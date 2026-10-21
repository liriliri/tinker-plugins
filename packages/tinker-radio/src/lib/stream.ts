import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

const PLAYLIST = /\.(m3u8?|pls)(?:$|\?)/i

function looksLikePlaylist(url: string) {
  return PLAYLIST.test(url)
}

async function firstInPlaylist(playlistUrl: string): Promise<string> {
  const res = await fetch(playlistUrl)
  if (!res.ok) throw new Error('playlist')
  const text = await res.text()
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const value = trim(line)
    if (startWith(value, 'http')) return value
    if (!startWith(lowerCase(value), 'file')) continue
    const idx = value.indexOf('=')
    if (idx < 0) continue
    const url = trim(value.slice(idx + 1))
    if (startWith(url, 'http')) return url
  }
  throw new Error('playlist')
}

export async function resolvePlayable(candidates: string[]): Promise<string> {
  for (const url of candidates) {
    if (!url) continue
    if (!looksLikePlaylist(url)) return url
    try {
      const nested = await firstInPlaylist(url)
      if (nested && !looksLikePlaylist(nested)) return nested
    } catch {
      // Playlist hosts often omit CORS; try the next candidate.
    }
  }
  return find(candidates, (url) => !!url) || ''
}
