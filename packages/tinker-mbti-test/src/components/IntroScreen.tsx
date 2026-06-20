import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'
import { store } from '../store'

export function IntroScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
      <div className="text-center max-w-sm">
        <h1 className={className('text-xl font-bold mb-2', tw.text.primary)}>
          {t('introTitle')}
        </h1>
        <p
          className={className('text-xs leading-snug mb-1.5', tw.text.inactive)}
        >
          {t('introDescription')}
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-5">
          {t('introTips')}
        </p>
        <button
          onClick={() => store.startTest()}
          className={className(
            'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'bg-accent-500 dark:bg-accent-400',
            'text-white dark:text-zinc-950',
            'hover:bg-accent-600 dark:hover:bg-accent-500',
            'active:scale-95',
          )}
        >
          {t('introStartButton')}
        </button>
      </div>
    </div>
  )
}
