import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import Toolbar from './components/Toolbar'
import FolderList from './components/FolderList'
import MessageList from './components/MessageList'
import MessageView from './components/MessageView'
import ComposePanel from './components/ComposePanel'
import AccountSetup from './components/AccountSetup'
import store from './store'
import { tw } from './theme'

const App = observer(() => {
  const { t } = useTranslation()
  const toastTitle = store.toastKind === 'success' ? t('success') : t('error')
  const toastBody = t(store.toastMsg, { defaultValue: store.toastMsg })

  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
      >
        <Toolbar />
        <div className="flex-1 flex min-h-0">
          <FolderList />
          {!store.showCompose && <MessageList />}
          {store.showCompose ? <ComposePanel /> : <MessageView />}
        </div>
      </div>

      <AccountSetup />

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title
            className={
              store.toastKind === 'success'
                ? tw.toast.titleSuccess
                : tw.toast.titleError
            }
          >
            {toastTitle}
          </Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {toastBody}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

export default App
