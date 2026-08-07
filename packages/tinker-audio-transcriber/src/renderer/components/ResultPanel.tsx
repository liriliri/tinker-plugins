import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AudioLines, FolderOpen } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatTimestamp, stripSubtitleDisplayPunctuation } from '../lib/format'
import PanelActions from './PanelActions'
import AppScrollArea from './AppScrollArea'

function scrollViewport(el: HTMLDivElement | null, toBottom: boolean) {
  if (!el) return
  el.scrollTop = toBottom ? el.scrollHeight : 0
}

const ResultPanel = observer(() => {
  const { t } = useTranslation()
  const transcriptRef = useRef<HTMLDivElement>(null)
  const segmentsRef = useRef<HTMLDivElement>(null)
  const segmentCount = store.result?.segments.length ?? 0

  useEffect(() => {
    const toBottom = store.isTranscribing
    const sync = () => {
      scrollViewport(transcriptRef.current, toBottom)
      scrollViewport(segmentsRef.current, toBottom)
    }
    sync()
    const id = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(id)
  }, [store.isTranscribing, store.text, segmentCount])

  if (!store.sourceName && !store.isTranscribing && !store.result) {
    return (
      <div className={className('flex-1 min-h-0 flex', tw.background.app)}>
        <button
          type="button"
          onClick={() => store.openFile()}
          className={className(
            'group flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-4 border-none cursor-pointer transition-colors duration-200',
            tw.empty.zoneFill,
          )}
        >
          <div
            className={className(
              'relative flex items-center justify-center w-16 h-16 rounded-2xl border',
              tw.empty.ring,
              tw.background.surface,
            )}
          >
            <AudioLines
              className={className(
                'w-7 h-7 transition-colors duration-200',
                tw.empty.icon,
                tw.empty.iconHover,
              )}
              strokeWidth={1.5}
            />
            <span
              className={className(
                'absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full border',
                tw.background.panel,
                tw.border.color,
              )}
            >
              <FolderOpen className={className('w-3 h-3', tw.text.accent)} />
            </span>
          </div>
          <div className="text-center space-y-1.5">
            <div
              className={className(
                'text-sm font-semibold tracking-tight',
                tw.text.primary,
              )}
            >
              {t('dropHint')}
            </div>
            <div
              className={className('text-xs leading-relaxed', tw.text.muted)}
            >
              {store.isDragging ? t('dropRelease') : t('dropSubHint')}
            </div>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div
      className={className('flex-1 min-h-0 flex flex-col', tw.background.app)}
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2">
        <section
          className={className(
            'min-h-0 flex flex-col border-b md:border-b-0 md:border-r',
            tw.background.panel,
            tw.border.color,
          )}
        >
          <header
            className={className(
              'flex items-center justify-between h-8 px-3 border-b shrink-0',
              tw.background.panelHeader,
              tw.border.soft,
            )}
          >
            <span
              className={className(
                'text-[10px] font-semibold uppercase tracking-wider',
                tw.text.label,
              )}
            >
              {t('transcript')}
            </span>
            <PanelActions
              disabled={!store.text}
              onCopy={() => store.copyText()}
              onSave={() => store.saveText()}
            />
          </header>
          <AppScrollArea ref={transcriptRef} viewportClassName="px-4 py-3">
            {store.text ? (
              <pre
                className={className(
                  'whitespace-pre-wrap text-[13px] leading-6 font-sans animate-fade-up',
                  tw.text.primary,
                )}
              >
                {store.text}
              </pre>
            ) : (
              <div className={className('text-xs', tw.text.muted)}>
                {t('placeholder')}
              </div>
            )}
          </AppScrollArea>
        </section>

        <section
          className={className('min-h-0 flex flex-col', tw.background.panel)}
        >
          <header
            className={className(
              'flex items-center justify-between gap-2 h-8 px-3 border-b shrink-0',
              tw.background.panelHeader,
              tw.border.soft,
            )}
          >
            <span
              className={className(
                'text-[10px] font-semibold uppercase tracking-wider',
                tw.text.label,
              )}
            >
              {t('segments')}
            </span>
            <PanelActions
              disabled={!store.srtText}
              onCopy={() => store.copySrt()}
              onSave={() => store.saveSrt()}
            />
          </header>
          <AppScrollArea ref={segmentsRef}>
            {store.result?.segments.length ? (
              store.result.segments.map((segment, index) => (
                <div
                  key={`${segment.start}-${index}`}
                  className={className(
                    'px-3 py-1.5 border-b transition-colors duration-150',
                    tw.border.soft,
                    tw.background.segmentHover,
                  )}
                >
                  <div
                    className={className(
                      'text-[10px] font-medium tabular-nums tracking-wide mb-0.5',
                      tw.text.time,
                    )}
                  >
                    {formatTimestamp(segment.start)}
                    <span className={className('mx-1 opacity-40')}>–</span>
                    {formatTimestamp(segment.end)}
                  </div>
                  <div
                    className={className(
                      'text-[12px] leading-4',
                      tw.text.primary,
                    )}
                  >
                    {stripSubtitleDisplayPunctuation(
                      segment.text,
                      segment.lang,
                      segment.family,
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={className('px-3 py-4 text-xs', tw.text.muted)}>
                {t('segmentsEmpty')}
              </div>
            )}
          </AppScrollArea>
        </section>
      </div>
    </div>
  )
})

export default ResultPanel
