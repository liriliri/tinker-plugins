import { contextBridge } from 'electron'
import mapFn from 'licia/map'
import safeGet from 'licia/safeGet'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import trim from 'licia/trim'
import { httpsGet } from './http'
import type { Coords, SearchResult } from '../common/types'

const api = {
  async locate(): Promise<Coords | null> {
    try {
      const data = JSON.parse(await httpsGet('https://ipwho.is/'))
      const lat = safeGet(data, 'latitude')
      const lng = safeGet(data, 'longitude')
      if (safeGet(data, 'success') && lat && lng) {
        return { lat, lng }
      }
      return null
    } catch {
      return null
    }
  },

  async searchPlaces(query: string, lang: string): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '8',
        'accept-language': lang,
      })
      const url = `https://nominatim.openstreetmap.org/search?${params}`
      const raw = await httpsGet(url, {
        headers: { 'User-Agent': 'TinkerMap/1.0' },
      })
      const data = JSON.parse(raw)
      return mapFn(
        data,
        (item: {
          place_id: number
          display_name: string
          lat: string
          lon: string
        }) => {
          const parts = item.display_name.split(',')
          return {
            id: toStr(item.place_id),
            name: trim(parts[0]),
            description: trim(parts.slice(1).join(',')),
            lat: toNum(item.lat),
            lng: toNum(item.lon),
          }
        },
      )
    } catch {
      return []
    }
  },
}

contextBridge.exposeInMainWorld('map', api)

declare global {
  const map: typeof api
}
