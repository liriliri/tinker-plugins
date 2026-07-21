import find from 'licia/find'
import type { SpecialFolderLike } from './types'

function isSentFolderName(nameOrPath: string) {
  const name = nameOrPath.toLowerCase()
  return (
    name === 'sent' ||
    name === 'sent messages' ||
    name === 'sent items' ||
    name === '已发送' ||
    name.includes('sent')
  )
}

export function pickSentFolderPath(
  folders: SpecialFolderLike[],
): string | null {
  const byRole = find(
    folders,
    (f) => f.role === 'sent' || f.specialUse === '\\Sent',
  )
  if (byRole) return byRole.path
  const byName = find(folders, (f) => isSentFolderName(f.name || f.path))
  return byName?.path ?? null
}
