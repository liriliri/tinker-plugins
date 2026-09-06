import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  Filter,
  LoaderCircle,
  Play,
  RotateCw,
  Search,
  Settings,
  Square,
  Webhook,
  X,
} from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { formatCount, getPetPreviewUrl, progressLabel } from '../lib/util'
import PetPreview from './PetPreview'
import SelectMenu from './SelectMenu'

const Gallery = observer(function Gallery() {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        if (store.pets.length === 0) return
        void store.loadPets(true)
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [store.pets.length, store.nextCursor])

  const sortOptions = [
    { value: 'installed', label: t('sort.installed') },
    { value: 'recent', label: t('sort.recent') },
    { value: 'popular', label: t('sort.popular') },
  ]
  const kindOptions = [
    { value: 'all', label: t('kind.all') },
    { value: 'creature', label: t('kind.creature') },
    { value: 'character', label: t('kind.character') },
    { value: 'object', label: t('kind.object') },
  ]

  return (
    <section className="flex-1 min-h-0 flex flex-col">
      <div
        className={`flex items-center gap-1.5 px-3 py-2 border-b-2 ${tw.border.divider} ${tw.background.toolbar} shrink-0`}
      >
        <label className="relative flex-1 min-w-0">
          <Search
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${tw.text.muted} pointer-events-none`}
          />
          <input
            className={`${tw.input.base} w-full pl-8 pr-8`}
            value={store.query}
            onChange={(e) => store.setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            type="text"
          />
          {store.query ? (
            <button
              type="button"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 border-none bg-transparent ${tw.text.mutedHover}`}
              onClick={() => store.setQuery('')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </label>
        <SelectMenu
          value={store.sort}
          onChange={(value) => store.setSort(value)}
          options={sortOptions}
        />
        <SelectMenu
          value={store.kind || 'all'}
          onChange={(value) => store.setKind(value === 'all' ? '' : value)}
          icon={<Filter className="w-3.5 h-3.5" />}
          options={kindOptions}
        />
        <button
          type="button"
          className={tw.button.icon}
          title={t('refresh')}
          onClick={() => void store.loadPets(false)}
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className={`w-px h-5 ${tw.background.rule} mx-0.5`} />
        <button
          type="button"
          className={tw.button.icon}
          title={t('tabs.installed')}
          onClick={() => store.setOverlay('installed')}
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={tw.button.icon}
          title={t('tabs.hooks')}
          onClick={() => store.setOverlay('hooks')}
        >
          <Webhook className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={tw.button.icon}
          title={t('tabs.settings')}
          onClick={() => store.setOverlay('settings')}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {store.errorMessage ? (
        <div className={`mx-3 mt-2 ${tw.alert.error}`}>
          <span>{store.errorMessage}</span>
          <button
            type="button"
            className={tw.button.icon}
            onClick={() => store.setErrorMessage('')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {store.loading && store.pets.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center gap-2 ${tw.text.muted}`}
          >
            <LoaderCircle className={`w-6 h-6 animate-spin ${tw.brand.pop}`} />
            <span className="text-sm font-semibold">{t('loading')}</span>
          </div>
        ) : store.pets.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center gap-2 ${tw.text.muted}`}
          >
            <div className={tw.empty.iconWrap}>
              <Search className="w-5 h-5" />
            </div>
            <strong className={`text-sm font-bold ${tw.text.primary}`}>
              {t('emptyGallery')}
            </strong>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-2.5">
            {store.pets.map((pet) => {
              const installing = store.installingSlugs.has(pet.slug)
              const installed = store.installedSlugSet.has(pet.slug)
              const active =
                store.storage.activeSlug === pet.slug && store.storage.enabled
              return (
                <article
                  key={pet.slug}
                  className={tw.card.base}
                  style={
                    {
                      ['--pet-accent' as string]:
                        pet.dominantColor || tw.brand.accent,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={`relative border-none p-0 cursor-pointer ${tw.card.stage}`}
                    onClick={() => store.setDetailPet(pet)}
                  >
                    <PetPreview
                      src={getPetPreviewUrl(pet.slug, pet.previewUrl)}
                      fallbackSrc={pet.spritesheetPath}
                      label={pet.displayName}
                      className="w-full aspect-[192/208] object-contain drop-shadow-sm"
                    />
                    {pet.featured ? (
                      <span
                        className={`absolute top-1.5 left-1.5 text-[9px] font-extrabold tracking-wide px-1.5 py-0.5 rounded-lg ${tw.brand.solid}`}
                      >
                        {t('featured')}
                      </span>
                    ) : null}
                    <span className={tw.card.badge}>
                      {t('dexNumber', { n: pet.dexNumber ?? '—' })}
                    </span>
                  </button>
                  <div className="px-2 py-1.5 flex flex-col gap-1.5 flex-1">
                    <div className="min-w-0">
                      <strong
                        className={`block truncate text-[12px] font-extrabold ${tw.text.primary}`}
                      >
                        {pet.displayName}
                      </strong>
                      <span
                        className={`block truncate text-[10px] font-semibold ${tw.text.muted}`}
                      >
                        {pet.submittedBy.name}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${tw.text.muted}`}
                      >
                        <Download className="w-3 h-3" />
                        {formatCount(pet.metrics.installCount)}
                      </span>
                      {!installed ? (
                        <button
                          type="button"
                          className={`${tw.button.secondary} !h-6 !px-2 !text-[11px]`}
                          disabled={installing}
                          onClick={() => void store.installPet(pet)}
                        >
                          {installing ? (
                            <LoaderCircle className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          {installing
                            ? progressLabel(
                                store.downloadProgress.get(pet.slug),
                              )
                            : t('download')}
                        </button>
                      ) : active ? (
                        <button
                          type="button"
                          className={`${tw.button.secondary} !h-6 !px-2 !text-[11px]`}
                          onClick={() => void store.disablePet()}
                        >
                          <Square className="w-3 h-3" />
                          {t('close')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${tw.button.primary} !h-6 !px-2 !text-[11px]`}
                          onClick={() => void store.enablePet(pet.slug)}
                        >
                          <Play className="w-3 h-3" />
                          {t('enable')}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {store.nextCursor !== null && store.pets.length > 0 ? (
          <div
            ref={sentinelRef}
            className={`h-10 flex items-center justify-center ${tw.text.muted}`}
          >
            {store.loadingMore ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
})

export default Gallery
