import each from 'licia/each'
import find from 'licia/find'
import type {
  AccountSettings,
  FolderInfo,
  MessageHeader,
} from '../../common/types'
import { sortMessagesByDateDesc } from '../../common/messages'
import { pickSentFolderPath } from '../../common/sentFolder'
import { isTrashFolder } from '../../common/trashFolder'

export function emptySettings(): AccountSettings {
  return {
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
    imapSecurity: 'SSL / TLS',
    smtpHost: '',
    smtpPort: 465,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecurity: 'SSL / TLS',
  }
}

export function pickDefaultFolder(folders: FolderInfo[]): string | null {
  const inbox =
    find(folders, (f) => f.role === 'inbox') ||
    find(folders, (f) => f.path.toUpperCase() === 'INBOX') ||
    folders[0]
  return inbox?.path ?? null
}

export function pickSentFolder(folders: FolderInfo[]): string | null {
  return pickSentFolderPath(folders)
}

export function isTrashFolderPath(
  folders: FolderInfo[],
  folderPath: string,
): boolean {
  const folder = find(folders, (f) => f.path === folderPath)
  if (folder) return isTrashFolder(folder)
  return isTrashFolder({ path: folderPath })
}

export function folderLabel(
  folder: FolderInfo,
  t: (key: string) => string,
): string {
  return folder.role ? t(folder.role) : folder.name
}

export function mergeByUid(
  existing: MessageHeader[],
  incoming: MessageHeader[],
): MessageHeader[] {
  const byUid = new Map<number, MessageHeader>()
  each(existing, (msg) => byUid.set(msg.uid, msg))
  each(incoming, (msg) => byUid.set(msg.uid, msg))
  return sortMessagesByDateDesc([...byUid.values()])
}

export function sameMailboxPath(a: string, b: string): boolean {
  if (a === b) return true
  const au = a.toUpperCase()
  const bu = b.toUpperCase()
  if (au === 'INBOX' && bu === 'INBOX') return true
  return au === bu
}
