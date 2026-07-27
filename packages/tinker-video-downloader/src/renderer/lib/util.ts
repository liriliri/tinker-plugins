import trim from 'licia/trim'
import rtrim from 'licia/rtrim'
import durationFormat from 'licia/durationFormat'
import fileSize from 'licia/fileSize'
import { isYouTubeUrl, isBilibiliUrl } from '../../common/url'

export { isYouTubeUrl }

export function extractUrl(text: string): string {
  const clean = trim(text)
  const match = clean.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i)
  return match ? rtrim(match[0], [')', ',', '.', ';']) : clean
}

export function needsCookiesHint(url: string): boolean {
  return isYouTubeUrl(url) || isBilibiliUrl(url)
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const ms = seconds * 1000
  return seconds >= 3600
    ? durationFormat(ms, 'h:mm:ss')
    : durationFormat(ms, 'm:ss')
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  return fileSize(bytes)
}
