import durationFormat from 'licia/durationFormat'
import lpad from 'licia/lpad'
import map from 'licia/map'
import trim from 'licia/trim'
import { shouldRefineChineseSubtitles } from '../../common/lang'
import type { TranscriptSegment } from '../../common/types'

const SUBTITLE_DISPLAY_PUNCTUATION_RE = /\p{P}/gu

export function stripSubtitleDisplayPunctuation(
  text: string,
  lang?: string,
  family?: string,
): string {
  if (!text || !shouldRefineChineseSubtitles(family, lang)) return text
  return trim(text.replace(SUBTITLE_DISPLAY_PUNCTUATION_RE, ''))
}

export function formatTimestamp(seconds: number): string {
  const ms = Math.max(0, seconds) * 1000
  const h = Math.floor(ms / 3_600_000)
  return durationFormat(ms, h > 0 ? 'hh:mm:ss' : 'mm:ss')
}

function formatSrtTime(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000))
  const h = Math.floor(totalMs / 3_600_000)
  const m = Math.floor((totalMs % 3_600_000) / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const ms = totalMs % 1000
  return `${lpad(String(h), 2, '0')}:${lpad(String(m), 2, '0')}:${lpad(String(s), 2, '0')},${lpad(String(ms), 3, '0')}`
}

export function formatSrt(segments: TranscriptSegment[]): string {
  return map(segments, (segment, index) => {
    const start = formatSrtTime(segment.start)
    const end = formatSrtTime(segment.end)
    const text = stripSubtitleDisplayPunctuation(
      segment.text,
      segment.lang,
      segment.family,
    )
    return `${index + 1}\n${start} --> ${end}\n${text}`
  }).join('\n\n')
}
