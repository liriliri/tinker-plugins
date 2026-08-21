import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { tw } from '../theme'

interface OverlayPanelProps {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export default function OverlayPanel({
  title,
  onClose,
  children,
  wide = false,
}: OverlayPanelProps) {
  return (
    <div
      className={`${tw.overlay.backdrop} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${tw.overlay.panel} w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={tw.overlay.header}>
          <h2 className={`m-0 text-[14px] font-extrabold ${tw.text.primary}`}>
            {title}
          </h2>
          <button type="button" className={tw.button.icon} onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
