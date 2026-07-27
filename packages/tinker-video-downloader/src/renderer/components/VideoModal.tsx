import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatDuration, formatFileSize } from '../lib/util'

const VideoModal = observer(() => {
  const { t } = useTranslation()
  const { videoInfo, selectedFormat } = store

  if (!videoInfo) return null

  return (
    <Dialog.Root open onOpenChange={() => store.setShowVideoModal(false)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={className('fixed inset-0 z-50', tw.overlay)}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className={className(
              'w-[520px] max-w-full max-h-[90vh] flex flex-col',
              tw.modal.shell,
              tw.background.card,
            )}
            aria-describedby={undefined}
          >
            <div
              className={className(
                'relative h-36 flex-shrink-0',
                tw.cover.placeholder,
              )}
            >
              {videoInfo.thumbnail ? (
                <img
                  src={videoInfo.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div
                className={className('absolute inset-0', tw.cover.gradient)}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Dialog.Title
                  className={className(
                    'font-semibold text-sm leading-snug line-clamp-2',
                    tw.cover.title,
                  )}
                >
                  {videoInfo.title}
                </Dialog.Title>
                <div
                  className={className(
                    'flex items-center gap-2 mt-1.5 font-mono text-[11px] tabular-nums',
                    tw.cover.meta,
                  )}
                >
                  {videoInfo.uploader && (
                    <>
                      <span
                        className={className(
                          'truncate font-sans',
                          tw.cover.metaMuted,
                        )}
                      >
                        {videoInfo.uploader}
                      </span>
                      <span className={tw.cover.metaSep}>·</span>
                    </>
                  )}
                  {videoInfo.duration > 0 && (
                    <span className="flex-shrink-0">
                      {formatDuration(videoInfo.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              className={className(
                'p-4 border-b flex-1 min-h-0 flex flex-col overflow-hidden',
                tw.border.divider,
              )}
            >
              <div className={className(tw.label.section, 'mb-2.5 shrink-0')}>
                {t('formats')} · {videoInfo.formats.length}
              </div>
              <ScrollArea.Root className="flex-1 min-h-0 overflow-hidden max-h-56">
                <ScrollArea.Viewport className="h-full w-full">
                  <div className="grid grid-cols-2 gap-1.5 pr-2">
                    {videoInfo.formats.map((format) => {
                      const active =
                        selectedFormat?.formatId === format.formatId
                      return (
                        <button
                          key={format.formatId}
                          onClick={() => store.setSelectedFormat(format)}
                          className={className(
                            'flex items-center justify-between px-2.5 py-2 rounded-sm text-left transition-colors duration-150 border',
                            active
                              ? tw.format.active
                              : className(
                                  tw.format.inactive,
                                  tw.background.hover,
                                ),
                          )}
                        >
                          <span
                            className={className(
                              'text-xs font-semibold font-mono tabular-nums',
                              tw.text.primary,
                            )}
                          >
                            {format.quality}
                          </span>
                          <span
                            className={className(
                              'text-[10px] font-mono tabular-nums',
                              tw.text.tertiary,
                            )}
                          >
                            {format.filesize
                              ? formatFileSize(format.filesize)
                              : t('unknownSize')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  orientation="vertical"
                  className="flex select-none touch-none p-0.5 w-1.5 transition-colors"
                >
                  <ScrollArea.Thumb
                    className={className(
                      "flex-1 rounded-sm relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]",
                      tw.scrollbar.thumb,
                    )}
                  />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>

            <div className="p-3 flex gap-2 justify-end shrink-0">
              <Dialog.Close asChild>
                <button
                  className={className(
                    tw.button.secondary.base,
                    tw.button.secondary.hover,
                    tw.button.secondary.transition,
                  )}
                >
                  {t('cancel')}
                </button>
              </Dialog.Close>
              <button
                onClick={() => void store.startDownload()}
                disabled={!selectedFormat}
                className={className(
                  tw.button.primary.base,
                  tw.button.primary.hover,
                  tw.button.primary.disabled,
                  tw.button.primary.transition,
                )}
              >
                {t('download')}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default VideoModal
