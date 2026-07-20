import type { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import filter from 'licia/filter'
import map from 'licia/map'
import { pickSentFolderPath } from '../../common/sentFolder'
import type { AccountSettings, ComposePayload } from '../../common/types'
import { toErrorMessage } from './errors'
import { ensureClient, getActiveAccount } from './session'
import { smtpTransport } from './transport'

type OutgoingMail = {
  from: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(payload: ComposePayload): Promise<void> {
  const account = getActiveAccount()
  if (!account) throw new Error('Not connected')

  const mail: OutgoingMail = {
    from: `"${account.name}" <${account.emailAddress}>`,
    to: payload.to,
    cc: payload.cc || undefined,
    bcc: payload.bcc || undefined,
    subject: payload.subject,
    text: payload.text,
    html: payload.html || undefined,
  }

  const transport = smtpTransport(account.settings)
  try {
    await transport.sendMail(mail)
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    transport.close()
  }

  try {
    if (shouldSaveSentCopy(account.settings)) {
      await saveToSentFolder(mail)
    }
  } catch {
    // SMTP already succeeded; missing Sent copy is non-fatal
  }
}

function shouldSaveSentCopy(settings: AccountSettings) {
  const host = settings.smtpHost.toLowerCase()
  return !(
    host.includes('gmail.com') ||
    host.includes('googlemail.com') ||
    host.includes('smtp.google.com') ||
    host.includes('outlook.com') ||
    host.includes('office365.com') ||
    host.includes('smtp.office365.com')
  )
}

async function findSentFolderPath(c: ImapFlow): Promise<string | null> {
  const list = await c.list()
  const selectable = filter(list, (box) => !box.flags?.has('\\Noselect'))
  return pickSentFolderPath(
    map(selectable, (box) => ({
      path: box.path,
      name: box.name || box.path,
      specialUse: box.specialUse,
    })),
  )
}

async function buildRawMessage(mail: OutgoingMail): Promise<Buffer> {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  })
  try {
    const info = await transport.sendMail(mail)
    return info.message as Buffer
  } finally {
    transport.close()
  }
}

async function saveToSentFolder(mail: OutgoingMail): Promise<void> {
  const c = await ensureClient()
  const sentPath = await findSentFolderPath(c)
  if (!sentPath) return
  const raw = await buildRawMessage(mail)
  await c.append(sentPath, raw, ['\\Seen'], new Date())
}
