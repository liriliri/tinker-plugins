import type { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isStr from 'licia/isStr'
import map from 'licia/map'
import { isTrashFolder, pickTrashFolderPath } from '../../common/trashFolder'
import type { MailAddress, MessageDetail } from '../../common/types'
import { toErrorMessage } from './errors'
import {
  flagsToArray,
  fromAddressObject,
  makeSnippet,
  mapAddresses,
  toIsoDate,
} from './parse'
import { ensureClient } from './session'

export async function getMessage(
  folderPath: string,
  uid: number,
): Promise<MessageDetail> {
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const msg = await c.fetchOne(
      String(uid),
      {
        source: true,
        envelope: true,
        flags: true,
        uid: true,
        internalDate: true,
      },
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
      date: toIsoDate(parsed.date, msg.envelope?.date, msg.internalDate),
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

export async function deleteMessage(
  folderPath: string,
  uid: number,
): Promise<void> {
  const c = await ensureClient()
  const list = await c.list()
  const selectable = filter(list, (box) => !box.flags?.has('\\Noselect'))
  const folders = map(selectable, (box) => ({
    path: box.path,
    name: box.name || box.path,
    specialUse: box.specialUse,
  }))
  const inTrash = isTrashFolder(
    find(folders, (f) => f.path === folderPath) || { path: folderPath },
  )
  const trashPath = pickTrashFolderPath(folders)

  const lock = await c.getMailboxLock(folderPath)
  try {
    const range = String(uid)
    const opts = { uid: true as const }
    const existing = await c.fetchOne(range, { uid: true }, opts)
    if (!existing) {
      throw new Error('Message not found')
    }

    if (inTrash || !trashPath || trashPath === folderPath) {
      const ok = await c.messageDelete(range, opts)
      if (!ok) throw new Error('Failed to delete message')
      return
    }

    await moveMessageToFolder(c, range, trashPath, opts)
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

export async function moveMessage(
  folderPath: string,
  uid: number,
  destination: string,
): Promise<void> {
  if (folderPath === destination) return
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const range = String(uid)
    const opts = { uid: true as const }
    const existing = await c.fetchOne(range, { uid: true }, opts)
    if (!existing) {
      throw new Error('Message not found')
    }
    await moveMessageToFolder(c, range, destination, opts)
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

async function moveMessageToFolder(
  c: ImapFlow,
  range: string,
  destination: string,
  opts: { uid: true },
): Promise<void> {
  const moved = await c.messageMove(range, destination, opts)
  if (moved) return

  const copied = await c.messageCopy(range, destination, opts)
  if (copied) {
    await c.messageDelete(range, opts)
    return
  }

  const msg = await c.fetchOne(
    range,
    { source: true, uid: true, flags: true, internalDate: true },
    opts,
  )
  if (!msg || !msg.source) {
    throw new Error('Message not found')
  }
  const flags = flagsToArray(msg.flags).filter((f) => f !== '\\Deleted')
  const appended = await c.append(
    destination,
    msg.source,
    flags,
    msg.internalDate || new Date(),
  )
  if (!appended) {
    throw new Error(`Failed to move message to ${destination}`)
  }
  const removed = await c.messageDelete(range, opts)
  if (!removed) {
    throw new Error(
      `Copied to ${destination} but failed to remove from source folder`,
    )
  }
}
