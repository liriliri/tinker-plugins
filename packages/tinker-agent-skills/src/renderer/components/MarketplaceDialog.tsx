import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Download, LoaderCircle, Search, X } from 'lucide-react'
import className from 'licia/className'
import isNil from 'licia/isNil'
import type { MarketplaceSkill } from '../../common/types'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'

interface MarketplaceRowProps {
  skill: MarketplaceSkill
}

function formatInstallCount(count: number | null): string {
  if (isNil(count)) return ''
  if (count >= 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(count)
}

function MarketplaceRow({ skill }: MarketplaceRowProps) {
  const { t } = useTranslation()
  const installing = store.marketplaceInstallingId === skill.id
  const busy = Boolean(store.marketplaceInstallingId)

  return (
    <div
      className={className(
        'flex items-start gap-3 px-3 py-3 rounded-lg',
        tw.background.dialogRow,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={className(
              'text-[13px] font-medium truncate',
              tw.text.primary,
            )}
            title={skill.name}
          >
            {skill.name}
          </div>
          {skill.author ? (
            <span className={className('text-[11px] shrink-0', tw.text.muted)}>
              {skill.author}
            </span>
          ) : null}
        </div>
        <p
          className={className(
            'text-[12px] leading-relaxed line-clamp-2 m-0 mt-1',
            tw.text.secondary,
          )}
          title={skill.description || undefined}
        >
          {skill.description || t('noDescription')}
        </p>
        <div
          className={className(
            'flex items-center gap-2 mt-1.5 text-[11px]',
            tw.text.muted,
          )}
        >
          <span className="font-mono truncate">{skill.slug}</span>
          {skill.installCount != null ? (
            <span className="shrink-0">
              {t('marketplaceInstalls', {
                count: formatInstallCount(skill.installCount),
              })}
            </span>
          ) : null}
        </div>
      </div>

      {skill.installed ? (
        <span
          className={className(
            'inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium shrink-0',
            tw.tag.linked,
          )}
        >
          <Check className="w-3 h-3" strokeWidth={2.5} />
          {t('marketplaceInstalled')}
        </span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => store.installMarketplaceSkill(skill)}
          className={className(
            'inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border-none cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
            tw.button.done,
          )}
        >
          {installing ? (
            <LoaderCircle className="w-3 h-3 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="w-3 h-3" strokeWidth={2} />
          )}
          {installing ? t('marketplaceInstalling') : t('marketplaceInstall')}
        </button>
      )}
    </div>
  )
}

const MarketplaceDialog = observer(() => {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!store.marketplaceOpen) return
    const root = viewportRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        void store.loadMoreMarketplace()
      },
      { root, rootMargin: '120px 0px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    store.marketplaceOpen,
    store.marketplaceSkills.length,
    store.marketplaceHasMore,
    store.marketplaceQuery,
  ])

  return (
    <Dialog.Root
      open={store.marketplaceOpen}
      onOpenChange={(next) => {
        if (!next) store.closeMarketplace()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className(
            'fixed inset-0 z-40 backdrop-blur-[2px]',
            tw.overlay,
          )}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100vw-2.5rem)] max-w-lg h-[min(640px,85vh)]',
            'flex flex-col rounded-2xl shadow-2xl overflow-hidden outline-none border',
            tw.background.dialog,
            tw.border.dialog,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
            <Dialog.Title
              className={className(
                'text-[15px] font-semibold tracking-tight',
                tw.text.primary,
              )}
            >
              {t('marketplaceTitle')}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t('marketplaceSearchPlaceholder')}
            </Dialog.Description>
            <Dialog.Close
              className={className(
                'flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer shrink-0',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
              disabled={Boolean(store.marketplaceInstallingId)}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <div className="px-5 pb-3 shrink-0">
            <div
              className={className(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-shadow',
                tw.border.search,
                tw.border.searchFocus,
                tw.background.search,
              )}
            >
              <Search
                className={className('w-3.5 h-3.5 shrink-0', tw.text.muted)}
                strokeWidth={2}
              />
              <input
                type="text"
                value={store.marketplaceQuery}
                onChange={(e) => store.setMarketplaceQuery(e.target.value)}
                placeholder={t('marketplaceSearchPlaceholder')}
                className={className(
                  'flex-1 text-[13px] bg-transparent outline-none border-none',
                  tw.text.primary,
                  tw.text.placeholder,
                )}
              />
              {store.marketplaceQuery ? (
                <button
                  type="button"
                  onClick={() => store.setMarketplaceQuery('')}
                  className={className(
                    'flex items-center justify-center w-4 h-4 shrink-0 rounded-sm bg-transparent border-none cursor-pointer',
                    tw.button.icon.default,
                    tw.button.icon.hover,
                  )}
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              ) : null}
            </div>
          </div>

          <AppScrollArea ref={viewportRef} viewportClassName="px-2 pb-2">
            {store.marketplaceLoading &&
            store.marketplaceSkills.length === 0 ? (
              <div
                className={className(
                  'px-3 py-10 text-center text-sm',
                  tw.empty,
                )}
              >
                {t('marketplaceLoading')}
              </div>
            ) : store.marketplaceError &&
              store.marketplaceSkills.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className={className('text-sm m-0', tw.empty)}>
                  {t(store.marketplaceError)}
                </p>
                <button
                  type="button"
                  onClick={() => store.refreshMarketplace()}
                  className={className(
                    'mt-3 px-3 h-7 rounded-md text-[12px] font-medium border-none cursor-pointer',
                    tw.button.ghost,
                  )}
                >
                  {t('marketplaceRetry')}
                </button>
              </div>
            ) : store.marketplaceSkills.length === 0 ? (
              <div
                className={className(
                  'px-3 py-10 text-center text-sm',
                  tw.empty,
                )}
              >
                {t('marketplaceEmpty')}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {store.marketplaceSkills.map((skill) => (
                  <MarketplaceRow key={skill.id} skill={skill} />
                ))}
                {store.marketplaceHasMore && !store.marketplaceQuery.trim() ? (
                  <div
                    ref={sentinelRef}
                    className={className(
                      'flex items-center justify-center py-3 text-[12px]',
                      tw.empty,
                    )}
                  >
                    {store.marketplaceLoadingMore ? (
                      <LoaderCircle
                        className="w-4 h-4 animate-spin"
                        strokeWidth={2}
                      />
                    ) : (
                      <span className="h-4" />
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </AppScrollArea>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default MarketplaceDialog
