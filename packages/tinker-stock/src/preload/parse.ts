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
  let body = trim(line)
  if (startWith(body, '|')) body = body.slice(1)
  if (endWith(body, '|')) body = body.slice(0, -1)
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

function readTableRow(
  lines: string[],
  start: number,
): { cells: string[]; next: number } | null {
  if (start >= lines.length || !isTableRow(lines[start])) return null

  let raw = trim(lines[start])
  let i = start + 1
  while (!endWith(raw, '|') && i < lines.length) {
    raw += `\n${lines[i]}`
    i += 1
  }

  return { cells: splitCells(raw), next: i }
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
      if (startWith(trimmed, '**') || startWith(trimmed, '#')) {
        title = parseTitle(trimmed)
      }
      i += 1
      continue
    }

    const headerRow = readTableRow(lines, i)
    if (!headerRow) {
      i += 1
      continue
    }
    const header = headerRow.cells
    i = headerRow.next
    if (i < lines.length && isSeparator(lines[i])) {
      i += 1
    }

    const rows: Record<string, string>[] = []
    while (i < lines.length && isTableRow(lines[i]) && !isSeparator(lines[i])) {
      const dataRow = readTableRow(lines, i)
      if (!dataRow) break
      const row: Record<string, string> = {}
      for (let c = 0; c < header.length; c += 1) {
        row[header[c]] = dataRow.cells[c] ?? ''
      }
      rows.push(row)
      i = dataRow.next
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
