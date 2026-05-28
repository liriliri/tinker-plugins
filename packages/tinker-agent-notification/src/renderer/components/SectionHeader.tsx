import className from 'licia/className'
import { tw } from '../theme'

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) => (
  <div className="flex items-center gap-2 mb-2">
    <span className={tw.accent.icon}>{icon}</span>
    <h3
      className={className(
        'text-xs font-semibold uppercase tracking-wider',
        tw.text.muted,
      )}
    >
      {title}
    </h3>
  </div>
)

export default SectionHeader
