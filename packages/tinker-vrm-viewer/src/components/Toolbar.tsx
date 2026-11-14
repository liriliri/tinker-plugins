import type { ReactNode } from 'react'
import { FolderOpen, Orbit, RotateCcw, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

interface ToolbarProps {
  onResetCamera: () => void
}

interface IconButtonProps {
  title: string
  onClick: () => void
  active?: boolean
  children: ReactNode
}

function IconButton({ title, onClick, active, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={active ? tw.button.iconActive : tw.button.icon}
    >
      {children}
    </button>
  )
}

const Toolbar = observer(function Toolbar({ onResetCamera }: ToolbarProps) {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'absolute bottom-3 left-0 right-0 mx-auto w-max z-10 flex items-center gap-0.5 px-1.5 py-1',
        tw.fadeIn,
        tw.chrome,
      )}
    >
      <IconButton title={t('open')} onClick={() => void store.openFileDialog()}>
        <FolderOpen className="w-3.5 h-3.5" />
      </IconButton>
      <IconButton title={t('resetCamera')} onClick={onResetCamera}>
        <RotateCcw className="w-3.5 h-3.5" />
      </IconButton>
      <IconButton
        title={t('autoRotate')}
        active={store.autoRotate}
        onClick={() => store.setAutoRotate(!store.autoRotate)}
      >
        <Orbit className="w-3.5 h-3.5" />
      </IconButton>
      <IconButton title={t('close')} onClick={() => store.clear()}>
        <X className="w-3.5 h-3.5" />
      </IconButton>
    </div>
  )
})

export default Toolbar
