import i18n from 'i18next'
import compact from 'licia/compact'
import contain from 'licia/contain'
import find from 'licia/find'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import type { Station } from '../types'

const TAG_LABELS: Record<string, string> = {
  pop: 'tagPop',
  rock: 'tagRock',
  jazz: 'tagJazz',
  classical: 'tagClassical',
  news: 'tagNews',
  electronic: 'tagElectronic',
  folk: 'tagFolk',
}

export function tagName(tag: string) {
  const key = TAG_LABELS[lowerCase(tag)]
  return key ? i18n.t(key) : tag
}

export function stationTitle(name: string) {
  return name || i18n.t('unnamed')
}

export function stationMeta(station: Station): string {
  const place = compact([station.state, station.country]).join(', ')
  const skip = map(
    compact([station.state, station.country, station.language, station.codec]),
    lowerCase,
  )
  const genre = tagName(
    find(station.tags, (tag) => !contain(skip, lowerCase(tag))) ||
      station.language,
  )
  const bitrate =
    station.bitrate > 0 ? i18n.t('kbps', { n: station.bitrate }) : ''
  return compact([place, genre, bitrate]).join(' · ')
}
