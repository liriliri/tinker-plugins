import className from 'licia/className'
import { ArrowDown } from 'lucide-react'
import { tw } from '../theme'

const FlowIndicator = () => (
  <div className="flex items-center justify-center shrink-0 py-0.5">
    <div className="flex items-center gap-2">
      <div className={className('h-px w-6', tw.divider.line)} />
      <ArrowDown size={12} className={tw.text.divider} />
      <div className={className('h-px w-6', tw.divider.line)} />
    </div>
  </div>
)

export default FlowIndicator
