export interface Language {
  code: string
}

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

export const languages: Language[] = [
  commonLanguages[0],
  commonLanguages[1],
  { code: 'zh-CN' },
  { code: 'zh-TW' },
  ...commonLanguages.slice(2),
]

export const bingLanguages: Language[] = [
  commonLanguages[0],
  commonLanguages[1],
  { code: 'zh-Hans' },
  { code: 'zh-Hant' },
  ...commonLanguages.slice(2),
]

export const services = [
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
  { value: 'deepl', label: 'DeepL' },
] as const
