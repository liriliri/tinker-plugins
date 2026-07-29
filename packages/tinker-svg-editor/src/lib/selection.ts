import compact from 'licia/compact'
import lowerCase from 'licia/lowerCase'
import type { PanelKind, SelectionInfo } from '../types'

const EMPTY: SelectionInfo = {
  elements: [],
  panel: 'canvas',
  attrs: {},
  fontSize: '24',
  isBold: false,
  isItalic: false,
}

function panelFor(tag: string, count: number): PanelKind {
  if (count > 1) return 'element'
  if (!tag) return 'canvas'
  if (tag === 'rect') return 'rect'
  if (tag === 'text') return 'text'
  if (tag === 'g') return 'g'
  return 'element'
}

export function buildSelectionInfo(elements: Element[]): SelectionInfo {
  const elems = compact(elements)
  if (!elems.length) return { ...EMPTY }

  const el = elems[0]
  const tagName = lowerCase(el.tagName)
  const attrs: Record<string, string> = {}
  if (tagName === 'rect') {
    const rx = el.getAttribute('rx')
    if (rx != null) attrs.rx = rx
  }

  return {
    elements: elems,
    panel: panelFor(tagName, elems.length),
    attrs,
    fontSize: el.getAttribute('font-size') || '24',
    isBold: (el.getAttribute('font-weight') || '') === 'bold',
    isItalic: (el.getAttribute('font-style') || '') === 'italic',
  }
}
