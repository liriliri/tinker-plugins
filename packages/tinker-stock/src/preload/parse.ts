import contain from 'licia/contain'
import endWith from 'licia/endWith'
import every from 'licia/every'
import filter from 'licia/filter'
import isFinite from 'licia/isFinite'
import isStr from 'licia/isStr'
import map from 'licia/map'
import startWith from 'licia/startWith'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import type { TableSection } from '../common/types'

function splitCells(line: string): string[] {
  const raw = trim(line)
  const body = startWith(raw, '|') && endWith(raw, '|') ? raw.slice(1, -1) : raw
  return map(body.split('|'), (cell) => trim(cell))
}

function isSeparator(line: string): boolean {
  const cells = splitCells(line)
  if (cells.length === 0) return false
  return every(cells, (cell) => /^:?-+:?$/.test(cell))
}

function isTableRow(line: string): boolean {
  const t = trim(line)
  return startWith(t, '|') && contain(t.slice(1), '|')
}

function parseTitle(line: string): string {
  const t = trim(line)
  const bold = t.match(/^\*\*(.+)\*\*$/)
  if (bold) return bold[1]
  const heading = t.match(/^#{1,6}\s+(.+)$/)
  if (heading) return heading[1]
  if (startWith(t, '#### ')) return trim(t.slice(5))
  return t
}

export function parseSections(text: string): TableSection[] {
  const lines = text.split(/\r?\n/)
  const sections: TableSection[] = []
  let title = ''
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = trim(line)

    if (!trimmed || startWith(trimmed, '[Batch]')) {
      i += 1
      continue
    }

    if (!isTableRow(trimmed)) {
      if (
        startWith(trimmed, '**') ||
        startWith(trimmed, '#') ||
        startWith(trimmed, '####')
      ) {
        title = parseTitle(trimmed)
      }
      i += 1
      continue
    }

    const header = splitCells(trimmed)
    i += 1
    if (i < lines.length && isSeparator(lines[i])) {
      i += 1
    }

    const rows: Record<string, string>[] = []
    while (i < lines.length && isTableRow(lines[i]) && !isSeparator(lines[i])) {
      const cells = splitCells(lines[i])
      const row: Record<string, string> = {}
      for (let c = 0; c < header.length; c += 1) {
        row[header[c]] = cells[c] ?? ''
      }
      rows.push(row)
      i += 1
    }

    sections.push({
      title: title || 'data',
      columns: header,
      rows,
    })
    title = ''
  }

  return filter(sections, (section) => section.columns.length > 0)
}

export function firstTable(text: string): TableSection | null {
  const sections = parseSections(text)
  return sections[0] ?? null
}

export function toNumber(value: string | undefined): number {
  if (!isStr(value) || !value || contain(['-', '--'], value)) return NaN
  const n = toNum(value.replace(/,/g, ''))
  return isFinite(n) ? n : NaN
}
