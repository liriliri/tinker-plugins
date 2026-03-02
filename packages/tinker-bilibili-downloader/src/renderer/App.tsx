import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Settings, Link2, Loader2 } from 'lucide-react'
import className from 'licia/className'
import store from './store'
import { tw } from './theme'
import VideoModal from './components/VideoModal'
import TaskList from './components/TaskList'
import SettingsPanel from './components/SettingsPanel'

const App = observer(() => {
  const { t } = useTranslation()
  const { loading, showVideoModal, showSettings } = store

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      store.parseUrl()
    }
  }

  return (
    <div
      className={className(
        'min-h-screen flex flex-col py-3 px-4',
        tw.background.primary,
      )}
    >
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Link2
            size={14}
            className={className(
              'absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none',
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
          onClick={() => store.parseUrl()}
          disabled={loading || !store.urlInput.trim()}
          className={className(
            tw.button.primary.base,
            tw.button.primary.hover,
            tw.button.primary.disabled,
            tw.button.primary.transition,
            'text-sm whitespace-nowrap flex items-center gap-1.5',
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
          onClick={() => store.setShowSettings(true)}
          className={className(
            tw.button.secondary.base,
            tw.button.secondary.hover,
            tw.button.secondary.transition,
            'text-sm',
          )}
          title={t('settings')}
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <TaskList />
      </div>

      {showVideoModal && <VideoModal />}
      {showSettings && <SettingsPanel />}
    </div>
  )
})

export default App
