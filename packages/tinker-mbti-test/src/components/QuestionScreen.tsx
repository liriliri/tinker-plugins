import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'
import { getQuestions } from '../data/questions'
import { ProgressBar } from './ProgressBar'

export const QuestionScreen = observer(() => {
  const { t, i18n } = useTranslation()
  const questions = getQuestions(i18n.language)
  const question = questions[store.currentQuestion]

  if (!question) return null

  const atStart = store.currentQuestion === 0
  const atEnd = store.currentQuestion >= store.totalQuestions - 1

  return (
    <div className="flex flex-col min-h-full px-3 py-3">
      <div className="shrink-0 mb-3">
        <ProgressBar />
      </div>

      <div className="flex-1 flex items-center">
        <div className="w-full">
          <div
            className={className(
              'rounded-lg p-4',
              tw.background.secondary,
              tw.border.primary,
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => store.goToPrev()}
                disabled={atStart}
                className={className(
                  'p-1 rounded-md transition-colors',
                  atStart ? tw.text.navDisabled : tw.text.nav,
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <span className={className('text-xs', tw.text.muted)}>
                {t('questionLabel', { number: store.currentQuestion + 1 })}
              </span>
              <button
                onClick={() => store.goToNext()}
                disabled={atEnd}
                className={className(
                  'p-1 rounded-md transition-colors',
                  atEnd ? tw.text.navDisabled : tw.text.nav,
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h2
              className={className(
                'text-base font-medium mb-4 text-center leading-snug',
                tw.text.primary,
              )}
            >
              {question.text}
            </h2>

            <div className="space-y-2">
              {(['a', 'b'] as const).map((choice) => {
                const selected = store.currentAnswer === choice
                return (
                  <button
                    key={choice}
                    onClick={() => store.answer(question.id, choice)}
                    className={className(
                      'w-full text-left p-3 rounded-lg text-sm leading-snug transition-all duration-200 border',
                      selected
                        ? className(
                            tw.border.optionSelected,
                            tw.background.optionSelected,
                            tw.text.accentSelected,
                          )
                        : className(
                            tw.border.primary,
                            tw.text.primary,
                            tw.border.optionHover,
                            tw.background.optionHover,
                          ),
                    )}
                  >
                    <span
                      className={className(
                        'font-semibold text-xs uppercase tracking-wider mr-2',
                        tw.text.optionLabel,
                      )}
                    >
                      {choice.toUpperCase()}
                    </span>
                    {choice === 'a' ? question.optionA : question.optionB}
                  </button>
                )
              })}
            </div>
          </div>

          {store.isComplete ? (
            <div className="mt-3 text-center animate-fade-in">
              <p className={className('text-xs mb-2', tw.text.inactive)}>
                {t('questionCompleted')}
              </p>
              <button
                onClick={() => store.showResult()}
                className={tw.button.primaryCompact}
              >
                {t('questionViewResult')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
})
