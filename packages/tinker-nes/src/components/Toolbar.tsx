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
} from 'lucide-react'
import { tw } from '../theme'

interface BtnProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  isDark: boolean
}

const ToolbarBtn = ({ onClick, icon, label, isDark }: BtnProps) => (
  <button className={tw.btn(isDark)} onClick={onClick} title={label}>
    {icon}
  </button>
)

interface Props {
  isDark: boolean
  romLoaded: boolean
  isPaused: boolean
  isMuted: boolean
  onOpenFile: () => void
  onTogglePause: () => void
  onReset: () => void
  onToggleMute: () => void
  onSaveState: () => void
  onLoadState: () => void
  onFullscreen: () => void
  onOpenKeymap: () => void
}

export default function Toolbar({
  isDark,
  romLoaded,
  isPaused,
  isMuted,
  onOpenFile,
  onTogglePause,
  onReset,
  onToggleMute,
  onSaveState,
  onLoadState,
  onFullscreen,
  onOpenKeymap,
}: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-0.5 px-2 py-1 shrink-0 border-b ${tw.toolbar(isDark)}`}
    >
      <ToolbarBtn
        onClick={onOpenFile}
        icon={<FolderOpen size={13} />}
        label={t('openRom')}
        isDark={isDark}
      />
      {romLoaded && (
        <>
          <div className={tw.divider(isDark)} />
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
}
