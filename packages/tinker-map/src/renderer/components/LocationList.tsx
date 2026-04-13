import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  SearchX,
  Search,
  Loader2,
  Bookmark,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { formatCoord } from '../lib/util'
import type { MapLocation, Bookmark as BookmarkType } from '../types'

const STAGGER_DELAY_MS = 30

interface SectionHeadingProps {
  label: string
  count: number
}

function SectionHeading({ label, count }: SectionHeadingProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`shrink-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between ${tw.list.heading}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{t('locationCount', { count })}</span>
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  text: string
  spinning?: boolean
}

function EmptyState({ icon: Icon, text, spinning }: EmptyStateProps) {
  return (
    <div className="px-3 py-10 text-center animate-fade-in">
      <Icon
        size={24}
        className={`mx-auto mb-2.5 ${spinning ? `animate-spin ${tw.empty.spinner}` : tw.empty.icon}`}
      />
      <div className={`text-xs ${tw.empty.text}`}>{text}</div>
    </div>
  )
}

interface LocationItemProps {
  location: MapLocation
  index: number
}

const LocationItem = observer(({ location, index }: LocationItemProps) => {
  const isSelected = store.selectedId === location.id

  return (
    <div
      onClick={() => store.selectLocation(location.id)}
      style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
      className={className(
        'px-3 py-2 cursor-pointer transition-all duration-150 flex items-start gap-2',
        'animate-fade-in-up',
        tw.list.itemText,
        isSelected ? tw.list.itemSelected : tw.list.itemDefault,
        !isSelected && tw.list.itemHover,
      )}
    >
      <MapPin
        size={14}
        className={className(
          'shrink-0 mt-0.5 transition-colors duration-150',
          isSelected ? tw.list.markerSelected : tw.list.markerDefault,
        )}
      />
      <div className="min-w-0 flex-1">
        <div
          className={className(
            'font-medium text-sm truncate transition-colors duration-150',
            isSelected ? tw.list.nameSelected : tw.list.nameDefault,
          )}
        >
          {location.name}
        </div>
        {location.description && (
          <div
            className={className(
              'text-xs mt-0.5 truncate',
              isSelected ? tw.list.descSelected : tw.list.descDefault,
            )}
          >
            {location.description}
          </div>
        )}
        <div className={`text-[10px] mt-0.5 font-mono ${tw.list.coordText}`}>
          {formatCoord(location.lat, location.lng)}
        </div>
      </div>
    </div>
  )
})

interface BookmarkItemProps {
  bookmark: BookmarkType
  index: number
}

const BookmarkItem = observer(({ bookmark, index }: BookmarkItemProps) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    store.removeBookmark(bookmark.id)
  }

  return (
    <div
      onClick={() => store.selectBookmark(bookmark.id)}
      style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
      className={className(
        'px-3 py-2 cursor-pointer transition-all duration-150 flex items-start gap-2 group',
        'animate-fade-in-up',
        tw.list.itemText,
        tw.list.itemDefault,
        tw.list.itemHover,
      )}
    >
      <Bookmark
        size={14}
        className={`shrink-0 mt-0.5 ${tw.list.bookmarkIcon}`}
      />
      <div className="min-w-0 flex-1">
        <div className={`font-medium text-sm truncate ${tw.list.nameDefault}`}>
          {bookmark.name}
        </div>
        <div className={`text-[10px] mt-0.5 font-mono ${tw.list.coordText}`}>
          {formatCoord(bookmark.lat, bookmark.lng)}
        </div>
      </div>
      <button
        onClick={handleRemove}
        className={`shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 ${tw.list.deleteBtn} hover:scale-110 active:scale-90`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
})

const LocationList = observer(() => {
  const { t } = useTranslation()

  const showLocationsHeading =
    !isStrBlank(store.searchQuery) && !store.searching
  const showBookmarksHeading =
    isStrBlank(store.searchQuery) && store.bookmarks.length > 0

  return (
    <div className="flex flex-col h-full">
      {showLocationsHeading && (
        <SectionHeading label={t('locations')} count={store.locations.length} />
      )}
      {showBookmarksHeading && (
        <SectionHeading label={t('bookmarks')} count={store.bookmarks.length} />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {store.searching ? (
          <EmptyState icon={Loader2} text={t('searching')} spinning />
        ) : isStrBlank(store.searchQuery) ? (
          store.bookmarks.length > 0 ? (
            store.bookmarks.map((bm, i) => (
              <BookmarkItem key={bm.id} bookmark={bm} index={i} />
            ))
          ) : (
            <EmptyState icon={Search} text={t('searchHint')} />
          )
        ) : store.locations.length === 0 ? (
          <EmptyState icon={SearchX} text={t('noResults')} />
        ) : (
          store.locations.map((loc, i) => (
            <LocationItem key={loc.id} location={loc} index={i} />
          ))
        )}
      </div>
    </div>
  )
})

export default LocationList
