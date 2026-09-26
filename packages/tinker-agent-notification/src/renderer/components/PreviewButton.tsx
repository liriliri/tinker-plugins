import className from 'licia/className'
import { Play } from 'lucide-react'
import IconButton from './IconButton'

interface PreviewButtonProps {
  onClick: () => void
}

function PreviewButton({ onClick }: PreviewButtonProps) {
  return (
    <IconButton onClick={onClick}>
      <Play size={14} fill="currentColor" />
    </IconButton>
  )
}

export default PreviewButton
