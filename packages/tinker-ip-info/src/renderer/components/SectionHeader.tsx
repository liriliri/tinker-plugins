import className from 'licia/className'
import { tw } from '../theme'

interface SectionHeaderProps {
  title: string
  trailing?: string
}

const SectionHeader = ({ title, trailing }: SectionHeaderProps) => {
  return (
    <div
      className={className(
        'flex h-7 shrink-0 items-center justify-between border-b px-3',
        tw.background.toolbar,
        tw.border.section,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={className('h-1 w-1 rounded-full', tw.fill.accent)}
          aria-hidden
        />
        <h2
          className={className(
            'text-[10px] font-semibold tracking-[0.14em] uppercase',
            tw.text.label,
          )}
        >
          {title}
        </h2>
      </div>
      {trailing && (
        <span
          className={className(
            'font-mono text-[10px] tracking-wide',
            tw.text.muted,
          )}
        >
          {trailing}
        </span>
      )}
    </div>
  )
}

export default SectionHeader
