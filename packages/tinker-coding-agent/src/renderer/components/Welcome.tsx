import { useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import className from 'licia/className'
import splitPath from 'licia/splitPath'
import { tw } from '../theme'
import {
  addRecentWorkspace,
  getRecentWorkspaces,
  removeRecentWorkspace,
} from '../lib/recentWorkspaces'

interface WelcomeProps {
  onError: (message: string) => void
}

export default function Welcome({ onError }: WelcomeProps) {
  const { t } = useTranslation()
  const [recentWorkspaces, setRecentWorkspaces] = useState(getRecentWorkspaces)

  const rememberWorkspace = (path: string) => {
    setRecentWorkspaces(addRecentWorkspace(path))
  }

  const handleOpenWorkspace = async () => {
    const path = await codingAgent.openWorkspace()
    if (path) rememberWorkspace(path)
  }

  const handleOpenRecent = async (path: string) => {
    try {
      const stats = await tinker.fstat(path)
      if (!stats.isDirectory) throw new Error('not a directory')
    } catch {
      setRecentWorkspaces(removeRecentWorkspace(path))
      onError(t('folderNotFound'))
      return
    }

    try {
      await codingAgent.setWorkspace(path)
      rememberWorkspace(path)
    } catch {
      // Host already emits the error event for toast display.
    }
  }

  const handleContextMenu = (e: MouseEvent, path: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('open'), click: () => void handleOpenRecent(path) },
      { label: t('showInFolder'), click: () => tinker.showItemInPath(path) },
      { type: 'separator' },
      {
        label: t('removeFromRecent'),
        click: () => setRecentWorkspaces(removeRecentWorkspace(path)),
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
            onClick={() => void handleOpenWorkspace()}
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

        {recentWorkspaces.length > 0 && (
          <div
            className={className(
              'border rounded-md overflow-hidden',
              tw.border.divider,
            )}
          >
            {recentWorkspaces.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => void handleOpenRecent(path)}
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
}
