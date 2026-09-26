import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'

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

export function fileName(filePath: string): string {
  return splitPath(filePath).name
}

export function isMediaFile(filePath: string): boolean {
  const ext = lowerCase(splitPath(filePath).ext.replace(/^\./, ''))
  return contain(MEDIA_EXTENSIONS, ext)
}

export function resolveErrorLabel(
  t: (key: string) => string,
  error: string,
): string {
  return contain(I18N_ERROR_KEYS, error) ? t(error) : error
}
