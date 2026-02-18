export interface Language {
  code: string
  name_cn: string
}

const commonLanguages: Language[] = [
  { code: 'auto', name_cn: '自动检测' },
  { code: 'en', name_cn: '英语' },
  { code: 'ja', name_cn: '日语' },
  { code: 'ko', name_cn: '韩语' },
  { code: 'fr', name_cn: '法语' },
  { code: 'es', name_cn: '西班牙语' },
  { code: 'ru', name_cn: '俄语' },
  { code: 'de', name_cn: '德语' },
  { code: 'it', name_cn: '意大利语' },
  { code: 'pt', name_cn: '葡萄牙语' },
  { code: 'ar', name_cn: '阿拉伯语' },
  { code: 'hi', name_cn: '印地语' },
  { code: 'th', name_cn: '泰语' },
  { code: 'vi', name_cn: '越南语' },
]

export const languages: Language[] = [
  commonLanguages[0],
  commonLanguages[1],
  { code: 'zh-CN', name_cn: '简体中文' },
  { code: 'zh-TW', name_cn: '繁体中文' },
  ...commonLanguages.slice(2),
]

export const bingLanguages: Language[] = [
  commonLanguages[0],
  commonLanguages[1],
  { code: 'zh-Hans', name_cn: '简体中文' },
  { code: 'zh-Hant', name_cn: '繁体中文' },
  ...commonLanguages.slice(2),
]

export const services = [
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
] as const

export type Service = 'google' | 'bing'
