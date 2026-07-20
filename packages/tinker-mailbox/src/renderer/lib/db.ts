import { openDB, type IDBPDatabase, type DBSchema } from 'idb'
import filter from 'licia/filter'
import map from 'licia/map'
import pick from 'licia/pick'
import pluck from 'licia/pluck'
import startWith from 'licia/startWith'
import { sortMessagesByDateDesc } from '../../common/messages'
import type {
  FolderInfo,
  FolderSyncCursor,
  MessageDetail,
  MessageHeader,
} from '../../common/types'

interface SessionMeta {
  key: 'session'
  accountId: string
  folderPath: string
}

interface FoldersRecord {
  accountId: string
  folders: FolderInfo[]
}

interface FolderSyncRecord extends FolderSyncCursor {
  id: string
  accountId: string
  folderPath: string
}

interface MessageRecord extends MessageHeader {
  id: string
  accountId: string
  folderPath: string
}

interface BodyRecord extends MessageDetail {
  id: string
  accountId: string
  folderPath: string
}

interface MailboxDB extends DBSchema {
  session: {
    key: string
    value: SessionMeta
  }
  folders: {
    key: string
    value: FoldersRecord
  }
  folderSync: {
    key: string
    value: FolderSyncRecord
  }
  messages: {
    key: string
    value: MessageRecord
    indexes: { byFolder: [string, string] }
  }
  bodies: {
    key: string
    value: BodyRecord
  }
}

const DB_NAME = 'tinker-mailbox'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<MailboxDB>> | null = null

