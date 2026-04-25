import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const DURATION = 60
const RADIUS = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const StatsDisplay = observer(() => {
  const { t } = useTranslation()
  const { wpm, cpm, accuracy, timeLeft, status, isEnglish } = store

  const isRunning = status === 'running'
  const isWarning = timeLeft <= 10 && isRunning
  const progress = timeLeft / DURATION
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="flex items-center justify-center gap-10">
      {/* Timer */}
      <div className="relative flex items-center justify-center">
        <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
          <circle
            cx="30"
            cy="30"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={tw.timer.track}
          />
          <circle
            cx="30"
            cy="30"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={className(
              'timer-ring',
              isWarning ? tw.text.error : tw.text.warning,
            )}
          />
        </svg>
        <span
          className={className(
            'absolute text-sm font-mono font-bold tabular-nums',
            {
              'timer-value-warn': isWarning,
              'timer-value': !isWarning,
            },
          )}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {timeLeft}
        </span>
      </div>

      {/* Stats */}
      {isEnglish && (
        <div className="flex flex-col items-center gap-1 min-w-16">
          <span className="stats-label">{t('wpm')}</span>
          <span
            className={className('stats-value', {
              'stats-value-accent': isRunning && wpm > 0,
            })}
          >
            {wpm}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 min-w-16">
        <span className="stats-label">{t('cpm')}</span>
        <span
          className={className('stats-value', {
            'stats-value-accent': isRunning && cpm > 0,
          })}
        >
          {cpm}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 min-w-16">
        <span className="stats-label">{t('accuracy')}</span>
        <span
          className={className('stats-value', {
            [tw.text.error]: accuracy < 90,
          })}
        >
          {accuracy}%
        </span>
      </div>
    </div>
  )
})

export default StatsDisplay
