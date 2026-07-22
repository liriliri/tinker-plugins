import { observer } from 'mobx-react-lite'
import { Play, Square, Eraser, FolderOpen, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

interface IconButtonProps {
  title: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function IconButton({ title, disabled, onClick, children }: IconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          title={title}
          disabled={disabled}
          onClick={onClick}
          className={tw.button.icon}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={tw.tooltip} sideOffset={4}>
          {title}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const running = Boolean(store.avd?.pid)

  return (
    <Tooltip.Provider delayDuration={500}>
      <div
        className={className(
          'flex items-center gap-1.5 px-2 h-8 border-b shrink-0',
          tw.background.toolbar,
          tw.border.divider,
        )}
      >
        <input
          className={className('flex-1 min-w-0', tw.input)}
          placeholder={t('filterPlaceholder')}
          value={store.filter}
          onChange={(e) => store.setFilter(e.target.value)}
        />

        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            title={t(running ? 'stop' : 'start')}
            disabled={!store.avd}
            onClick={() => store.toggleSelected()}
          >
            {running ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </IconButton>

          <IconButton
            title={t('wipeData')}
            disabled={!store.avd}
            onClick={() => store.openWipeDialog()}
          >
            <Eraser className="w-3.5 h-3.5" />
          </IconButton>

          <IconButton
            title={t('openDir')}
            disabled={!store.avd}
            onClick={() => store.openFolder()}
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </IconButton>

          <div className={className('w-px h-4 mx-0.5', tw.border.separator)} />

          <IconButton
            title={t('refresh')}
            onClick={() => store.refreshAvds(true)}
          >
            <RotateCw
              className={className(
                'w-3.5 h-3.5',
                store.isLoading && 'animate-spin',
              )}
            />
          </IconButton>
        </div>
      </div>
    </Tooltip.Provider>
  )
})

export default Toolbar
