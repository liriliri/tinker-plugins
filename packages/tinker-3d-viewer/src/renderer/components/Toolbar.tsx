import className from 'licia/className'
import fullscreen from 'licia/fullscreen'
import {
  FolderOpen,
  Layers,
  Maximize,
  Orbit,
  Pause,
  PersonStanding,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react'
import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as Tooltip from '@radix-ui/react-tooltip'
import store from '../store'
import { tw } from '../theme'

interface ToolbarProps {
  onResetCamera: () => void
  hasAnimation: boolean
}

interface IconButtonProps {
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
}

function IconButton({
  title,
  onClick,
  active,
  disabled,
  children,
}: IconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          title={title}
          onClick={onClick}
          disabled={disabled}
          className={active ? tw.button.iconActive : tw.button.icon}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={tw.tooltip} sideOffset={6} side="top">
          {title}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

const Toolbar = observer(function Toolbar({
  onResetCamera,
  hasAnimation,
}: ToolbarProps) {
  const { t } = useTranslation()
  const isFirstPerson = store.viewMode === 'firstPerson'

  return (
    <Tooltip.Provider delayDuration={400}>
      <div
        className={className(
          'absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 px-1.5 py-1 rounded-md border shadow-sm',
          tw.background.toolbar,
          tw.border.divider,
        )}
      >
        <IconButton title={t('open')} onClick={() => void store.openFiles()}>
          <FolderOpen className="w-3.5 h-3.5" />
        </IconButton>

        <IconButton
          title={t('save')}
          disabled={!store.canSave || store.isSaving}
          onClick={() => void store.saveModel()}
        >
          <Save className="w-3.5 h-3.5" />
        </IconButton>

        <IconButton
          title={isFirstPerson ? t('orbitView') : t('firstPersonView')}
          onClick={() => store.toggleViewMode()}
        >
          {isFirstPerson ? (
            <Orbit className="w-3.5 h-3.5" />
          ) : (
            <PersonStanding className="w-3.5 h-3.5" />
          )}
        </IconButton>

        <IconButton
          title={t('inspector')}
          active={store.inspectorOpen}
          onClick={() => store.toggleInspector()}
        >
          <Layers className="w-3.5 h-3.5" />
        </IconButton>

        <IconButton
          title={t('autoRotate')}
          active={store.autoRotate}
          disabled={isFirstPerson}
          onClick={() => store.setAutoRotate(!store.autoRotate)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </IconButton>

        {hasAnimation && (
          <IconButton
            title={t('autoPlay')}
            active={store.autoPlay}
            onClick={() => store.setAutoPlay(!store.autoPlay)}
          >
            {store.autoPlay ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </IconButton>
        )}

        <IconButton title={t('resetCamera')} onClick={onResetCamera}>
          <RotateCcw className="w-3.5 h-3.5" />
        </IconButton>

        <IconButton title={t('fullscreen')} onClick={() => fullscreen.toggle()}>
          <Maximize className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </Tooltip.Provider>
  )
})

export default Toolbar
