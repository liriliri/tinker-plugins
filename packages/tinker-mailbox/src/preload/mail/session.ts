import { ImapFlow } from 'imapflow'
import type { Account } from '../../common/types'
import { toErrorMessage } from './errors'
import { imapOptions, smtpTransport } from './transport'

let client: ImapFlow | null = null
let activeAccount: Account | null = null

export function getActiveAccount(): Account | null {
  return activeAccount
}

export async function ensureClient(): Promise<ImapFlow> {
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
