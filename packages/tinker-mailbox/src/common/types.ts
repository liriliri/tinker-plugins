export type MailSecurity = 'SSL / TLS' | 'STARTTLS' | 'none'

export type FolderRole =
  'inbox' | 'sent' | 'drafts' | 'trash' | 'junk' | 'archive' | 'all'

export interface AccountSettings {
  imapHost: string
  imapPort: number
  imapUsername: string
  imapPassword: string
  imapSecurity: MailSecurity
  imapAllowInsecureSsl?: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpSecurity: MailSecurity
  smtpAllowInsecureSsl?: boolean
}

export interface Account {
  id: string
  name: string
  emailAddress: string
  settings: AccountSettings
}

export interface FolderInfo {
  path: string
  name: string
  role?: FolderRole
  delimiter?: string
}

export interface FolderSyncCursor {
  uidValidity: string
  uidNext: number
  highestModseq?: string
  exists?: number
  oldestSeq?: number
}

export interface MailAddress {
  name?: string
  address: string
}

export interface MessageHeader {
  uid: number
  subject: string
  from: MailAddress[]
  to: MailAddress[]
  date: string | null
  flags: string[]
  unseen: boolean
  snippet?: string
}

export interface MessageDetail extends MessageHeader {
  cc: MailAddress[]
  bcc: MailAddress[]
  text: string
  html: string
}

export interface ComposePayload {
  to: string
  cc?: string
  bcc?: string
  subject: string
  text: string
  html?: string
}

export type FolderSyncKind = 'replace' | 'append' | 'noop'

export interface FolderSyncResult {
  kind: FolderSyncKind
  uidValidity: string
  uidNext: number
  highestModseq?: string
  exists?: number
  oldestSeq?: number
  messages: MessageHeader[]
}

export interface OlderMessagesResult {
  messages: MessageHeader[]
  oldestSeq: number
  exists: number
  hasMore: boolean
}

export type MailboxIdleChange =
  | {
      type: 'exists'
      path: string
      count: number
      prevCount: number
    }
  | {
      type: 'expunge'
      path: string
    }
