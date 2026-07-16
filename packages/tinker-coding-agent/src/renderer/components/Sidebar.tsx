import type { MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare } from 'lucide-react'
import className from 'licia/className'
import splitPath from 'licia/splitPath'
import { tw } from '../theme'
import store from '../store'
import type { SessionInfo } from '../../common/types'

const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()

  const workspaceLabel = store.workspace
    ? splitPath(store.workspace).name || store.workspace
    : t('openWorkspace')

  const handleSessionContextMenu = (e: MouseEvent, session: SessionInfo) => {
    e.preventDefault()
    e.stopPropagation()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('deleteSession'),
        click: () => void store.deleteSession(session.id),
      },
    ])
  }

  return (
    <aside
      className={className(
        'w-52 shrink-0 flex flex-col border-r h-full',
        tw.background.sidebar,
        tw.border.divider,
      )}
    >
      <div
        className={className(
          'flex items-center gap-1 px-2 h-12 border-b shrink-0',
          tw.border.divider,
        )}
      >
        <button
          type="button"
          className={tw.workspace.label}
          onClick={() => store.leaveWorkspace()}
          title={t('backToWelcome')}
        >
          {workspaceLabel}
        </button>
        <button
          type="button"
          className={className(tw.button.icon, 'shrink-0')}
          onClick={() => void store.createSession()}
          title={t('newSession')}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-2 pb-2">
        <div className="flex flex-col gap-0.5">
          {store.sessions.map((session) => {
            const active = session.id === store.activeSessionId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => void store.selectSession(session.id)}
                onContextMenu={(e) => handleSessionContextMenu(e, session)}
                className={className(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-sm border-none cursor-pointer text-left text-xs transition-colors',
                  active ? tw.session.active : tw.session.item,
                )}
              >
                <MessageSquare
                  className={className(
                    'size-3.5 shrink-0',
                    active ? tw.text.accent : tw.text.muted,
                  )}
                />
                <span className="truncate">
                  {session.title || t('newSession')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
})

export default Sidebar
