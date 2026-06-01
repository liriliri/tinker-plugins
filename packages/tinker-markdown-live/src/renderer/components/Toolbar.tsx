import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  SquarePen,
} from 'lucide-react'
import { tw } from '../theme'

interface ToolbarProps {
  fileName: string
  fileTreeOpen: boolean
  onNew: () => void
  onOpenFolder: () => void
  onSave: () => void
  onToggleFileTree: () => void
}

export default function Toolbar({
  fileName,
  fileTreeOpen,
  onNew,
  onOpenFolder,
  onSave,
  onToggleFileTree,
}: ToolbarProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`flex h-10 shrink-0 items-center gap-0.5 border-b px-2 ${tw.toolbar.border} ${tw.toolbar.bg}`}
    >
      <button
        onClick={onToggleFileTree}
        className={tw.toolbarBtn.icon}
        aria-label={fileTreeOpen ? t('hideFileTree') : t('showFileTree')}
      >
        {fileTreeOpen ? (
          <PanelLeftClose aria-hidden="true" size={15} />
        ) : (
          <PanelLeftOpen aria-hidden="true" size={15} />
        )}
      </button>
      <button
        onClick={onNew}
        className={tw.toolbarBtn.icon}
        aria-label={t('new')}
      >
        <SquarePen aria-hidden="true" size={15} />
      </button>
      <button
        onClick={onOpenFolder}
        className={tw.toolbarBtn.icon}
        aria-label={t('openFolder')}
      >
        <FolderOpen aria-hidden="true" size={15} />
      </button>
      <button
        onClick={onSave}
        className={tw.toolbarBtn.icon}
        aria-label={t('save')}
      >
        <Save aria-hidden="true" size={15} />
      </button>
      <span
        className={`ml-auto min-w-0 truncate px-2 ${tw.toolbar.title}`}
        title={fileName || t('untitled')}
      >
        {fileName || t('untitled')}
      </span>
    </div>
  )
}
