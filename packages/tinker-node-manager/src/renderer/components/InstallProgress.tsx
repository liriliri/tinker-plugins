import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const InstallProgress = observer(() => {
  const { t } = useTranslation()
  const version = store.installingVersion
  if (!version) return null

  return (
    <div
      className={className(
        'shrink-0 border-t px-3 py-2 flex flex-col gap-1.5',
        tw.background.toolbar,
        tw.border.divider,
      )}
    >
      <div
        className={className(
          'text-[11px] truncate version-mono',
          tw.text.secondary,
        )}
      >
        {t('installing', { version })}
      </div>
      <div className={tw.progress.track}>
        <div className={tw.progress.bar} />
      </div>
    </div>
  )
})

export default InstallProgress
