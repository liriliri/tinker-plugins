import { openDB, type IDBPDatabase, type DBSchema } from 'idb'
import type { DictInfo } from '../../common/types'

interface DictionaryDB extends DBSchema {
  dicts: {
    key: string
    value: DictInfo
  }
}

const DB_NAME = 'tinker-dictionary'
const DB_VERSION = 1
const STORE_NAME = 'dicts'

let dbPromise: Promise<IDBPDatabase<DictionaryDB>> | null = null

function getDB(): Promise<IDBPDatabase<DictionaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DictionaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllDicts(): Promise<DictInfo[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function putDict(info: DictInfo): Promise<void> {
  const db = await getDB()
  const plain: DictInfo = {
    title: info.title,
    description: info.description,
    path: info.path,
    icon: info.icon,
  }
  await db.put(STORE_NAME, plain)
}

export async function removeDict(path: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, path)
}
