import clamp from 'licia/clamp'
import contain from 'licia/contain'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import sleep from 'licia/sleep'
import trim from 'licia/trim'
import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import { SYSTEMS } from '../common/systems'
import type { Song } from '../common/types'
import { formatSongSize } from './lib/util'
import type { Store } from './store'

const MAX_RESULTS = 50

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    list_systems: listSystems,
    load_system: loadSystem,
    search_songs: searchSongs,
    download_song: downloadSong,
  })
}

function serializeSong(song: Song, index: number) {
  return {
    index,
    title: song.title,
    game: song.game,
    sequencer: song.sequencer,
    size: formatSongSize(song.size),
    url: song.url,
  }
}

function listSystems() {
  return {
    systems: map(SYSTEMS, (s) => ({
      id: s.id,
      name: s.name,
      group: s.group,
    })),
  }
}

function resolveSystemId(system: string) {
  const key = lowerCase(trim(system))
  if (!key) throw new Error('system is required')
  const match =
    find(SYSTEMS, (s) => s.id === key) ||
    find(SYSTEMS, (s) => lowerCase(s.name) === key) ||
    find(SYSTEMS, (s) => contain(lowerCase(s.name), key))
  if (!match) {
    throw new Error(
      `Unknown system: ${system}. Call list_systems for valid ids.`,
    )
  }
  return match
}

async function loadSystem(store: Store, args: { system: string }) {
  const meta = resolveSystemId(args.system)
  await store.selectSystem(meta.id)
  await waitUntil(() => !store.isLoading, 0, 50)
  if (store.isLoading) {
    throw new Error(`Timed out loading system: ${meta.id}`)
  }
  if (isEmpty(store.songs)) {
    throw new Error(`No songs loaded for system: ${meta.id}`)
  }
  return {
    system: {
      id: store.system.id,
      name: store.system.name,
      group: store.system.group,
    },
    songCount: store.songs.length,
  }
}

async function searchSongs(
  store: Store,
  args: { query?: string; limit?: number },
) {
  if (isEmpty(store.songs)) {
    await store.loadSongs()
    await waitUntil(() => !store.isLoading, 0, 50)
  }
  if (isEmpty(store.songs)) {
    throw new Error('No songs loaded. Call load_system first.')
  }

  store.setQuery(trim(args.query || ''))
  await sleep(250)

  const limit = clamp(Math.floor(args.limit ?? 20), 1, MAX_RESULTS)
  const matches = store.filteredSongs
  return {
    system: {
      id: store.system.id,
      name: store.system.name,
    },
    query: store.filterQuery,
    total: matches.length,
    songs: map(matches.slice(0, limit), (song, index) =>
      serializeSong(song, index),
    ),
  }
}

async function downloadSong(
  store: Store,
  args: { path: string; index?: number; url?: string },
) {
  const filePath = trim(args.path)
  if (!filePath) throw new Error('path is required')

  let song: Song | undefined
  const url = trim(args.url || '')
  if (url) {
    song = find(store.songs, (s) => s.url === url)
    if (!song) {
      throw new Error(`Song url not found in the loaded system catalog: ${url}`)
    }
  } else if (args.index != null) {
    if (isEmpty(store.filteredSongs)) {
      throw new Error('No search results. Call search_songs first.')
    }
    song = store.filteredSongs[args.index]
    if (!song) {
      throw new Error(
        `Invalid index: ${args.index}. Use an index from search_songs results.`,
      )
    }
  } else {
    throw new Error('Provide index (from search_songs) or url.')
  }

  await store.saveSongTo(song, filePath)
  return {
    path: filePath,
    song: serializeSong(song, args.index ?? -1),
  }
}
