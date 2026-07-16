import type { MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import className from 'licia/className'
import splitPath from 'licia/splitPath'
import { tw } from '../theme'
import store from '../store'

const Welcome = observer(function Welcome() {
  const { t } = useTranslation()

  const handleContextMenu = (e: MouseEvent, path: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('open'), click: () => void store.openRecentWorkspace(path) },
      { label: t('showInFolder'), click: () => tinker.showItemInPath(path) },
      { type: 'separator' },
      {
        label: t('removeFromRecent'),
        click: () => store.forgetRecentWorkspace(path),
      },
    ])
  }

  return (
    <div
      className={className(
        'h-screen flex items-center justify-center',
        tw.background.app,
      )}
    >
      <div className="max-w-md w-full px-8">
        <div className="mb-8 text-center">
          <h1
            className={className(
              'text-3xl font-semibold tracking-tight mb-2',
              tw.text.primary,
            )}
          >
            {t('welcomeTitle')}
          </h1>
          <p className={className('text-sm', tw.text.secondary)}>
            {t('welcomeDescription')}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <button
            type="button"
            onClick={() => void store.openWorkspace()}
            className={className(
              'w-full flex items-center gap-3 px-4 py-3 rounded-md border transition-colors cursor-pointer',
              tw.background.welcomeAction,
              tw.border.divider,
            )}
          >
            <span className={tw.text.accent}>
              <FolderOpen size={20} />
            </span>
            <span className={className('font-medium', tw.text.primary)}>
              {t('openWorkspace')}
            </span>
          </button>
        </div>

        {store.recentWorkspaces.length > 0 && (
          <div
            className={className(
              'border rounded-md overflow-hidden',
              tw.border.divider,
            )}
          >
            {store.recentWorkspaces.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => void store.openRecentWorkspace(path)}
                onContextMenu={(e) => handleContextMenu(e, path)}
                className={className(
                  'w-full text-left px-3 py-2.5 border-none cursor-pointer transition-colors',
                  tw.background.welcomeRecent,
                )}
              >
                <div
                  className={className('text-sm font-medium', tw.text.primary)}
                >
                  {splitPath(path).name || path}
                </div>
                <div
                  className={className(
                    'text-xs mt-0.5 truncate font-mono',
                    tw.text.tertiary,
                  )}
                >
                  {path}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default Welcome
