import compact from 'licia/compact'
import isArr from 'licia/isArr'
import isFinite from 'licia/isFinite'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import map from 'licia/map'
import shuffle from 'licia/shuffle'
import startWith from 'licia/startWith'
import toInt from 'licia/toInt'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import unique from 'licia/unique'
import type { Station } from '../types'

interface CatalogHit {
  station: Station
  votes: number
  clicks: number
}

const FALLBACKS = [
  'de1.api.radio-browser.info',
  'de2.api.radio-browser.info',
  'fi1.api.radio-browser.info',
]

let origin = ''
let originPromise: Promise<string> | null = null

function clean(value: unknown): string {
  if (!isStr(value)) return ''
  return trim(value.replace(/\s+/g, ' '))
}

function coord(value: unknown): number | null {
  const raw = isStr(value) ? trim(value) : value
  if (!isFinite(raw)) return null
  return toNum(raw)
}

function httpUrl(value: unknown): string {
  const url = clean(value)
  return startWith(url, 'http') ? url : ''
}

function parseStation(row: unknown): CatalogHit | null {
  if (!isObj(row)) return null
  const raw = row as Record<string, unknown>
  const stationuuid = clean(raw.stationuuid)
  const url = httpUrl(raw.url)
  if (!stationuuid || !url) return null
  const tags = compact(
    map(clean(raw.tags).split(','), (tag) => trim(tag)),
  ) as string[]
  return {
    station: {
      stationuuid,
      name: clean(raw.name),
      url,
      urlResolved: httpUrl(raw.url_resolved),
      tags,
      country: clean(raw.country),
      countrycode: clean(raw.countrycode),
      state: clean(raw.state),
      language: clean(raw.language),
      codec: clean(raw.codec),
      bitrate: toInt(raw.bitrate) || 0,
      lat: coord(raw.geo_lat),
      lng: coord(raw.geo_long),
    },
    votes: toInt(raw.votes) || 0,
    clicks: toInt(raw.clickcount) || 0,
  }
}

async function discoverHosts(): Promise<string[]> {
  for (const host of FALLBACKS) {
    try {
      const res = await fetch(`https://${host}/json/servers`)
      if (!res.ok) continue
      const data: unknown = await res.json()
      if (!isArr(data)) continue
      const names = unique(
        compact(
          map(data, (row) => {
            if (!isObj(row)) return ''
            return clean((row as { name?: unknown }).name)
          }),
        ),
      )
      if (names.length) return shuffle(names)
    } catch {
      // Keep walking bootstrap hosts when one is down.
    }
  }
  return [...FALLBACKS]
}

async function ensureOrigin(): Promise<string> {
  if (origin) return origin
  if (!originPromise) {
    originPromise = discoverHosts()
      .then((hosts) => {
        origin = `https://${hosts[0]}`
        return origin
      })
      .catch((err: unknown) => {
        originPromise = null
        throw err
      })
  }
  return originPromise
}

async function getJson(path: string): Promise<unknown> {
  const base = await ensureOrigin()
  const res = await fetch(`${base}${path}`)
  if (!res.ok) {
    origin = ''
    originPromise = null
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json() as Promise<unknown>
}

export async function searchStations(
  offset: number,
  limit: number,
): Promise<{ stations: CatalogHit[]; fetched: number }> {
  const params = new URLSearchParams()
  params.set('hidebroken', 'true')
  params.set('bitrateMin', '128')
  params.set('bitrateMax', '320')
  params.set('is_https', 'true')
  params.set('order', 'name')
  params.set('reverse', 'false')
  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const data = await getJson(`/json/stations/search?${params}`)
  if (!isArr(data)) return { stations: [], fetched: 0 }
  return {
    stations: compact(map(data, parseStation)) as CatalogHit[],
    fetched: data.length,
  }
}

export async function stationPlayUrl(uuid: string): Promise<string> {
  const data = await getJson(`/json/url/${encodeURIComponent(uuid)}`)
  if (!isObj(data)) return ''
  return httpUrl((data as { url?: unknown }).url)
}
