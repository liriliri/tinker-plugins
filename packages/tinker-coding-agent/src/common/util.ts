import filter from 'licia/filter'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import pluck from 'licia/pluck'
import toStr from 'licia/toStr'

type TextPart = { type: 'text'; text: string }

export function contentToText(
  content: string | ReadonlyArray<{ type: string; text?: string }>,
): string {
  if (isStr(content)) return content
  return pluck(
    filter(content, (c): c is TextPart => c.type === 'text' && !!c.text),
    'text',
  ).join('\n')
}

export function errorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}

/** Compact token count for footer display (e.g. 1.2k, 128k). */
export function formatTokens(count: number): string {
  if (count < 1000) return String(count)
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  if (count < 1000000) return `${Math.round(count / 1000)}k`
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`
  return `${Math.round(count / 1000000)}M`
}
