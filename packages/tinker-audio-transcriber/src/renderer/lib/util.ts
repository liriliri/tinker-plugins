import contain from 'licia/contain'
import isErr from 'licia/isErr'
import splitPath from 'licia/splitPath'
import toStr from 'licia/toStr'

export const MEDIA_EXTENSIONS = [
  'wav',
  'mp3',
  'm4a',
  'flac',
  'ogg',
  'aac',
  'wma',
  'mp4',
  'mkv',
  'mov',
  'webm',
  'avi',
]

const I18N_ERROR_KEYS = [
  'modelsRequired',
  'dropPathFailed',
  'dropUnsupported',
] as const

export function errorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}

export function fileName(filePath: string): string {
  return splitPath(filePath).name
}

export function isMediaFile(filePath: string): boolean {
  const ext = splitPath(filePath).ext.replace(/^\./, '').toLowerCase()
  return contain(MEDIA_EXTENSIONS, ext)
}

export function resolveErrorLabel(
  t: (key: string) => string,
  error: string,
): string {
  return contain(I18N_ERROR_KEYS, error) ? t(error) : error
}
