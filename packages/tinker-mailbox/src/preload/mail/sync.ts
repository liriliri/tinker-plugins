import type { ImapFlow } from 'imapflow'
import { sortMessagesByDateDesc } from '../../common/messages'
import type {
  FolderSyncCursor,
  FolderSyncResult,
  MessageHeader,
  OlderMessagesResult,
} from '../../common/types'
import { toErrorMessage } from './errors'
import { headerFromFetched } from './parse'
import { ensureClient } from './session'

const TEXT_PEEK_BYTES = 800
const UID_VERIFY_CHUNK = 200

function mailboxCursor(c: ImapFlow): FolderSyncCursor {
  const box = c.mailbox
  if (!box || !('uidValidity' in box)) {
    return { uidValidity: '0', uidNext: 1, exists: 0 }
  }
  return {
    uidValidity: String(box.uidValidity),
    uidNext: box.uidNext,
    highestModseq: box.highestModseq ? String(box.highestModseq) : undefined,
    exists: 'exists' in box ? box.exists : 0,
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
        internalDate: true,
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
): Promise<{ messages: MessageHeader[]; oldestSeq: number }> {
  const exists = c.mailbox && 'exists' in c.mailbox ? c.mailbox.exists : 0
  if (!exists) return { messages: [], oldestSeq: 1 }
  const take = Math.min(limit, exists)
  const start = Math.max(1, exists - take + 1)
  const messages = await fetchHeadersByRange(c, `${start}:${exists}`, false)
  return { messages, oldestSeq: start }
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
    const shrinkDetected =
      !!cursor &&
      typeof cursor.exists === 'number' &&
      typeof nextCursor.exists === 'number' &&
      nextCursor.exists < cursor.exists

    if (force || validityChanged || shrinkDetected) {
      const { messages, oldestSeq } = await fetchRecentHeaders(c, limit)
      return {
        kind: 'replace',
        ...nextCursor,
        oldestSeq,
        messages,
      }
    }

    if (nextCursor.uidNext <= cursor.uidNext) {
      return {
        kind: 'noop',
        ...nextCursor,
        oldestSeq: cursor.oldestSeq,
        messages: [],
      }
    }

    const messages = await fetchHeadersByRange(c, `${cursor.uidNext}:*`, true)
    return {
      kind: 'append',
      ...nextCursor,
      oldestSeq: cursor.oldestSeq,
      messages,
    }
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

export async function fetchOlderMessages(
  folderPath: string,
  oldestSeq: number,
  opts?: { limit?: number },
): Promise<OlderMessagesResult> {
  const limit = opts?.limit ?? 50
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const exists =
      c.mailbox && 'exists' in c.mailbox ? (c.mailbox.exists as number) : 0
    if (oldestSeq <= 1 || !exists) {
      return {
        messages: [],
        oldestSeq: Math.max(1, oldestSeq),
        exists,
        hasMore: false,
      }
    }
    const take = Math.min(limit, oldestSeq - 1)
    const start = oldestSeq - take
    const end = oldestSeq - 1
    const messages = await fetchHeadersByRange(c, `${start}:${end}`, false)
    return {
      messages,
      oldestSeq: start,
      exists,
      hasMore: start > 1,
    }
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}

export async function filterExistingUids(
  folderPath: string,
  uids: number[],
): Promise<number[]> {
  if (uids.length === 0) return []
  const c = await ensureClient()
  const lock = await c.getMailboxLock(folderPath)
  try {
    const found: number[] = []
    for (let i = 0; i < uids.length; i += UID_VERIFY_CHUNK) {
      const chunk = uids.slice(i, i + UID_VERIFY_CHUNK)
      const result = await c.search({ uid: chunk.join(',') }, { uid: true })
      if (Array.isArray(result)) {
        for (const uid of result) found.push(uid)
      }
    }
    return found
  } catch (err) {
    throw new Error(toErrorMessage(err))
  } finally {
    lock.release()
  }
}
