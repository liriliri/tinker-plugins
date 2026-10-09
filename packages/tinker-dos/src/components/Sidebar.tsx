import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FileTerminal, Inbox, X } from 'lucide-react'
import className from 'licia/className'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'
import type { PlayHistoryItem } from '../types'

interface Props {
  onSelect: (filePath: string) => void
}

export default observer(function Sidebar({ onSelect }: Props) {
  const { t } = useTranslation()
  const { playHistory } = store

  const showMenu = (e: React.MouseEvent, item: PlayHistoryItem) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('run'), click: () => onSelect(item.path) },
      {
        label: t('showInFolder'),
        click: () => tinker.showItemInPath(item.path),
      },
      { type: 'separator' },
      {
        label: t('deleteHistory'),
        click: () => store.removeFromPlayHistory(item.path),
      },
    ])
  }

  return (
    <aside className={className(tw.sidebar, 'min-h-0')}>
      {playHistory.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Inbox size={28} className={tw.sidebarEmptyIcon} />
          <p className={tw.sidebarEmpty}>{t('emptyHistory')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {map(playHistory, (item) => (
            <div
              key={item.path}
              className={tw.sidebarItem}
              onContextMenu={(e) => showMenu(e, item)}
            >
              <FileTerminal size={12} className={tw.sidebarItemIcon} />
              <button
                type="button"
                tabIndex={-1}
                className={tw.sidebarItemBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(item.path)}
                title={item.path}
              >
                {item.name}
              </button>
              <button
                type="button"
                tabIndex={-1}
                className={tw.sidebarDeleteBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => store.removeFromPlayHistory(item.path)}
                title={t('deleteHistory')}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
})
