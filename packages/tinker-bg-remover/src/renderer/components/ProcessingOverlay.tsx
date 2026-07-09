import { Eraser } from 'lucide-react'
import { tw } from '../theme'

const ProcessingOverlay = () => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center ${tw.overlay.processing} rounded-xl z-10`}
  >
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full border-2 ${tw.overlay.ring} animate-pulse-ring`}
      />
      <Eraser className={`w-5 h-5 ${tw.overlay.icon}`} />
    </div>
  </div>
)

export default ProcessingOverlay
