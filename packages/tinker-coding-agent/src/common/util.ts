import filter from 'licia/filter'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import map from 'licia/map'
import toStr from 'licia/toStr'

type TextPart = { type: 'text'; text: string }

export function contentToText(
  content: string | ReadonlyArray<{ type: string; text?: string }>,
): string {
  if (isStr(content)) return content
  return map(
    filter(content, (c): c is TextPart => c.type === 'text' && !!c.text),
    (c) => c.text,
  ).join('\n')
}

export function errorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}
