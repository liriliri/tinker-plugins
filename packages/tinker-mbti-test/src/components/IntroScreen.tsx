import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

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
        <p className={className('text-[10px] mb-5', tw.text.muted)}>
          {t('introTips')}
        </p>
        <button onClick={() => store.startTest()} className={tw.button.primary}>
          {t('introStartButton')}
        </button>
      </div>
    </div>
  )
}
