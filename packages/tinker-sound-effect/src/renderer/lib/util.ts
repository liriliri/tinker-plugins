import contain from 'licia/contain'

const I18N_ERROR_KEYS = [
  'emptyText',
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
