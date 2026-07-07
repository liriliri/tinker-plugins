import { contextBridge } from 'electron'
import type { Service } from '../common/types'
import type { TranslateResult } from './types'
import { translateWithGoogle } from './google'
import { translateWithBing } from './bing'
import { translateWithDeepL } from './deepl'
import { translateWithAI } from './ai'

const translateObj = {
  translate: async (
    text: string,
    from: string,
    to: string,
    service: Service = 'google',
  ): Promise<TranslateResult> => {
    if (service === 'bing') {
      return await translateWithBing(text, from, to)
    }
    if (service === 'deepl') {
      return await translateWithDeepL(text, from, to)
    }
    if (service === 'ai') {
      return await translateWithAI(text, from, to)
    }
    return await translateWithGoogle(text, from, to)
  },
}

contextBridge.exposeInMainWorld('translate', translateObj)

declare global {
  const translate: typeof translateObj
}
