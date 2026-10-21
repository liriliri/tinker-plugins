import each from 'licia/each'
import filter from 'licia/filter'
import sortBy from 'licia/sortBy'
import values from 'licia/values'
import type { Facet, Station } from '../types'
import { languageCodes } from './languageName'

const MIN_COUNT = 10

export function languageFacets(stations: Station[]): Facet[] {
  const grouped: Record<string, Facet> = {}
  each(stations, (station) => {
    each(languageCodes(station.language), (code) => {
      const found = grouped[code]
      if (found) found.count += 1
      else grouped[code] = { name: code, code, count: 1 }
    })
  })
  return sortBy(
    filter(values(grouped) as Facet[], (facet) => facet.count >= MIN_COUNT),
    (facet) => -facet.count,
  )
}
