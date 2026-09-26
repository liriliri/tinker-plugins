import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import toNum from 'licia/toNum'
import { useTranslation } from 'react-i18next'
import { PictureInPicture2, X } from 'lucide-react'
import { tw } from '../theme'
import store, { MAX_FLOAT_SCALE, MIN_FLOAT_SCALE } from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const fillPct =
    ((store.floatScale - MIN_FLOAT_SCALE) /
      (MAX_FLOAT_SCALE - MIN_FLOAT_SCALE)) *
    100

  return (
    <header className={tw.bar}>
      <div className="flex items-center gap-3 h-12 pl-4 pr-6">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={className(
                'relative size-1.5 shrink-0 rounded-full',
                store.drumming ? tw.ledLive : tw.ledIdle,
              )}
              aria-hidden
            >
              {store.drumming ? (
                <span
                  className={className(
                    'absolute inset-0 rounded-full animate-tap-pulse',
                    tw.ledLive,
                  )}
                />
              ) : null}
            </span>
            <h1 className={className('truncate', tw.brand)}>{t('title')}</h1>
          </div>
          <p
            className={className(
              'pl-3.5 text-[9px] tracking-[0.14em] uppercase',
              tw.muted,
            )}
          >
            {store.drumming ? t('statusLive') : t('statusIdle')}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className={tw.tray}>
            <label className="flex items-center gap-2">
              <span className={tw.trayLabel}>{t('floatScale')}</span>
              <span className="bongo-slider-wrap">
                <span className="bongo-slider-track" aria-hidden />
                <span
                  className="bongo-slider-fill"
                  style={{ width: `${fillPct}%` }}
                  aria-hidden
                />
                <input
                  type="range"
                  min={MIN_FLOAT_SCALE}
                  max={MAX_FLOAT_SCALE}
                  step={0.05}
                  value={store.floatScale}
                  onChange={(e) => store.setFloatScale(toNum(e.target.value))}
                  className="bongo-slider"
                  aria-label={t('floatScale')}
                />
              </span>
              <span className={tw.trayValue}>
                {Math.round(store.floatScale * 100)}%
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => store.toggleFloat()}
            className={className(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-[transform,filter,box-shadow] shrink-0',
              store.floating ? tw.keycapActive : tw.keycap,
            )}
          >
            {store.floating ? (
              <X className="w-3.5 h-3.5" strokeWidth={2.25} />
            ) : (
              <PictureInPicture2 className="w-3.5 h-3.5" strokeWidth={2.25} />
            )}
            {store.floating ? t('closeFloat') : t('openFloat')}
          </button>
        </div>
      </div>
    </header>
  )
})
