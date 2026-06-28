import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Gamepad2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

interface Props {
  onSelect: (filePath: string) => void
}

export default observer(function Sidebar({ onSelect }: Props) {
  const { t } = useTranslation()
  const { isDark, playHistory, currentRomPath } = store

  return (
    <aside className={`${tw.sidebar(isDark)} flex flex-col min-h-0`}>
      {playHistory.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className={tw.sidebarEmpty(isDark)}>{t('emptyHistory')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {playHistory.map((item) => (
            <button
              key={item.path}
              className={tw.sidebarItem(isDark, item.path === currentRomPath)}
              onClick={() => onSelect(item.path)}
              title={item.path}
            >
              <Gamepad2 size={12} className={tw.sidebarItemIcon(isDark)} />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  )
})
