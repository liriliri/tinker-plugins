import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare } from 'lucide-react'
import className from 'licia/className'
import splitPath from 'licia/splitPath'
import { tw } from '../theme'
import type { SessionInfo } from '../../common/types'

export default function Sidebar() {
  const { t } = useTranslation()
  const [workspace, setWorkspace] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  useEffect(() => {
    codingAgent.getWorkspace().then(setWorkspace)
    codingAgent.getSessions().then(setSessions)
    codingAgent.getActiveSessionId().then(setActiveSessionId)

    return codingAgent.onEvent((event) => {
      if (event.type === 'workspace') setWorkspace(event.cwd)
      if (event.type === 'sessions') {
        setSessions(event.sessions)
        setActiveSessionId(event.activeSessionId)
      }
    })
  }, [])

  const workspaceLabel = workspace
    ? splitPath(workspace).name || workspace
    : t('openWorkspace')

  const handleSessionContextMenu = (e: MouseEvent, session: SessionInfo) => {
    e.preventDefault()
    e.stopPropagation()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('deleteSession'),
        click: () => void codingAgent.deleteSession(session.id),
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
          onClick={() => codingAgent.leaveWorkspace()}
          title={t('backToWelcome')}
        >
          {workspaceLabel}
        </button>
        <button
          type="button"
          className={className(tw.button.icon, 'shrink-0')}
          onClick={() => void codingAgent.createSession()}
          title={t('newSession')}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-2 pb-2">
        <div className="flex flex-col gap-0.5">
          {sessions.map((session) => {
            const active = session.id === activeSessionId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => void codingAgent.selectSession(session.id)}
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
}
