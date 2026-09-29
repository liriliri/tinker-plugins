import className from 'licia/className'
import { tw } from '../theme'

interface MetricCell {
  label: string
  value: string
  unit: string
  tone?: 'default' | 'down' | 'up'
}

interface Props {
  cells: MetricCell[]
}

export default function MetricRail({ cells }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={className('rounded-[4px] px-3 py-2.5', tw.cell)}
        >
          <div className={tw.label}>{cell.label}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={className(
                'text-[22px] font-semibold leading-none',
                tw.mono,
                cell.tone === 'down' && tw.toneDown,
                cell.tone === 'up' && tw.toneUp,
              )}
            >
              {cell.value}
            </span>
            <span className={className('text-[11px]', tw.muted)}>
              {cell.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
