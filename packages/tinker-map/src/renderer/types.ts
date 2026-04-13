export interface MapLocation {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
}

export interface Bookmark {
  id: string
  name: string
  lat: number
  lng: number
}

export type MapLayer = 'road' | 'satellite'
