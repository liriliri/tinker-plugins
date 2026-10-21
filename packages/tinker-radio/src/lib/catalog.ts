import filter from 'licia/filter'
import type { Station } from '../types'
import { readCatalogMeta, readCatalogStations, replaceCatalog } from './db'
import { searchStations } from './radioBrowser'

const PAGE = 1000
const MAX_AGE = 24 * 60 * 60 * 1000
const CATALOG_REVISION = 7

function keepStation(station: Station): boolean {
  if (station.lat !== null && station.lng !== null) return true
  return station.country !== '' || station.countrycode !== ''
}

export async function loadGeoCatalog(
  onProgress: (stations: Station[]) => void,
  force = false,
): Promise<Station[]> {
  const meta = await readCatalogMeta()
  const fresh =
    !force &&
    !!meta?.complete &&
    meta.revision === CATALOG_REVISION &&
    Date.now() - meta.fetchedAt < MAX_AGE &&
    meta.count > 0
  if (fresh) {
    const cached = filter(await readCatalogStations(), keepStation)
    onProgress(cached)
    return cached
  }

  const rows: Station[] = []
  let offset = 0
  for (;;) {
    const page = await searchStations(offset, PAGE)
    for (const hit of page.stations) {
      if (hit.votes === 0 || hit.clicks === 0) continue
      if (!keepStation(hit.station)) continue
      rows.push(hit.station)
    }
    offset += page.fetched
    onProgress(rows.slice())
    if (page.fetched < PAGE) break
  }
  await replaceCatalog(rows, {
    key: 'catalog',
    fetchedAt: Date.now(),
    count: rows.length,
    complete: true,
    revision: CATALOG_REVISION,
  })
  return rows
}
