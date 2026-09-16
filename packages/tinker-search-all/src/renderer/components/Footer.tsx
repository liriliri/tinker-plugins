import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import store from '../store'
import { tw } from '../theme'

const Footer = observer(function Footer() {
  const { t } = useTranslation()
  if (isEmpty(store.flatResults)) return null

  return (
    <div
      className={className(
        'flex items-center justify-end gap-3 px-3 h-9 border-t text-[11px] shrink-0',
        tw.footer.bar,
      )}
    >
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
    </div>
  )
})

export default Footer
