import { Eraser } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'

const ProcessingOverlay = () => (
  <div
    className={className(
      'absolute inset-0 flex flex-col items-center justify-center rounded-xl z-10',
      tw.overlay.processing,
    )}
  >
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div
        className={className(
          'absolute inset-0 rounded-full border-2 animate-pulse-ring',
          tw.overlay.ring,
        )}
      />
      <Eraser className={className('w-5 h-5', tw.overlay.icon)} />
    </div>
  </div>
)

export default ProcessingOverlay
