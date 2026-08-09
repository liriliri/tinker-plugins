import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { resolveErrorLabel } from '../lib/util'

const ErrorToast = observer(() => {
  const { t } = useTranslation()

  return (
    <>
      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        duration={4000}
        className={className(
          tw.toast.root,
          'data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity',
        )}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={className(tw.toast.title, tw.toast.error)}>
            {t('error')}
          </Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {resolveErrorLabel(t, store.toastMsg)}
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
