import contain from 'licia/contain'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import safeGet from 'licia/safeGet'
import { storage } from 'tinker-share/store/Base'

const I18N_ERROR_KEYS = [
  'emptyText',
  'emptyLyrics',
  'noAudioData',
  'runtimeMissing',
  'modelsRequired',
  'modelUnsupported',
  'modelMissing',
  'generateFailed',
  'engineStartTimeout',
  'textTooLong',
  'cancelled',
  'portUnavailable',
  'translateMissing',
  'translateFailed',
] as const

export function resolveErrorLabel(
  t: (key: string) => string,
  error: string,
): string {
  const key = error.split(':')[0]
  return contain(I18N_ERROR_KEYS, key) ? t(key) : error
}

export function storedStr(key: string, fallback = '') {
  const value = storage.get(key)
  return isStr(value) ? value : fallback
}

export function parseTranslated(raw: string) {
  const translated = safeGet(JSON.parse(raw), 'translated')
  if (!isStr(translated) || isStrBlank(translated)) {
    throw new Error('translateFailed')
  }
  return translated
}

export function clipTitle(item: { lyrics: string; text: string }) {
  return item.lyrics || item.text
}
