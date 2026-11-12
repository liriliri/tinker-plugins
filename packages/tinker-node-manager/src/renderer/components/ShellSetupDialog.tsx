import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import ConfirmDialog from './ConfirmDialog'

const ShellSetupDialog = observer(() => {
  const { t } = useTranslation()
  const preview = store.shellSetupPreview

  return (
    <ConfirmDialog
      open={Boolean(preview)}
      title={t('setupShell')}
      description={t('setupShellConfirm', {
        shell: preview?.shell ?? '',
        rcPath: preview?.rcPath ?? '',
      })}
      cancelLabel={t('cancel')}
      confirmLabel={t('setupShellConfirmAction')}
      busy={store.isBusy}
      onClose={() => store.closeShellSetupDialog()}
      onConfirm={() => void store.setupShellEnv()}
    />
  )
})

export default ShellSetupDialog
