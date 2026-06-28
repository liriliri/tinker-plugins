import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const ErrorToast = observer(() => {
  const { t } = useTranslation()
  const { isDark } = store

  return (
    <>
      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={`${tw.toast.root(isDark)} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={tw.toast.title(isDark)}>
            {t('error')}
          </Toast.Title>
          <Toast.Description className={tw.toast.description(isDark)}>
            {store.toastMsg}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close(isDark)}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={tw.toast.viewport} />
    </>
  )
})

export default ErrorToast
