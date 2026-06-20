import type { MBTIType } from '../types'
import portraitsEn from './portraits.en-US.json'
import portraitsZh from './portraits.zh-CN.json'

export interface TypePortrait {
  type: MBTIType
  nickname: string
  description: string
  strengths: string[]
  weaknesses: string[]
  career: string
}

type LocalePortraits = Record<string, Record<MBTIType, TypePortrait>>

const localePortraits: LocalePortraits = {
  'en-US': portraitsEn as Record<MBTIType, TypePortrait>,
  'zh-CN': portraitsZh as Record<MBTIType, TypePortrait>,
} as const

export function getPortraits(locale: string): Record<MBTIType, TypePortrait> {
  return localePortraits[locale] || portraitsEn
}
