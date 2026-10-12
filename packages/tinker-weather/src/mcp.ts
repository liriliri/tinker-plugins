import map from 'licia/map'
import sleep from 'licia/sleep'
import trim from 'licia/trim'
import waitUntil from 'licia/waitUntil'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import { formatCityName, wmoDescription } from './lib/weather'
import type { Store } from './store'
import type { GeoResult } from './types'

const NO_CITY = 'No city selected. Call search first, then query with an index.'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    search,
    query,
  })
}

async function search(store: Store, args: { city: string }) {
  store.setSearchQuery(trim(args.city))
  await sleep(350)
  await waitUntil(() => !store.isSearching, 0, 50)

  return {
    query: store.searchQuery,
    cities: map(store.searchResults, (city, index) => ({
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
  } else if (!store.city) {
    throw new Error(NO_CITY)
  } else {
    await store.loadWeather()
  }

  if (store.error) {
    throw new Error(store.error)
  }
  if (!store.city || !store.weatherData) {
    throw new Error(NO_CITY)
  }

  const { current, daily } = store.weatherData
  return {
    city: store.cityDisplayName,
    location: store.city,
    current: {
      ...current,
      description: wmoDescription(current.weatherCode, store.language),
    },
    daily: map(daily, (day) => ({
      ...day,
      description: wmoDescription(day.weatherCode, store.language),
    })),
  }
}

function toCitySummary(city: GeoResult) {
  return {
    name: formatCityName(city),
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  }
}
