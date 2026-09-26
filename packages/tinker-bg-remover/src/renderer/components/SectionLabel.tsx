import className from 'licia/className'
import { tw } from '../theme'

interface SectionLabelProps {
  children: React.ReactNode
}

const SectionLabel = ({ children }: SectionLabelProps) => (
  <div
    className={className(
      'text-[10px] font-semibold uppercase tracking-widest mb-2',
      tw.text.muted,
    )}
  >
    {children}
  </div>
)

export default SectionLabel
