import { useEffect, useState } from 'react'
import clamp from 'licia/clamp'
import className from 'licia/className'
import { tw, progressColors, ProgressColorKey } from '../theme'

interface Props {
  label: string
  progress: number
  subtitle: string
  color: ProgressColorKey
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
  const config = progressColors[color]

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
