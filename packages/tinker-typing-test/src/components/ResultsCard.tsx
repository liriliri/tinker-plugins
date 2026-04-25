import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const ResultsCard = observer(() => {
  const { t } = useTranslation()
  const { wpm, cpm, accuracy, errors, isEnglish } = store

  const stats = useMemo(
    () => [
      ...(isEnglish ? [{ value: wpm, label: t('wpm'), accent: true }] : []),
      { value: cpm, label: t('cpm'), accent: true },
      { value: `${accuracy}%`, label: t('accuracy'), accent: false },
      { value: errors, label: t('errors'), accent: false, isError: true },
    ],
    [isEnglish, wpm, cpm, accuracy, errors, t],
  )

  return (
    <div className="results-enter flex flex-col items-center gap-10 w-full max-w-lg">
      <h2
        className={`text-lg font-medium tracking-wide ${tw.text.resultsHeading} uppercase`}
        style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: '0.12em' }}
      >
        {t('results')}
      </h2>

      <div className="flex items-end justify-center gap-10 w-full">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="result-card flex flex-col items-center gap-2"
            style={{ animationDelay: `${i * 80 + 100}ms` }}
          >
            <span
              className={className('results-primary-value', {
                [tw.text.error]: stat.isError,
                'results-primary-value-accent': !stat.isError && stat.accent,
              })}
            >
              {stat.value}
            </span>
            <span className="result-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => store.resetTest()}
        className="restart-btn mt-2"
        style={{ animationDelay: '400ms' }}
      >
        {t('practiceAgain')}
      </button>
    </div>
  )
})

export default ResultsCard
