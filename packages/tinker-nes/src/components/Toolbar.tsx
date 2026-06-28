import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Keyboard,
  Save,
  History,
  Gamepad2,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import ToolbarSearch, { type ToolbarSearchDropdownItem } from './ToolbarSearch'

interface BtnProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  isDark: boolean
}

const ToolbarBtn = ({
  onClick,
  icon,
  label,
  isDark,
  active = false,
}: BtnProps & { active?: boolean }) => (
  <button
    className={active ? tw.btnActive(isDark) : tw.btn(isDark)}
    onClick={onClick}
    title={label}
  >
    {icon}
  </button>
)

interface Props {
  isDark: boolean
  romLoaded: boolean
  isPaused: boolean
  isMuted: boolean
  onOpenFile: () => void
  onLoadRomPath: (filePath: string) => void
  onTogglePause: () => void
  onReset: () => void
  onToggleMute: () => void
  onSaveState: () => void
  onLoadState: () => void
  onFullscreen: () => void
  onOpenKeymap: () => void
}

export default observer(function Toolbar({
  isDark,
  romLoaded,
  isPaused,
  isMuted,
  onOpenFile,
  onLoadRomPath,
  onTogglePause,
  onReset,
  onToggleMute,
  onSaveState,
  onLoadState,
  onFullscreen,
  onOpenKeymap,
}: Props) {
  const { t } = useTranslation()

  const dropdownItems: ToolbarSearchDropdownItem[] =
    store.fileSearchResults.map((r) => ({
      id: r.path,
      label: r.name,
      description: r.path,
      icon: <Gamepad2 size={12} />,
    }))

  const handleDropdownSelect = (item: ToolbarSearchDropdownItem) => {
    onLoadRomPath(item.id)
    store.clearSearch()
  }

  return (
    <div
      className={`flex items-center gap-0.5 px-2 py-1 shrink-0 border-b ${tw.toolbar(isDark)}`}
    >
      <ToolbarBtn
        onClick={() => store.toggleSidebar()}
        icon={
          store.sidebarOpen ? (
            <PanelLeftClose size={13} />
          ) : (
            <PanelLeftOpen size={13} />
          )
        }
        label={t('sidebar')}
        isDark={isDark}
        active={store.sidebarOpen}
      />
      <ToolbarBtn
        onClick={onOpenFile}
        icon={<FolderOpen size={13} />}
        label={t('openRom')}
        isDark={isDark}
      />
      <ToolbarSearch
        isDark={isDark}
        value={store.searchQuery}
        onChange={(val) => store.setSearchQuery(val)}
        placeholder={t('search')}
        dropdownItems={dropdownItems.length > 0 ? dropdownItems : undefined}
        onDropdownSelect={handleDropdownSelect}
      />
      {romLoaded && (
        <>
          <ToolbarBtn
            onClick={onTogglePause}
            icon={isPaused ? <Play size={13} /> : <Pause size={13} />}
            label={isPaused ? t('resume') : t('pause')}
            isDark={isDark}
          />
          <ToolbarBtn
            onClick={onReset}
            icon={<RotateCcw size={13} />}
            label={t('reset')}
            isDark={isDark}
          />
          <ToolbarBtn
            onClick={onToggleMute}
            icon={isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            label={isMuted ? t('unmute') : t('mute')}
            isDark={isDark}
          />
          <div className={tw.divider(isDark)} />
          <ToolbarBtn
            onClick={onSaveState}
            icon={<Save size={13} />}
            label={t('saveState')}
            isDark={isDark}
          />
          <ToolbarBtn
            onClick={onLoadState}
            icon={<History size={13} />}
            label={t('loadState')}
            isDark={isDark}
          />
        </>
      )}
      <div className="ml-auto" />
      <ToolbarBtn
        onClick={onOpenKeymap}
        icon={<Keyboard size={13} />}
        label={t('keymap')}
        isDark={isDark}
      />
      <ToolbarBtn
        onClick={onFullscreen}
        icon={<Maximize size={13} />}
        label={t('fullscreen')}
        isDark={isDark}
      />
    </div>
  )
})