function getDB(): Promise<IDBPDatabase<MailboxDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MailboxDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'accountId' })
        }
        if (!db.objectStoreNames.contains('folderSync')) {
          db.createObjectStore('folderSync', { keyPath: 'id' })
        }
        if (oldVersion < 2 && db.objectStoreNames.contains('messages')) {
          db.deleteObjectStore('messages')
        }
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'id' })
          store.createIndex('byFolder', ['accountId', 'folderPath'])
        }
        if (!db.objectStoreNames.contains('bodies')) {
          db.createObjectStore('bodies', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

function syncKey(accountId: string, folderPath: string): string {
  return `${accountId}::${folderPath}`
}

function messageKey(
  accountId: string,
  folderPath: string,
  uid: number,
): string {
  return `${accountId}::${folderPath}::${uid}`
}

function toHeader(row: MessageRecord): MessageHeader {
  return pick(row, [
    'uid',
    'subject',
    'from',
    'to',
    'date',
    'flags',
    'unseen',
    'snippet',
  ]) as MessageHeader
}

async function deleteKeysWithPrefix(
  storeName: 'folderSync' | 'messages' | 'bodies',
  prefix: string,
): Promise<void> {
  const db = await getDB()
  const keys = await db.getAllKeys(storeName)
  await Promise.all(
    map(
      filter(keys, (key) => startWith(String(key), prefix)),
      (key) => db.delete(storeName, key),
    ),
  )
}

export async function getSession(): Promise<SessionMeta | undefined> {
  const db = await getDB()
  return db.get('session', 'session')
}

export async function putSession(
  accountId: string,
  folderPath: string,
): Promise<void> {
  const db = await getDB()
  await db.put('session', { key: 'session', accountId, folderPath })
}

export async function getFolders(
  accountId: string,
): Promise<FolderInfo[] | undefined> {
  const db = await getDB()
  const row = await db.get('folders', accountId)
  return row?.folders
}

export async function putFolders(
  accountId: string,
  folders: FolderInfo[],
): Promise<void> {
  const db = await getDB()
  await db.put('folders', { accountId, folders })
}

export async function getFolderSync(
  accountId: string,
  folderPath: string,
): Promise<FolderSyncCursor | undefined> {
  const db = await getDB()
  const row = await db.get('folderSync', syncKey(accountId, folderPath))
  if (!row) return undefined
  return {
    uidValidity: row.uidValidity,
    uidNext: row.uidNext,
    highestModseq: row.highestModseq,
    exists: row.exists,
  }
}

export async function putFolderSync(
  accountId: string,
  folderPath: string,
  cursor: FolderSyncCursor,
): Promise<void> {
  const db = await getDB()
  await db.put('folderSync', {
    id: syncKey(accountId, folderPath),
    accountId,
    folderPath,
    ...cursor,
  })
}

export async function getMessages(
  accountId: string,
  folderPath: string,
  limit = 50,
): Promise<MessageHeader[]> {
  const db = await getDB()
  const rows = await db.getAllFromIndex('messages', 'byFolder', [
    accountId,
    folderPath,
  ])
  return sortMessagesByDateDesc(map(rows, toHeader)).slice(0, limit)
}

export async function putMessages(
  accountId: string,
  folderPath: string,
  messages: MessageHeader[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('messages', 'readwrite')
  await Promise.all(
    map(messages, (msg) =>
      tx.store.put({
        ...msg,
        id: messageKey(accountId, folderPath, msg.uid),
        accountId,
        folderPath,
      }),
    ),
  )
  await tx.done
}

export async function pruneFolderMessages(
  accountId: string,
  folderPath: string,
  keep = 200,
): Promise<void> {
  const db = await getDB()
  const rows = await db.getAllFromIndex('messages', 'byFolder', [
    accountId,
    folderPath,
  ])
  if (rows.length <= keep) return
  const sorted = sortMessagesByDateDesc(map(rows, toHeader))
  const drop = new Set(pluck(sorted.slice(keep), 'uid'))
  const tx = db.transaction('messages', 'readwrite')
  await Promise.all(
    map(
      filter(rows, (row) => drop.has(row.uid)),
      (row) => tx.store.delete(row.id),
    ),
  )
  await tx.done
}

export async function replaceFolderMessages(
  accountId: string,
  folderPath: string,
  messages: MessageHeader[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('messages', 'readwrite')
  const existing = await tx.store
    .index('byFolder')
    .getAllKeys([accountId, folderPath])
  await Promise.all(map(existing, (key) => tx.store.delete(key)))
  await Promise.all(
    map(messages, (msg) =>
      tx.store.put({
        ...msg,
        id: messageKey(accountId, folderPath, msg.uid),
        accountId,
        folderPath,
      }),
    ),
  )
  await tx.done
}

export async function updateMessageFlags(
  accountId: string,
  folderPath: string,
  uid: number,
  patch: Partial<Pick<MessageHeader, 'flags' | 'unseen' | 'snippet'>>,
): Promise<void> {
  const db = await getDB()
  const id = messageKey(accountId, folderPath, uid)
  const row = await db.get('messages', id)
  if (!row) return
  await db.put('messages', { ...row, ...patch })
}

export async function removeMessage(
  accountId: string,
  folderPath: string,
  uid: number,
): Promise<void> {
  const db = await getDB()
  const id = messageKey(accountId, folderPath, uid)
  const tx = db.transaction(['messages', 'bodies'], 'readwrite')
  await tx.objectStore('messages').delete(id)
  await tx.objectStore('bodies').delete(id)
  await tx.done
}

export async function clearFolderCache(
  accountId: string,
  folderPath: string,
): Promise<void> {
  const db = await getDB()
  await db.delete('folderSync', syncKey(accountId, folderPath))

  const tx = db.transaction(['messages', 'bodies'], 'readwrite')
  const messageKeys = await tx
    .objectStore('messages')
    .index('byFolder')
    .getAllKeys([accountId, folderPath])
  await Promise.all(
    map(messageKeys, (key) => tx.objectStore('messages').delete(key)),
  )

  const bodyPrefix = `${accountId}::${folderPath}::`
  const bodyKeys = await tx.objectStore('bodies').getAllKeys()
  await Promise.all(
    map(
      filter(bodyKeys, (key) => startWith(String(key), bodyPrefix)),
      (key) => tx.objectStore('bodies').delete(key),
    ),
  )
  await tx.done
}

export async function getBody(
  accountId: string,
  folderPath: string,
  uid: number,
): Promise<MessageDetail | undefined> {
  const db = await getDB()
  const row = await db.get('bodies', messageKey(accountId, folderPath, uid))
  if (!row) return undefined
  return pick(row, [
    'uid',
    'subject',
    'from',
    'to',
    'cc',
    'bcc',
    'date',
    'flags',
    'unseen',
    'snippet',
    'text',
    'html',
  ]) as MessageDetail
}

export async function putBody(
  accountId: string,
  folderPath: string,
  detail: MessageDetail,
): Promise<void> {
  const db = await getDB()
  await db.put('bodies', {
    ...detail,
    id: messageKey(accountId, folderPath, detail.uid),
    accountId,
    folderPath,
  })
}

export async function clearAccountCache(accountId: string): Promise<void> {
  const db = await getDB()
  await db.delete('folders', accountId)

  const prefix = `${accountId}::`
  await deleteKeysWithPrefix('folderSync', prefix)
  await deleteKeysWithPrefix('messages', prefix)
  await deleteKeysWithPrefix('bodies', prefix)

  const session = await db.get('session', 'session')
  if (session?.accountId === accountId) {
    await db.delete('session', 'session')
  }
}
