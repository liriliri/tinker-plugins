import isStr from 'licia/isStr'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import compact from 'licia/compact'

export function normalizeTrimmedPath(path: string | null | undefined) {
  if (!isStr(path)) return null
  const trimmed = trim(path)
  return trimmed || null
}

export function parentPathFromPath(filePath: string) {
  const { dir } = splitPath(filePath)
  return dir || null
}

export function folderBaseName(folderPath: string) {
  const { name } = splitPath(folderPath)
  return name || folderPath
}

export function isPathUnder(childPath: string, parentPath: string) {
  const parent = rtrim(parentPath, '/\\')
  return (
    childPath === parent ||
    startWith(childPath, `${parent}/`) ||
    startWith(childPath, `${parent}\\`)
  )
}

export function joinNativePath(rootPath: string, relativePath: string) {
  const parts = compact(relativePath.split('/'))
  const root = rtrim(rootPath, '/\\')
  return parts.length ? `${root}/${parts.join('/')}` : root
}
