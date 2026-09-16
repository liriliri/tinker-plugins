import compact from 'licia/compact'
import contain from 'licia/contain'
import flatten from 'licia/flatten'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'

const chineseRe = /[\u4e00-\u9fa5]/

type PinyinFn = (str: string, options?: { style?: string }) => string[][]

let pinyinFn: PinyinFn | null = null

export async function loadPinyin() {
  if (pinyinFn) return
  const mod = await import('pinyin')
  pinyinFn = mod.pinyin as PinyinFn
}

function pinyinText(str: string, style: string): string {
  if (!pinyinFn || !chineseRe.test(str)) return ''
  return map(pinyinFn(str, { style }), (parts) => parts[0]).join('')
}

export function buildSearchText(...parts: string[]): string {
  const texts = compact(parts)
  const extras = flatten(
    map(texts, (part) => [
      pinyinText(part, 'normal'),
      pinyinText(part, 'first_letter'),
    ]),
  )
  return lowerCase(compact([...texts, ...extras]).join(' '))
}

export function matchSearchText(searchText: string, keyword: string): boolean {
  return contain(searchText, lowerCase(keyword))
}
