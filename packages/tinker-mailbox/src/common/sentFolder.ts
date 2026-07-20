import find from 'licia/find'

/** Shared shape for matching a Sent folder by role or common display names. */
export interface SentFolderLike {
  path: string
  name?: string
  role?: string
  specialUse?: string | false
}

export function isSentFolderName(nameOrPath: string) {
  const name = nameOrPath.toLowerCase()
  return (
    name === 'sent' ||
    name === 'sent messages' ||
    name === 'sent items' ||
    name === '已发送' ||
    name.includes('sent')
  )
}

export function pickSentFolderPath(folders: SentFolderLike[]): string | null {
  const byRole = find(
    folders,
    (f) => f.role === 'sent' || f.specialUse === '\\Sent',
  )
  if (byRole) return byRole.path
  const byName = find(folders, (f) => isSentFolderName(f.name || f.path))
  return byName?.path ?? null
}
