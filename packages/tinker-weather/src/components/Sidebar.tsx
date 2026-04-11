import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X, Search, Loader } from 'lucide-react'
import className from 'licia/className'
import compact from 'licia/compact'
import store from '../store'
import type { GeoResult } from '../types'

function CityItem({
  city,
  active,
  onSelect,
  onRemove,
}: {
  city: GeoResult
  active: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  return (
    <div
      className={className(
        'group flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors',
        active ? 'bg-white/20' : 'hover:bg-white/10',
      )}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{city.name}</div>
        <div className="text-xs opacity-60 truncate">
          {compact([city.admin1, city.country]).join(' · ')}
        </div>
      </div>
      {onRemove && (
        <button
          className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

const Sidebar = observer(() => {
  const { t } = useTranslation()

  const hasQuery = store.searchQuery.trim().length >= 2
  const isActive = (city: GeoResult) =>
    !!store.city &&
    store.city.latitude === city.latitude &&
    store.city.longitude === city.longitude &&
    store.city.name === city.name

  return (
    <div className="glass-card-dark rounded-2xl h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-3">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50"
            size={14}
          />
          <input
            type="text"
            placeholder={t('search')}
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white/25 border border-white/20 placeholder:opacity-40 focus:outline-none focus:bg-white/30 focus:ring-1 focus:ring-white/30 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2 space-y-1">
        {hasQuery ? (
          <>
            {store.isSearching ? (
              <div className="px-3 py-3 text-xs opacity-50 flex items-center gap-2">
                <Loader className="loading-spinner" size={12} />
                {t('searching')}
              </div>
            ) : store.searchResults.length === 0 ? (
              <div className="px-3 py-3 text-xs opacity-50">
                {t('noResults')}
              </div>
            ) : (
              store.searchResults.map((city, i) => (
                <CityItem
                  key={`${city.latitude}-${city.longitude}-${i}`}
                  city={city}
                  active={isActive(city)}
                  onSelect={() => store.selectCity(city)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {store.recentCities.length > 0 &&
              store.recentCities.map((city, i) => (
                <CityItem
                  key={`${city.latitude}-${city.longitude}-${i}`}
                  city={city}
                  active={isActive(city)}
                  onSelect={() => store.selectCity(city)}
                  onRemove={() => store.removeRecentCity(i)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  )
})

export default Sidebar
