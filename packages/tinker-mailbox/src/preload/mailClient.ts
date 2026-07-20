import { ImapFlow } from 'imapflow'
import { simpleParser, type AddressObject } from 'mailparser'
import nodemailer from 'nodemailer'
import contain from 'licia/contain'
import filter from 'licia/filter'
import flatten from 'licia/flatten'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import map from 'licia/map'
import stripHtmlTag from 'licia/stripHtmlTag'
import toArr from 'licia/toArr'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import { sortMessagesByDateDesc } from '../common/messages'
import type {
  Account,
  AccountSettings,
  ComposePayload,
  FolderInfo,
  FolderRole,
  FolderSyncCursor,
  FolderSyncResult,
  MailAddress,
  MessageDetail,
  MessageHeader,
} from '../common/types'

let client: ImapFlow | null = null
let activeAccount: Account | null = null

const SNIPPET_MAX = 140
const TEXT_PEEK_BYTES = 800

function toErrorMessage(err: unknown): string {
  if (isErr(err)) {
    const detail = (err as Error & { responseText?: string }).responseText
    return detail ? `${err.message}: ${detail}` : err.message
  }
  return String(err)
}

function imapOptions(settings: AccountSettings) {
  const secure = settings.imapSecurity === 'SSL / TLS'
  return {
    host: settings.imapHost,
    port: settings.imapPort,
    secure,
    doSTARTTLS:
      settings.imapSecurity === 'STARTTLS'
        ? true
        : settings.imapSecurity === 'none'
          ? false
          : undefined,
    tls: {
      rejectUnauthorized: !settings.imapAllowInsecureSsl,
    },
    auth: {
      user: settings.imapUsername,
      pass: settings.imapPassword,
    },
    logger: false as const,
  }
}

function smtpTransport(settings: AccountSettings) {
  const secure = settings.smtpSecurity === 'SSL / TLS'
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure,
    requireTLS: settings.smtpSecurity === 'STARTTLS',
    tls: {
      rejectUnauthorized: !settings.smtpAllowInsecureSsl,
    },
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  })
}

function mapRole(specialUse?: string | false): FolderRole | undefined {
  if (!specialUse) return undefined
  const map: Record<string, FolderRole> = {
    '\\Inbox': 'inbox',
    '\\Sent': 'sent',
    '\\Drafts': 'drafts',
    '\\Trash': 'trash',
    '\\Junk': 'junk',
    '\\Archive': 'archive',
    '\\All': 'all',
  }
  return map[specialUse]
}

function mapAddresses(
  list: { name?: string; address?: string }[] | undefined,
): MailAddress[] {
  if (!list) return []
  return map(
    filter(list, (a) => !!a.address),
    (a) => ({
      name: a.name || undefined,
      address: a.address as string,
    }),
  )
}

function fromAddressObject(
  value: AddressObject | AddressObject[] | undefined,
): MailAddress[] {
  if (!value) return []
  return mapAddresses(flatten(map(toArr(value), (item) => item.value)))
}

function flagsToArray(flags: Set<string> | string[] | undefined): string[] {
  if (!flags) return []
  return isArr(flags) ? flags : [...flags]
}

function makeSnippet(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const text = trim(stripHtmlTag(raw).replace(/\s+/g, ' '))
  if (!text) return undefined
  return truncate(text, SNIPPET_MAX, { ellipsis: '…', separator: ' ' })
}

function mailboxCursor(c: ImapFlow): FolderSyncCursor {
  const box = c.mailbox
  if (!box || !('uidValidity' in box)) {
    return { uidValidity: '0', uidNext: 1 }
  }
  return {
    uidValidity: String(box.uidValidity),
    uidNext: box.uidNext,
    highestModseq: box.highestModseq ? String(box.highestModseq) : undefined,
  }
}

function headerFromFetched(msg: {
  uid: number
  flags?: Set<string> | string[]
  envelope?: {
    subject?: string
    from?: { name?: string; address?: string }[]
    to?: { name?: string; address?: string }[]
    date?: Date
  }
  bodyParts?: Map<string, Buffer>
}): MessageHeader {
  const flags = flagsToArray(msg.flags)
  const textPart = msg.bodyParts?.get('TEXT')
  return {
    uid: msg.uid,
    subject: msg.envelope?.subject || '',
    from: mapAddresses(msg.envelope?.from),
    to: mapAddresses(msg.envelope?.to),
    date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null,
    flags,
    unseen: !contain(flags, '\\Seen'),
    snippet: makeSnippet(textPart?.toString('utf8')),
  }
}

async function fetchHeadersByRange(
  c: ImapFlow,
  range: string,
  uid = false,
): Promise<MessageHeader[]> {
  const options = uid ? { uid: true } : undefined
  const collect = async (withSnippet: boolean) => {
    const messages: MessageHeader[] = []
    for await (const msg of c.fetch(
      range,
      {
        envelope: true,
        flags: true,
        uid: true,
        ...(withSnippet
          ? {
              bodyParts: [
                { key: 'TEXT', start: 0, maxLength: TEXT_PEEK_BYTES },
              ],
            }
          : {}),
      },
      options,
    )) {
      messages.push(headerFromFetched(msg))
    }
    return sortMessagesByDateDesc(messages)
  }

  try {
    return await collect(true)
  } catch {
    return await collect(false)
  }
}

