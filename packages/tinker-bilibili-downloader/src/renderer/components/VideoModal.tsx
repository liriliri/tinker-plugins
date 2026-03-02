import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const VideoModal = observer(() => {
  const { t } = useTranslation()
  const { videoInfo, selectedQuality, selectedPages } = store

  if (!videoInfo) return null

  const isMultiPage = videoInfo.page.length > 1
  const allSelected = videoInfo.page.every((p) =>
    selectedPages.includes(p.page),
  )

  return (
    <Dialog.Root open onOpenChange={() => store.setShowVideoModal(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={className(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 w-[520px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl outline-none overflow-hidden',
            tw.background.card,
            tw.border.card,
          )}
          aria-describedby={undefined}
        >
          <div className="relative h-40 flex-shrink-0">
            <img
              src={videoInfo.cover}
              alt="cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Dialog.Title className="font-semibold text-sm leading-snug line-clamp-2 text-white">
                {videoInfo.title}
              </Dialog.Title>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-white/60 text-xs truncate">
                  {videoInfo.up.map((u) => u.name).join(', ')}
                </span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/60 text-xs flex-shrink-0">
                  {videoInfo.duration}
                </span>
              </div>
            </div>
          </div>

          <div className={className('p-4 border-b', tw.border.divider)}>
            <div
              className={className(
                'text-xs font-medium mb-2',
                tw.text.secondary,
              )}
            >
              {t('quality')}
            </div>
            <div className="flex flex-wrap gap-2">
              {videoInfo.qualityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => store.setSelectedQuality(opt.value)}
                  className={className(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                    selectedQuality === opt.value
                      ? tw.bilibili.qualityButton.active
                      : tw.bilibili.qualityButton.inactive,
                  )}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          </div>

          {isMultiPage && (
            <div
              className={className(
                'border-b flex-1 min-h-0 flex flex-col',
                tw.border.divider,
              )}
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
                <div
                  className={className(
                    'text-xs font-medium',
                    tw.text.secondary,
                  )}
                >
                  {t('pages')} ({selectedPages.length}/{videoInfo.page.length})
                </div>
                <button
                  onClick={() =>
                    allSelected
                      ? store.deselectAllPages()
                      : store.selectAllPages()
                  }
                  className={className(
                    'text-xs px-2 py-0.5 rounded-full',
                    tw.bilibili.accent,
                    'hover:underline',
                  )}
                >
                  {allSelected ? t('deselectAll') : t('selectAll')}
                </button>
              </div>
              <ScrollArea.Root className="flex-1 min-h-0">
                <ScrollArea.Viewport className="h-full w-full">
                  <div className="space-y-0.5 px-4 pb-4">
                    {videoInfo.page.map((p) => (
                      <label
                        key={p.page}
                        className={className(
                          'flex items-center gap-2 px-2 py-1.5 rounded-xl cursor-pointer',
                          tw.background.hover,
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(p.page)}
                          onChange={() => store.togglePageSelection(p.page)}
                          className={tw.bilibili.accentCheckbox}
                        />
                        <span
                          className={className(
                            'text-xs flex-1 truncate',
                            tw.text.secondary,
                          )}
                        >
                          P{p.page} {p.title}
                        </span>
                        <span
                          className={className('text-xs', tw.text.tertiary)}
                        >
                          {p.duration}
                        </span>
                      </label>
                    ))}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  orientation="vertical"
                  className="flex select-none touch-none p-0.5 w-2 transition-colors"
                >
                  <ScrollArea.Thumb
                    className={className(
                      "flex-1 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]",
                      tw.scrollbar.thumb,
                    )}
                  />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>
          )}

          <div className="p-4 flex gap-2 justify-end shrink-0">
            <Dialog.Close asChild>
              <button
                className={className(
                  tw.button.secondary.base,
                  tw.button.secondary.hover,
                  tw.button.secondary.transition,
                  'text-sm',
                )}
              >
                {t('cancel')}
              </button>
            </Dialog.Close>
            <button
              onClick={() => store.startDownload()}
              disabled={selectedPages.length === 0}
              className={className(
                tw.button.primary.base,
                tw.button.primary.hover,
                tw.button.primary.disabled,
                tw.button.primary.transition,
                'text-sm',
              )}
            >
              {t('download')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default VideoModal
