import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Settings, Cookie, Link2, Loader2 } from 'lucide-react'
import className from 'licia/className'
import trim from 'licia/trim'
import store from '../store'
import { tw } from '../theme'

const Header = observer(() => {
  const { t } = useTranslation()
  const { loading } = store

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void store.parseUrl()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Link2
          size={14}
          className={className(
            'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
            tw.text.tertiary,
          )}
        />
        <input
          type="text"
          value={store.urlInput}
          onChange={(e) => store.setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('urlPlaceholder')}
          className={className(tw.input.base, tw.input.focus, 'pl-8')}
        />
      </div>
      <button
        onClick={() => void store.parseUrl()}
        disabled={loading || !trim(store.urlInput)}
        className={className(
          tw.button.primary.base,
          tw.button.primary.hover,
          tw.button.primary.disabled,
          tw.button.primary.transition,
          'whitespace-nowrap flex items-center gap-1.5',
        )}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>{t('parseUrl')}</span>
          </>
        ) : (
          t('parseUrl')
        )}
      </button>
      <button
        onClick={() => store.setShowCookies(true)}
        className={className(
          tw.button.secondary.base,
          tw.button.secondary.hover,
          tw.button.secondary.transition,
          'px-2.5',
        )}
        title={t('cookies')}
      >
        <Cookie size={16} />
      </button>
      <button
        onClick={() => store.setShowSettings(true)}
        className={className(
          tw.button.secondary.base,
          tw.button.secondary.hover,
          tw.button.secondary.transition,
          'px-2.5',
        )}
        title={t('settings')}
      >
        <Settings size={16} />
      </button>
    </div>
  )
})

export default Header
