export interface SystemInfo {
  id: string
  name: string
  path: string
  group: string
}

export interface Song {
  id: string
  title: string
  game: string
  url: string
  size: number
  sequencer: string
}

export interface GameGroup {
  game: string
  songs: Song[]
}
