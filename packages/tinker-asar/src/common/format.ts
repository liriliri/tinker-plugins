import fileSize from 'licia/fileSize'
import splitPath from 'licia/splitPath'

export function getBasename(path: string): string {
  return splitPath(path).name || path
}

export function formatSize(size: number): string {
  return fileSize(size)
}
