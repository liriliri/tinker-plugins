import className from 'licia/className'
import { tw } from '../theme'

type ColorType = 'blue' | 'green' | 'purple' | 'orange'

interface StatCardProps {
  label: string
  value: string | number
  color?: ColorType
}

const StatCard = ({ label, value, color = 'blue' }: StatCardProps) => {
  const colorClasses: Record<ColorType, string> = {
    blue: tw.gradient.blue,
    green: tw.gradient.green,
    purple: tw.gradient.purple,
    orange: tw.gradient.orange,
  }

  return (
    <div
      className={className(
        tw.background.card,
        'rounded-lg p-3',
        tw.shadow.card,
        tw.border.card,
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
