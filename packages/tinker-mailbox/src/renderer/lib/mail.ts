import each from 'licia/each'
import find from 'licia/find'
import type {
  AccountSettings,
  FolderInfo,
  MessageHeader,
} from '../../common/types'
import { sortMessagesByDateDesc } from '../../common/messages'

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

export function mergeByUid(
  existing: MessageHeader[],
  incoming: MessageHeader[],
): MessageHeader[] {
  const byUid = new Map<number, MessageHeader>()
  each(existing, (msg) => byUid.set(msg.uid, msg))
  each(incoming, (msg) => byUid.set(msg.uid, msg))
  return sortMessagesByDateDesc([...byUid.values()])
}
