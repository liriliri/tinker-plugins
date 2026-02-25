import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={className(
          tw.background.card,
          tw.border.card,
          'rounded-xl w-[520px] max-h-[80vh] flex flex-col shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex gap-3">
          <img
            src={videoInfo.cover}
            alt="cover"
            className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div
              className={className(
                'font-semibold text-sm leading-snug line-clamp-2',
                tw.text.primary,
              )}
            >
              {videoInfo.title}
            </div>
            <div className={className('text-xs mt-1', tw.text.tertiary)}>
              {t('up')}: {videoInfo.up.map((u) => u.name).join(', ')}
            </div>
            <div className={className('text-xs mt-0.5', tw.text.tertiary)}>
              {t('duration')}: {videoInfo.duration}
            </div>
          </div>
        </div>

        {/* Quality selection */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div
            className={className('text-xs font-medium mb-2', tw.text.secondary)}
          >
            {t('quality')}
          </div>
          <div className="flex flex-wrap gap-2">
            {videoInfo.qualityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => store.setSelectedQuality(opt.value)}
                className={className(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  selectedQuality === opt.value
                    ? 'bg-gradient-to-r ' +
                        tw.bilibili.accentGradient +
                        ' text-white'
                    : className(
                        tw.background.card,
                        tw.border.card,
                        tw.text.secondary,
                        tw.background.hover,
                      ),
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pages selection (multi-page) */}
        {isMultiPage && (
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div
                className={className('text-xs font-medium', tw.text.secondary)}
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
                  'text-xs px-2 py-0.5 rounded',
                  tw.bilibili.accent,
                  'hover:underline',
                )}
              >
                {allSelected ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            <div className="space-y-1">
              {videoInfo.page.map((p) => (
                <label
                  key={p.page}
                  className={className(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer',
                    tw.background.hover,
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(p.page)}
                    onChange={() => store.togglePageSelection(p.page)}
                    className="accent-pink-500"
                  />
                  <span
                    className={className(
                      'text-xs flex-1 truncate',
                      tw.text.secondary,
                    )}
                  >
                    P{p.page} {p.title}
                  </span>
                  <span className={className('text-xs', tw.text.tertiary)}>
                    {p.duration}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-2 justify-end">
          <button
            onClick={() => store.setShowVideoModal(false)}
            className={className(
              tw.button.secondary.base,
              tw.button.secondary.hover,
              tw.button.secondary.transition,
              'text-sm',
            )}
          >
            {t('cancel')}
          </button>
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
      </div>
    </div>
  )
})

export default VideoModal
