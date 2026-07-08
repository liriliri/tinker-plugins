import { pinyin } from 'pinyin'
import Nzh from 'nzh'
import stcasc from 'switch-chinese'
import trim from 'licia/trim'
import map from 'licia/map'
import type { IPinyinOptions } from 'pinyin/lib/types/declare'
import type { PinyinStyle, ChineseMode } from '../types'

type PinyinStyleValue = NonNullable<IPinyinOptions['style']>

const styleMap: Record<PinyinStyle, PinyinStyleValue> = {
  tone: 'tone',
  toneNum: 'tone2',
  normal: 'normal',
}

const converter = stcasc()

export function toPinyin(input: string, style: PinyinStyle): string {
  if (!trim(input)) return ''

  const result = pinyin(input, { style: styleMap[style] })
  return map(result, (item: string[]) => item[0]).join(' ')
}

export function toRmb(input: string): string {
  const trimmed = trim(input)
  if (!trimmed) return ''

  const num = parseFloat(trimmed)
  if (isNaN(num)) return ''

  return Nzh.cn.toMoney(trimmed)
}

export function convertChinese(input: string, mode: ChineseMode): string {
  if (!trim(input)) return ''

  if (mode === 'toTraditional') {
    return converter.traditionalized(input)
  }

  return converter.simplized(input)
}
