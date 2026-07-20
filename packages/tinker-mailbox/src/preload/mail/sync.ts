import type { ImapFlow } from 'imapflow'
import { sortMessagesByDateDesc } from '../../common/messages'
import type {
  FolderSyncCursor,
  FolderSyncResult,
  MessageHeader,
} from '../../common/types'
import { toErrorMessage } from './errors'
import { headerFromFetched } from './parse'
import { ensureClient } from './session'

const TEXT_PEEK_BYTES = 800

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
