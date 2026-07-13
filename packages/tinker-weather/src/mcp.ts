import compact from 'licia/compact'
import sleep from 'licia/sleep'
import waitUntil from 'licia/waitUntil'
import { wmoDescription } from './lib/weather'
import type { Store } from './store'
import type { GeoResult } from './types'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'search') {
      return search(getStore(), args as { city: string })
    }
    if (name === 'query') {
      return query(getStore(), args as { index?: number })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function search(store: Store, args: { city: string }) {
  store.setSearchQuery(args.city.trim())
  await sleep(350)
  await waitUntil(() => !store.isSearching, 0, 50)

  return {
    query: store.searchQuery,
    cities: store.searchResults.map((city, index) => ({
      index,
      ...toCitySummary(city),
    })),
  }
}

async function query(store: Store, args: { index?: number }) {
  if (args.index != null) {
    const city = store.searchResults[args.index]
    if (!city) {
      throw new Error(
        `Invalid city index: ${args.index}. Call search first and use an index from the results.`,
      )
    }
    await store.selectCity(city)
  } else {
    if (!store.city) {
      throw new Error(
        'No city selected. Call search first, then query with an index.',
      )
    }
    await store.loadWeather()
  }

  if (store.error) {
    throw new Error(store.error)
  }
  if (!store.city || !store.weatherData) {
    throw new Error(
      'No city selected. Call search first, then query with an index.',
    )
  }

  const { current, daily } = store.weatherData
  return {
    city: store.cityDisplayName,
    location: store.city,
    current: {
      ...current,
      description: wmoDescription(current.weatherCode, store.language),
    },
    daily: daily.map((day) => ({
      ...day,
      description: wmoDescription(day.weatherCode, store.language),
    })),
  }
}

function toCitySummary(city: GeoResult) {
  return {
    name: compact([city.name, city.admin1, city.country]).join(' · '),
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  }
}
