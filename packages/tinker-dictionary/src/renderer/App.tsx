import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SearchBar from './components/SearchBar'
import DictList from './components/DictList'
import DefinitionPanel from './components/DefinitionPanel'
import store from './store'
import { tw } from './theme'

const App = observer(() => {
  const { t } = useTranslation()

  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden antialiased`}
      >
        <SearchBar />
        <div className="flex-1 flex min-h-0">
          <DictList />
          <div
            className={`flex-1 flex flex-col min-h-0 min-w-0 ${tw.background.content}`}
          >
            <DefinitionPanel />
          </div>
        </div>
      </div>

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={tw.toast.title}>{t('error')}</Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {store.toastMsg}
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
