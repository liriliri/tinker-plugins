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
        tw.border.card,
        onClick && 'cursor-pointer transition-all duration-200',
        onClick && tw.background.hover,
      )}
    >
      <div
        className={`text-[10px] font-medium ${tw.text.muted} tracking-wider mb-1`}
      >
        {label}
      </div>
      <div
        className={className(
          'text-xl font-bold',
          isActive
            ? 'bg-gradient-to-br bg-clip-text text-transparent'
            : tw.text.muted,
          isActive && colorClasses[color],
        )}
      >
        {value}
      </div>
    </div>
  )
}

export default StatCard