async function fetchRecentHeaders(
  c: ImapFlow,
  limit: number,
): Promise<MessageHeader[]> {
  const exists = c.mailbox && 'exists' in c.mailbox ? c.mailbox.exists : 0
  if (!exists) return []
  const take = Math.min(limit, exists)
  const start = Math.max(1, exists - take + 1)
  return fetchHeadersByRange(c, `${start}:${exists}`, false)
}

async function ensureClient(): Promise<ImapFlow> {
  if (!client || !activeAccount) {
    throw new Error('Not connected')
  }
  return client
}

export async function disconnect(): Promise<void> {
  if (!client) {
    activeAccount = null
    return
  }
  try {
    await client.logout()
  } catch {
    try {
      client.close()
    } catch {
      /* ignore */
    }
  } finally {
    client = null
    activeAccount = null
  }
}

export async function connect(account: Account): Promise<void> {
  await disconnect()
  const next = new ImapFlow(imapOptions(account.settings))
  try {
    await next.connect()
    client = next
    activeAccount = account
  } catch (err) {
    try {
      next.close()
    } catch {
      /* ignore */
    }
    throw new Error(toErrorMessage(err))
  }
}

export async function testAccount(account: Account): Promise<void> {
  const imap = new ImapFlow(imapOptions(account.settings))
  try {
    await imap.connect()
    await imap.list()
    await imap.logout()
  } catch (err) {
    try {
      imap.close()
    } catch {
      /* ignore */
    }
    throw new Error(`IMAP: ${toErrorMessage(err)}`)
  }

  const transport = smtpTransport(account.settings)
  try {
    await transport.verify()
  } catch (err) {
    throw new Error(`SMTP: ${toErrorMessage(err)}`)
  } finally {
    transport.close()
  }
}

export async function listFolders(): Promise<FolderInfo[]> {
  const c = await ensureClient()
  const list = await c.list()
  return map(
    filter(list, (box) => !box.flags?.has('\\Noselect')),
    (box) => ({
      path: box.path,
      name: box.name || box.path,
      role: mapRole(box.specialUse),
      delimiter: box.delimiter,
    }),
  )
}

export async function syncFolder(
  folderPath: string,
  cursor: FolderSyncCursor | null,
  opts?: { limit?: number; force?: boolean },
): Promise<FolderSyncResult> {
  const limit = opts?.limit ?? 50
  const force = opts?.force ?? false
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const nextCursor = mailboxCursor(c)
    const validityChanged =
      !cursor || cursor.uidValidity !== nextCursor.uidValidity

    if (force || validityChanged) {
      const messages = await fetchRecentHeaders(c, limit)
      return {
        kind: 'replace',
        ...nextCursor,
        messages,
      }
    }

    if (nextCursor.uidNext <= cursor.uidNext) {
      return {
        kind: 'noop',
        ...nextCursor,
        messages: [],
      }
    }

    const messages = await fetchHeadersByRange(c, `${cursor.uidNext}:*`, true)
    return {
      kind: 'append',
      ...nextCursor,
      messages,
    }
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

export async function getMessage(
  folderPath: string,
  uid: number,
): Promise<MessageDetail> {
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const msg = await c.fetchOne(
      String(uid),
      { source: true, envelope: true, flags: true, uid: true },
      { uid: true },
    )
    if (!msg || !msg.source) {
      throw new Error('Message not found')
    }

    const parsed = await simpleParser(msg.source)
    const flags = flagsToArray(msg.flags)

    if (!contain(flags, '\\Seen')) {
      await c.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
      flags.push('\\Seen')
    }

    const fromParsed = fromAddressObject(parsed.from)
    const toParsed = fromAddressObject(parsed.to)
    const text = parsed.text || ''
    const html = isStr(parsed.html) ? parsed.html : ''

    return {
      uid: msg.uid,
      subject: parsed.subject || msg.envelope?.subject || '',
      from: isEmpty(fromParsed)
        ? mapAddresses(msg.envelope?.from as MailAddress[] | undefined)
        : fromParsed,
      to: isEmpty(toParsed)
        ? mapAddresses(msg.envelope?.to as MailAddress[] | undefined)
        : toParsed,
      cc: fromAddressObject(parsed.cc),
      bcc: fromAddressObject(parsed.bcc),
      date: parsed.date
        ? parsed.date.toISOString()
        : msg.envelope?.date
          ? new Date(msg.envelope.date).toISOString()
          : null,
      flags,
      unseen: false,
      snippet: makeSnippet(text || html),
      text,
      html,
    }
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

export async function sendMail(payload: ComposePayload): Promise<void> {
  if (!activeAccount) throw new Error('Not connected')
  const transport = smtpTransport(activeAccount.settings)
  try {
    await transport.sendMail({
      from: `"${activeAccount.name}" <${activeAccount.emailAddress}>`,
      to: payload.to,
      cc: payload.cc || undefined,
      bcc: payload.bcc || undefined,
      subject: payload.subject,
      text: payload.text,
    })
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    transport.close()
  }
}
