import contain from 'licia/contain'
import endWith from 'licia/endWith'
import isErr from 'licia/isErr'
import isFinite from 'licia/isFinite'
import lpad from 'licia/lpad'
import startWith from 'licia/startWith'
import toStr from 'licia/toStr'

const I18N_ERROR_KEYS = ['emptyText', 'voiceRequired'] as const

export function errorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}

export function resolveErrorLabel(
  t: (key: string) => string,
  error: string,
): string {
  return contain(I18N_ERROR_KEYS, error) ? t(error) : error
}

/** zh-CN-liaoning → zh-CN */
export function localeGroup(locale: string): string {
  if (locale === 'zh-CN' || startWith(locale, 'zh-CN-')) return 'zh-CN'
  return locale
}

/** zh-CN-XiaoxiaoNeural / zh-CN-liaoning-XiaobeiNeural → Xiaoxiao / Xiaobei */
export function shortVoiceName(shortName: string): string {
  const m = shortName.match(/^(?:[a-z]{2,3}-[A-Za-z]+)(?:-[a-z]+)?-(.+)$/i)
  if (!m?.[1]) return shortName
  return endWith(m[1], 'Neural') ? m[1].slice(0, -'Neural'.length) : m[1]
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${lpad(toStr(s), 2, '0')}`
}
