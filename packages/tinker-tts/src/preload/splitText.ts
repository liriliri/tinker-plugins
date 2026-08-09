import contain from 'licia/contain'
import escape from 'licia/escape'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'

/** Edge TTS SSML payload limit (same as tts-vue / edge-tts). */
const MAX_CHUNK_BYTES = 4096

const SENTENCE_END = new Set(['。', '！', '？', '；', '.', '!', '?', ';', '…'])

function removeIncompatibleCharacters(text: string): string {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (
      cp <= 0x08 ||
      cp === 0x0b ||
      cp === 0x0c ||
      (cp >= 0x0e && cp <= 0x1f)
    ) {
      out += ' '
    } else {
      out += ch
    }
  }
  return out
}

function preferredSplitLength(slice: string): number {
  const nl = slice.lastIndexOf('\n')
  if (nl >= 0) return nl + 1

  for (let i = slice.length - 1; i >= 0; i--) {
    if (SENTENCE_END.has(slice[i]!)) return i + 1
  }

  const sp = slice.lastIndexOf(' ')
  if (sp >= 0) return sp + 1

  return slice.length
}

function avoidBrokenEntity(
  escaped: string,
  start: number,
  end: number,
): number {
  const slice = escaped.slice(start, end)
  const amp = slice.lastIndexOf('&')
  if (amp < 0) return end
  if (!contain(slice.slice(amp), ';')) return start + amp
  return end
}

/** Split text into XML-escaped chunks within Edge TTS size limits. */
export function splitTextByByteLength(text: string): string[] {
  const escaped = escape(removeIncompatibleCharacters(text))
  const trimmed = trim(escaped)
  if (isEmpty(trimmed)) return []

  if (Buffer.byteLength(escaped, 'utf8') <= MAX_CHUNK_BYTES) return [trimmed]

  const chunks: string[] = []
  let start = 0

  while (start < escaped.length) {
    const remaining = Buffer.byteLength(escaped.slice(start), 'utf8')
    if (remaining <= MAX_CHUNK_BYTES) {
      const chunk = trim(escaped.slice(start))
      if (!isEmpty(chunk)) chunks.push(chunk)
      break
    }

    let end = start
    let size = 0
    while (end < escaped.length) {
      const cp = escaped.codePointAt(end)!
      const ch = String.fromCodePoint(cp)
      const next = size + Buffer.byteLength(ch, 'utf8')
      if (next > MAX_CHUNK_BYTES && end > start) break
      size = next
      end += ch.length
    }

    const slice = escaped.slice(start, end)
    let actualEnd = start + preferredSplitLength(slice)
    actualEnd = avoidBrokenEntity(escaped, start, actualEnd)
    if (actualEnd <= start) actualEnd = end

    const chunk = trim(escaped.slice(start, actualEnd))
    if (!isEmpty(chunk)) chunks.push(chunk)
    start = actualEnd
  }

  return chunks
}
