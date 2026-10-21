export interface Station {
  stationuuid: string
  name: string
  url: string
  urlResolved: string
  tags: string[]
  country: string
  countrycode: string
  state: string
  language: string
  codec: string
  bitrate: number
  lat: number | null
  lng: number | null
}

export interface Facet {
  name: string
  code: string
  count: number
}

export type Playback =
  'idle' | 'connecting' | 'playing' | 'paused' | 'failed' | 'blocked'

export const TAGS = [
  'pop',
  'rock',
  'jazz',
  'classical',
  'news',
  'electronic',
  'folk',
] as const
