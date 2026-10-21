import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Heart, Search } from 'lucide-react'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import trim from 'licia/trim'
import { useTranslation } from 'react-i18next'
import { stationMeta, stationTitle, tagName } from '../lib/format'
import { languageName } from '../lib/languageName'
import store from '../store'
import { tw } from '../theme'
import type { Station } from '../types'
import FacetSelect from './FacetSelect'

function pickStation(station: Station) {
  void store.play(station)
  store.setQuery('')
  document.getElementById('station-search')?.blur()
}

function HitButton({
  station,
  onPick,
}: {
  station: Station
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={className(
        'block w-full min-w-0 overflow-hidden cursor-pointer px-4 py-2 text-left',
        tw.background.row,
      )}
    >
      <span className={className('block truncate text-sm', tw.text.primary)}>
        {stationTitle(station.name)}
      </span>
      <span
        className={className('block truncate', tw.text.meta, tw.text.muted)}
      >
        {stationMeta(station)}
      </span>
    </button>
  )
}

const Header = observer(function Header() {
  const { t, i18n } = useTranslation()
  const savedRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const languageLabel = languageName(
    store.selectedLanguages.join(','),
    i18n.language,
  )
  const tagJoiner = lowerCase(i18n.language).startsWith('zh') ? '、' : ', '
  const tagLabel = map(store.selectedTags, tagName).join(tagJoiner)
  const languageItems = map(store.languages, (facet) => ({
    code: facet.code,
    label: languageName(facet.name, i18n.language),
    count: facet.count,
  }))
  const tagItems = map(store.tagFacets, (facet) => ({
    code: facet.code,
    label: tagName(facet.name),
    count: facet.count,
  }))
  const expanded = open || !!store.query
  const hits = open && trim(store.query) ? store.searchHits : []
  const showMenu = open && !!trim(store.query)

  useEffect(() => {
    if (!savedOpen) return
    const onDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node) || savedRef.current?.contains(target)) {
        return
      }
      setSavedOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [savedOpen])

  return (
    <>
      <div className="absolute left-[clamp(16px,3.5vw,40px)] top-[clamp(16px,3.5vh,32px)] z-30 flex flex-col items-start gap-4">
        <div className="flex h-9 items-center gap-2">
          <FacetSelect
            allLabel={t('allLanguages')}
            selectedLabel={languageLabel}
            items={languageItems}
            selected={store.selectedLanguages}
            total={store.languageTotal}
            open={langOpen}
            onOpenChange={(next) => {
              setSavedOpen(false)
              setOpen(false)
              setTagOpen(false)
              setLangOpen(next)
            }}
            onToggle={(code) => store.toggleLanguage(code)}
            onClear={() => store.clearLanguages()}
          />
          <FacetSelect
            allLabel={t('allTags')}
            selectedLabel={tagLabel}
            items={tagItems}
            selected={store.selectedTags}
            total={store.tagTotal}
            open={tagOpen}
            onOpenChange={(next) => {
              setSavedOpen(false)
              setOpen(false)
              setLangOpen(false)
              setTagOpen(next)
            }}
            onToggle={(code) => store.toggleTag(code)}
            onClear={() => store.clearTags()}
          />
        </div>
        <div className={className('pl-3', tw.text.meta, tw.text.muted)}>
          {t('globeCount', { n: store.visibleGlobe.length })}
        </div>
      </div>
      <div className="absolute right-[clamp(16px,3.5vw,40px)] top-[clamp(16px,3.5vh,32px)] z-30 flex items-start gap-2">
        <div className="relative">
          <label
            className={className(
              'relative block h-9 transition-[width] duration-200',
              expanded ? 'w-80' : 'w-9',
            )}
          >
            <button
              type="button"
              className={className(
                'absolute inset-y-0 left-0 w-9 grid place-items-center cursor-pointer',
                tw.text.muted,
                expanded ? 'opacity-0 pointer-events-none' : '',
              )}
              title={t('searchPlaceholder')}
              onClick={() => {
                setSavedOpen(false)
                setLangOpen(false)
                setTagOpen(false)
                setOpen(true)
                document.getElementById('station-search')?.focus()
              }}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
            <input
              id="station-search"
              value={store.query}
              onChange={(e) => store.setQuery(e.target.value)}
              onFocus={() => {
                setSavedOpen(false)
                setLangOpen(false)
                setTagOpen(false)
                setOpen(true)
              }}
              onBlur={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  store.setQuery('')
                  setOpen(false)
                  e.currentTarget.blur()
                  return
                }
                const first = hits[0]
                if (e.key !== 'Enter' || !first) return
                e.preventDefault()
                pickStation(first)
                setOpen(false)
                e.currentTarget.blur()
              }}
              placeholder={t('searchPlaceholder')}
              className={className(
                'h-9 w-full select-text rounded-full px-4 text-sm outline-none backdrop-blur-md',
                tw.panel,
                tw.text.primary,
                expanded ? '' : 'opacity-0 pointer-events-none',
              )}
            />
          </label>
          {showMenu ? (
            <div
              className={className(
                'absolute right-0 top-11 w-full overflow-hidden rounded-lg',
                tw.panel,
              )}
              onMouseDown={(e) => e.preventDefault()}
            >
              {isEmpty(hits) ? (
                <p className={className('px-4 py-3 text-sm', tw.text.muted)}>
                  {t('noHit')}
                </p>
              ) : (
                map(hits, (station) => (
                  <HitButton
                    key={station.stationuuid}
                    station={station}
                    onPick={() => {
                      pickStation(station)
                      setOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>
        <div ref={savedRef} className="relative">
          <button
            type="button"
            title={t('tabSaved')}
            onClick={() => {
              setLangOpen(false)
              setTagOpen(false)
              setSavedOpen((value) => !value)
            }}
            className={className(
              'grid h-9 w-9 cursor-pointer place-items-center rounded-full',
              tw.panel,
              savedOpen ? tw.text.primary : tw.text.muted,
            )}
          >
            <Heart
              className="w-4 h-4"
              fill={savedOpen ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
          {savedOpen ? (
            <div
              className={className(
                'absolute right-0 top-11 w-80 max-h-80 overflow-y-auto overflow-x-hidden rounded-lg',
                tw.panel,
                tw.menuScroll,
              )}
            >
              {isEmpty(store.saved) ? (
                <p className={className('px-4 py-3 text-sm', tw.text.muted)}>
                  {t('savedEmpty')}
                </p>
              ) : (
                map(store.saved, (station) => (
                  <HitButton
                    key={station.stationuuid}
                    station={station}
                    onPick={() => {
                      pickStation(station)
                      setSavedOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
})

export default Header
