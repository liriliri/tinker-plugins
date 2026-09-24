import className from 'licia/className'
import { Play } from 'lucide-react'
import { tw } from '../theme'

interface PreviewButtonProps {
  onClick: (e: React.MouseEvent) => void
}

function PreviewButton({ onClick }: PreviewButtonProps) {
  return (
    <button
      type="button"
      className={className(
        'group/play relative w-8 h-8 rounded flex items-center justify-center',
        'transition-all duration-200',
        tw.text.icon,
        tw.accent.hoverText,
        tw.accent.hoverBg,
        'active:scale-90',
      )}
      onClick={onClick}
    >
      <Play size={14} fill="currentColor" />
    </button>
  )
}

export default PreviewButton
