import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  RotateCcw,
  Maximize,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { shortcutLabel } from '../lib/util'

interface BtnProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  isDark: boolean
  active?: boolean
}

const ToolbarBtn = ({
  onClick,
  icon,
  label,
  isDark,
  active = false,
}: BtnProps) => (
  <button
    type="button"
    tabIndex={-1}
    className={active ? tw.btnActive(isDark) : tw.btn(isDark)}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
  >
    {icon}
  </button>
)

interface Props {
  isDark: boolean
  onOpenFile: () => void
  onReset: () => void
  onFullscreen: () => void
}

export default observer(function Toolbar({
  isDark,
  onOpenFile,
  onReset,
  onFullscreen,
}: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-0.5 h-9 px-2 shrink-0 ${tw.toolbar(isDark)}`}
    >
      <ToolbarBtn
        onClick={() => store.toggleSidebar()}
        icon={
          store.sidebarOpen ? (
            <PanelLeftClose size={15} />
          ) : (
            <PanelLeft size={15} />
          )
        }
        label={`${t('sidebar')}  ${shortcutLabel('B')}`}
        isDark={isDark}
        active={store.sidebarOpen}
      />
      <div className={tw.divider(isDark)} />
      <ToolbarBtn
        onClick={onOpenFile}
        icon={<FolderOpen size={15} />}
        label={`${t('openProgram')}  ${shortcutLabel('O')}`}
        isDark={isDark}
      />
      <ToolbarBtn
        onClick={onReset}
        icon={<RotateCcw size={15} />}
        label={`${t('reset')}  ${shortcutLabel('R')}`}
        isDark={isDark}
      />
      <div className="ml-auto" />
      <ToolbarBtn
        onClick={onFullscreen}
        icon={<Maximize size={15} />}
        label={`${t('fullscreen')}  ${shortcutLabel('F')}`}
        isDark={isDark}
      />
    </div>
  )
})
