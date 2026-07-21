import { ImapFlow } from 'imapflow'
import type { Account, MailboxIdleChange } from '../../common/types'
import { toErrorMessage } from './errors'
import { imapOptions, smtpTransport } from './transport'

let client: ImapFlow | null = null
let activeAccount: Account | null = null
let watchedPath: string | null = null
let changeListeners: Array<(change: MailboxIdleChange) => void> = []

export function getActiveAccount(): Account | null {
  return activeAccount
}

export async function ensureClient(): Promise<ImapFlow> {
  if (!client || !activeAccount) {
    throw new Error('Not connected')
  }
  return client
}

function emitChange(change: MailboxIdleChange) {
  for (const listener of changeListeners) {
    try {
      listener(change)
    } catch {
      /* ignore listener errors */
    }
  }
}

function attachIdleListeners(c: ImapFlow) {
  c.on(
    'exists',
    (data: { path?: string; count: number; prevCount: number }) => {
      emitChange({
        type: 'exists',
        path: data.path || watchedPath || '',
        count: data.count,
        prevCount: data.prevCount,
      })
    },
  )
  c.on('expunge', (data: { path?: string; seq?: number; uid?: number }) => {
    emitChange({
      type: 'expunge',
      path: data.path || watchedPath || '',
    })
  })
}

export async function watchFolder(folderPath: string): Promise<void> {
  const c = await ensureClient()
  if (
    watchedPath === folderPath &&
    c.mailbox &&
    'path' in c.mailbox &&
    c.mailbox.path === folderPath
  ) {
    return
  }
  await c.mailboxOpen(folderPath)
  watchedPath = folderPath
}

export function onMailboxChange(
  listener: (change: MailboxIdleChange) => void,
): () => void {
  changeListeners.push(listener)
  return () => {
    changeListeners = changeListeners.filter((l) => l !== listener)
  }
}

export async function disconnect(): Promise<void> {
  watchedPath = null
  if (!client) {
    activeAccount = null
    return
  }
  const prev = client
  client = null
  activeAccount = null
  try {
    await prev.logout()
  } catch {
    try {
      prev.close()
    } catch {
      /* ignore */
    }
  }
}

export async function connect(account: Account): Promise<void> {
  await disconnect()
  const next = new ImapFlow(imapOptions(account.settings))
  try {
    attachIdleListeners(next)
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
