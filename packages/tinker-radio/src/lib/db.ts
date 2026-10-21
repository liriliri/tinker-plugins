import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import each from 'licia/each'
import type { Station } from '../types'

interface CatalogMeta {
  key: 'catalog'
  fetchedAt: number
  count: number
  complete: boolean
  revision?: number
}

interface RadioDB extends DBSchema {
  stations: {
    key: string
    value: Station
  }
  meta: {
    key: string
    value: CatalogMeta
  }
}

const DB_NAME = 'tinker-radio'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<RadioDB>> | null = null

function getDB(): Promise<IDBPDatabase<RadioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RadioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('stations')) {
          db.createObjectStore('stations', { keyPath: 'stationuuid' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

export async function readCatalogMeta(): Promise<CatalogMeta | undefined> {
  const db = await getDB()
  return db.get('meta', 'catalog')
}

export async function readCatalogStations(): Promise<Station[]> {
  const db = await getDB()
  return db.getAll('stations')
}

export async function replaceCatalog(
  stations: Station[],
  meta: CatalogMeta,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['stations', 'meta'], 'readwrite')
  await tx.objectStore('stations').clear()
  each(stations, (station) => {
    void tx.objectStore('stations').put(station)
  })
  void tx.objectStore('meta').put(meta)
  await tx.done
}
