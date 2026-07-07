import concat from 'licia/concat'
import invert from 'licia/invert'
import type { Language } from '../types'

const commonLanguages: Language[] = [
  { code: 'auto' },
  { code: 'en' },
  { code: 'ja' },
  { code: 'ko' },
  { code: 'fr' },
  { code: 'es' },
  { code: 'ru' },
  { code: 'de' },
  { code: 'it' },
  { code: 'pt' },
  { code: 'ar' },
  { code: 'hi' },
  { code: 'th' },
  { code: 'vi' },
]

const baseLanguages = commonLanguages.slice(0, 2)
const restLanguages = commonLanguages.slice(2)

export const languages: Language[] = concat(baseLanguages, [
  { code: 'zh-CN' },
  { code: 'zh-TW' },
  ...restLanguages,
])

export const bingLanguages: Language[] = concat(baseLanguages, [
  { code: 'zh-Hans' },
  { code: 'zh-Hant' },
  ...restLanguages,
])

export const services = [
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
  { value: 'deepl', label: 'DeepL' },
] as const

export const aiService = { value: 'ai', label: 'AI' } as const

const toBingLangMap = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
}

const fromBingLangMap = invert(toBingLangMap)

export function toBingLang(lang: string) {
  return toBingLangMap[lang as keyof typeof toBingLangMap] ?? lang
}

export function fromBingLang(lang: string) {
  return fromBingLangMap[lang] ?? lang
}
