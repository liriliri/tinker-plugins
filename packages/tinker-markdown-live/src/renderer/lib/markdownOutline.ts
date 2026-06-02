import trim from 'licia/trim'

export type MarkdownOutlineItem = {
  level: number
  title: string
}

export function getMarkdownOutline(text: string): MarkdownOutlineItem[] {
  const outline: MarkdownOutlineItem[] = []
  let fenced = false

  text.split(/\r?\n/).forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      return
    }

    if (fenced) return

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) return

    outline.push({
      level: match[1].length,
      title: trim(match[2]),
    })
  })

  return outline
}
