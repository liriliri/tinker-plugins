import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import store from '../store'
import { tw } from '../theme'
import SettingsDialog from './SettingsDialog'

const Footer = observer(function Footer() {
  const { t } = useTranslation()
  const hasResults = !isEmpty(store.flatResults)

  return (
    <>
      <div
        className={className(
          'flex items-center justify-between gap-3 px-3 h-9 border-t text-[11px] shrink-0',
          tw.footer.bar,
        )}
      >
        <button
          type="button"
          onClick={() => store.setShowSettings(true)}
          title={t('settings')}
          className={tw.iconBtn}
        >
          <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        {hasResults ? (
          <span className="flex items-center gap-1.5">
            <span>{t('open')}</span>
            <kbd
              className={className(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-medium',
                tw.footer.kbd,
              )}
            >
              ↵
            </kbd>
          </span>
        ) : null}
      </div>
      <SettingsDialog />
    </>
  )
})

export default Footer
