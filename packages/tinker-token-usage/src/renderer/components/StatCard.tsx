import className from 'licia/className'
import { tw } from '../theme'

type ColorType = 'blue' | 'green' | 'purple' | 'orange'

interface StatCardProps {
  label: string
  value: string | number
  color?: ColorType
  isActive?: boolean
  onClick?: () => void
}

const StatCard = ({
  label,
  value,
  color = 'blue',
  isActive = true,
  onClick,
}: StatCardProps) => {
  const colorClasses: Record<ColorType, string> = {
    blue: tw.gradient.blue,
    green: tw.gradient.green,
    purple: tw.gradient.purple,
    orange: tw.gradient.orange,
  }

  return (
    <div
      onClick={onClick}
      className={className(
        tw.background.card,
        'rounded-lg p-2',
        tw.shadow.card,
        tw.border.card,
        onClick && 'cursor-pointer transition-all duration-200',
        onClick && tw.background.hover,
        !isActive && 'opacity-40 scale-95',
        isActive && 'opacity-100 scale-100',
      )}
    >
      <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={className(
          'text-xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
          colorClasses[color],
        )}
      >
        {value}
      </div>
    </div>
  )
}

export default StatCard
