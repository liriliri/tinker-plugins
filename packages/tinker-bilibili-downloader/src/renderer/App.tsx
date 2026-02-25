import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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
      {/* URL input bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={store.urlInput}
          onChange={(e) => store.setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('urlPlaceholder')}
          className={className(tw.input.base, tw.input.focus, 'flex-1')}
        />
        <button
          onClick={() => store.parseUrl()}
          disabled={loading || !store.urlInput.trim()}
          className={className(
            tw.button.primary.base,
            tw.button.primary.hover,
            tw.button.primary.disabled,
            tw.button.primary.transition,
            'text-sm whitespace-nowrap',
          )}
        >
          {loading ? '...' : t('parseUrl')}
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
          ⚙
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 flex flex-col min-h-0">
        <TaskList />
      </div>

      {/* Modals */}
      {showVideoModal && <VideoModal />}
      {showSettings && <SettingsPanel />}
    </div>
  )
})

export default App
