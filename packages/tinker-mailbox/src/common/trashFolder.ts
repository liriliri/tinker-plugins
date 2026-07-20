import find from 'licia/find'

/** Shared shape for matching a Trash folder by role or common display names. */
export interface TrashFolderLike {
  path: string
  name?: string
  role?: string
  specialUse?: string | false
}

export function isTrashFolderName(nameOrPath: string) {
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

export function isTrashFolder(folder: TrashFolderLike) {
  return (
    folder.role === 'trash' ||
    folder.specialUse === '\\Trash' ||
    isTrashFolderName(folder.name || folder.path)
  )
}

export function pickTrashFolderPath(folders: TrashFolderLike[]): string | null {
  const byRole = find(
    folders,
    (f) => f.role === 'trash' || f.specialUse === '\\Trash',
  )
  if (byRole) return byRole.path
  const byName = find(folders, (f) => isTrashFolderName(f.name || f.path))
  return byName?.path ?? null
}
