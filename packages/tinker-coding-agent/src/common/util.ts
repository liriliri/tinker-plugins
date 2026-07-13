type TextPart = { type: 'text'; text: string }

export function contentToText(
  content: string | ReadonlyArray<{ type: string; text?: string }>,
): string {
  if (typeof content === 'string') return content
  return content
    .filter((c): c is TextPart => c.type === 'text' && !!c.text)
    .map((c) => c.text)
    .join('\n')
}
