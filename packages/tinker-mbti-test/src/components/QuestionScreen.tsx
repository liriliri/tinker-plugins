import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'
import { store } from '../store'
import { getQuestions } from '../data/questions'
import { ProgressBar } from './ProgressBar'

export const QuestionScreen = observer(() => {
  const { t, i18n } = useTranslation()
  const questions = getQuestions(i18n.language)
  const question = questions[store.currentQuestion]

  if (!question) return null

  const isAnswered = store.currentAnswer !== undefined

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
                disabled={store.currentQuestion === 0}
                className={className(
                  'p-1 rounded-md transition-colors',
                  store.currentQuestion === 0
                    ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {t('questionLabel', { number: store.currentQuestion + 1 })}
              </span>
              <button
                onClick={() => store.goToNext()}
                disabled={store.currentQuestion >= store.totalQuestions - 1}
                className={className(
                  'p-1 rounded-md transition-colors',
                  store.currentQuestion >= store.totalQuestions - 1
                    ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Question Text */}
            <h2
              className={className(
                'text-base font-medium mb-4 text-center leading-snug',
                tw.text.primary,
              )}
            >
              {question.text}
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => store.answer(question.id, 'a')}
                className={className(
                  'w-full text-left p-3 rounded-lg text-sm leading-snug transition-all duration-200',
                  'border',
                  store.currentAnswer === 'a'
                    ? 'border-accent-500 dark:border-accent-400 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
                    : className(
                        tw.border.primary,
                        tw.text.primary,
                        'hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                      ),
                )}
              >
                <span className="font-semibold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-2">
                  A
                </span>
                {question.optionA}
              </button>
              <button
                onClick={() => store.answer(question.id, 'b')}
                className={className(
                  'w-full text-left p-3 rounded-lg text-sm leading-snug transition-all duration-200',
                  'border',
                  store.currentAnswer === 'b'
                    ? 'border-accent-500 dark:border-accent-400 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
                    : className(
                        tw.border.primary,
                        tw.text.primary,
                        'hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                      ),
                )}
              >
                <span className="font-semibold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-2">
                  B
                </span>
                {question.optionB}
              </button>
            </div>
          </div>

          {/* Complete Button */}
          {store.isComplete && (
            <div className="mt-3 text-center animate-fade-in">
              <p className={className('text-xs mb-2', tw.text.inactive)}>
                {t('questionCompleted')}
              </p>
              <button
                onClick={() => store.showResult()}
                className={className(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'bg-accent-500 dark:bg-accent-400',
                  'text-white dark:text-zinc-950',
                  'hover:bg-accent-600 dark:hover:bg-accent-500',
                  'active:scale-95',
                )}
              >
                {t('questionViewResult')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
