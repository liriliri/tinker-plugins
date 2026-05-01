import { useEffect, useState } from 'react'
import clamp from 'licia/clamp'
import className from 'licia/className'
import { tw } from '../theme'

const colorConfig = {
  'bg-rose-500': {
    track: 'text-rose-200/60 dark:text-rose-900/60',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'text-rose-500',
    gradient: 'from-rose-400 to-rose-600',
  },
  'bg-amber-500': {
    track: 'text-amber-200/60 dark:text-amber-900/60',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'text-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  'bg-emerald-500': {
    track: 'text-emerald-200/60 dark:text-emerald-900/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'text-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  'bg-purple-500': {
    track: 'text-purple-200/60 dark:text-purple-900/60',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'text-purple-500',
    gradient: 'from-purple-400 to-purple-600',
  },
  'bg-blue-500': {
    track: 'text-blue-200/60 dark:text-blue-900/60',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'text-blue-500',
    gradient: 'from-blue-400 to-blue-600',
  },
}

type ColorKey = keyof typeof colorConfig

interface Props {
  label: string
  progress: number
  subtitle: string
  color: ColorKey
  stats?: string[]
}

export default function ProgressCard({
  label,
  progress,
  subtitle,
  color,
  stats,
}: Props) {
  const percent = clamp(progress * 100, 0, 100)
  const [displayPercent, setDisplayPercent] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayPercent(percent))
    return () => cancelAnimationFrame(id)
  }, [percent])
  const config = colorConfig[color]

  const radius = 26
  const strokeWidth = 5
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    circumference - (displayPercent / 100) * circumference

  return (
    <div
      className={className(
        'rounded-lg px-3 py-2.5',
        tw.border.card,
        tw.background.card,
        'backdrop-blur-sm',
        'shadow-sm hover:shadow-md transition-shadow duration-300',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="64" height="64" className="progress-ring -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={config.track}
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={className(
                config.glow,
                'gauge-glow',
                'progress-ring-circle',
              )}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
              stroke="currentColor"
            />
          </svg>
          <span
            className={className(
              'absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums',
              config.text,
            )}
          >
            {percent.toFixed(0)}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-2">
            <span
              className={className(
                'text-sm font-semibold tracking-tight',
                tw.text.primary,
              )}
            >
              {label}
            </span>
            <span
              className={className('text-[11px] font-medium', tw.text.muted)}
            >
              {subtitle}
            </span>
          </div>

          <div
            className={className(
              'w-full h-1.5 rounded-full overflow-hidden',
              tw.progressBar.track,
            )}
          >
            <div
              className={className(
                'h-full rounded-full bg-gradient-to-r progress-shimmer',
                config.gradient,
                'progress-bar',
              )}
              style={{ width: `${displayPercent}%` }}
            />
          </div>

          {stats && stats.length > 0 && (
            <div className="flex gap-3 mt-2.5">
              {stats.map((stat, i) => (
                <span
                  key={i}
                  className={className(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                    tw.background.tag,
                    tw.text.muted,
                  )}
                >
                  {stat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
