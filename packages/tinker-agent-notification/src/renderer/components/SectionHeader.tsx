import className from 'licia/className'
import type { ReactNode } from 'react'
import { tw } from '../theme'

interface SectionHeaderProps {
  icon: ReactNode
  title: string
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
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
}

export default SectionHeader
