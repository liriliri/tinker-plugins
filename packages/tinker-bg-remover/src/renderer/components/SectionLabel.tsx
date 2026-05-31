import { tw } from '../theme'

interface SectionLabelProps {
  children: React.ReactNode
}

const SectionLabel = ({ children }: SectionLabelProps) => (
  <div
    className={`text-[10px] font-semibold uppercase tracking-widest ${tw.text.muted} mb-2`}
  >
    {children}
  </div>
)

export default SectionLabel
