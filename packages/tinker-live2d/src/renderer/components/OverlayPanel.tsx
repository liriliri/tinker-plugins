import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { tw } from '../theme'
import AppScrollArea from './AppScrollArea'

interface OverlayPanelProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function OverlayPanel({
  title,
  onClose,
  children,
}: OverlayPanelProps) {
  return (
    <div
      data-overlay
      className={`${tw.overlay.backdrop} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${tw.overlay.panel} w-full max-w-sm max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={tw.overlay.header}>
          <h2
            className={`m-0 stage-title text-[18px] font-normal ${tw.text.primary}`}
          >
            {title}
          </h2>
          <button type="button" className={tw.button.icon} onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <AppScrollArea className="min-h-0 flex-1">{children}</AppScrollArea>
      </div>
    </div>
  )
}
