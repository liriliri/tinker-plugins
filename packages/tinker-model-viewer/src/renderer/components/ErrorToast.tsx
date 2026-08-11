import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import startWith from 'licia/startWith'
import store from '../store'
import { tw } from '../theme'

const ErrorToast = observer(function ErrorToast() {
  const { t, i18n } = useTranslation()
  let msg = store.toastMsg
  if (startWith(msg, 'missingFiles:')) {
    msg = t('missingFiles', { list: msg.slice('missingFiles:'.length) })
  } else if (startWith(msg, 'convertFailed:')) {
    msg = t('convertFailedDetail', {
      detail: msg.slice('convertFailed:'.length),
    })
  } else if (i18n.exists(msg)) {
    msg = t(msg)
  }

  return (
    <>
      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={tw.toast.root}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={tw.toast.title}>
            {t(store.toastTitle)}
          </Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {msg}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close} aria-label={t('close')}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className={tw.toast.viewport} />
    </>
  )
})

export default ErrorToast
