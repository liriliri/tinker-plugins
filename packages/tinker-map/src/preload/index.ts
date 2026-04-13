import { contextBridge } from 'electron'
import trim from 'licia/trim'
import toNum from 'licia/toNum'
import { httpsGet } from './http'
import type { Coords, SearchResult } from '../common/types'

const mapObj = {
  async locate(): Promise<Coords | null> {
    try {
      const data = JSON.parse(await httpsGet('https://ipwho.is/'))
      if (data.success && data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude }
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
      return data.map(
        (item: {
          place_id: number
          display_name: string
          type: string
          lat: string
          lon: string
        }) => ({
          id: String(item.place_id),
          name: trim(item.display_name.split(',')[0]),
          description: trim(item.display_name.split(',').slice(1).join(',')),
          lat: toNum(item.lat),
          lng: toNum(item.lon),
        }),
      )
    } catch {
      return []
    }
  },
}

contextBridge.exposeInMainWorld('map', mapObj)

declare global {
  const map: typeof mapObj
}
