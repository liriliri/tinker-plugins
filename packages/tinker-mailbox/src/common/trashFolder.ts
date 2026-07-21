import find from 'licia/find'
import type { SpecialFolderLike } from './types'

function isTrashFolderName(nameOrPath: string) {
  const name = nameOrPath.toLowerCase()
  return (
    name === 'trash' ||
    name === 'deleted' ||
    name === 'deleted items' ||
    name === 'bin' ||
    name === '废纸篓' ||
    name === '已删除' ||
    name === '垃圾箱' ||
    name.includes('trash') ||
    name.includes('deleted')
  )
}

export function isTrashFolder(folder: SpecialFolderLike) {
  return (
    folder.role === 'trash' ||
    folder.specialUse === '\\Trash' ||
    isTrashFolderName(folder.name || folder.path)
  )
}

export function pickTrashFolderPath(
  folders: SpecialFolderLike[],
): string | null {
  const byRole = find(
    folders,
    (f) => f.role === 'trash' || f.specialUse === '\\Trash',
  )
  if (byRole) return byRole.path
  const byName = find(folders, (f) => isTrashFolderName(f.name || f.path))
  return byName?.path ?? null
}
