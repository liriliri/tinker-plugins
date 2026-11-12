import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import ConfirmDialog from './ConfirmDialog'

const UninstallDialog = observer(() => {
  const { t } = useTranslation()
  const target = store.uninstallTarget

  return (
    <ConfirmDialog
      open={Boolean(target)}
      title={t('uninstallTitle')}
      description={t('uninstallConfirm', { version: target?.version ?? '' })}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      confirmClassName={tw.button.danger}
      busy={store.isBusy}
      onClose={() => store.closeUninstallDialog()}
      onConfirm={() => void store.uninstallVersion()}
    />
  )
})

export default UninstallDialog
