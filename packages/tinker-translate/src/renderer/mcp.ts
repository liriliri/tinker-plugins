import contain from 'licia/contain'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Service } from '../common/types'
import { fromBingLang, toBingLang } from './lib/languages'
import type { Store } from './store'

const SERVICES: Service[] = ['google', 'bing', 'deepl', 'ai']

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    translate,
  })
}

async function translate(
  store: Store,
  args: {
    text: string
    source_lang?: string
    target_lang?: string
    service?: Service
  },
) {
  const text = trim(args.text)
  if (isStrBlank(text)) {
    throw new Error('text is required')
  }

  if (args.service != null) {
    if (args.service === 'ai') {
      await store.init()
    }
    store.handleServiceChange(resolveService(args.service, store.hasAI))
  }

  const service = store.service
  if (args.source_lang != null) {
    store.setSourceLang(normalizeLang(trim(args.source_lang), service))
  }
  if (args.target_lang != null) {
    const target = normalizeLang(trim(args.target_lang), service)
    if (target === 'auto') {
      throw new Error('target_lang cannot be auto')
    }
    store.setTargetLang(target)
  }

  store.toastMsg = ''
  store.toastOpen = false
  store.setSourceText(text)
  await store.handleTranslate()

  if (!store.translatedText) {
    throw new Error(store.toastMsg || 'Translation failed')
  }

  return {
    text: store.sourceText,
    translated: store.translatedText,
    sourceLang: store.sourceLang,
    targetLang: store.targetLang,
    service: store.service,
  }
}

function resolveService(service: Service, hasAI: boolean): Service {
  if (!contain(SERVICES, service)) {
    throw new Error(
      `Unknown service: ${service}. Use google, bing, deepl, or ai.`,
    )
  }
  if (service === 'ai' && !hasAI) {
    throw new Error(
      'AI service is not available. Configure an AI provider in Tinker.',
    )
  }
  return service
}

function normalizeLang(lang: string, service: Service) {
  if (isStrBlank(lang)) {
    throw new Error('Language code must not be empty')
  }
  return service === 'bing' ? toBingLang(lang) : fromBingLang(lang)
}
