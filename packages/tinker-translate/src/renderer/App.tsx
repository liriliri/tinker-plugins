import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import Toolbar from './components/Toolbar'
import TranslatePanel from './components/TranslatePanel'
import store from './store'
import { tw } from './theme'

const App = observer(() => {
  return (
    <Toast.Provider duration={4000}>
      <Tooltip.Provider delayDuration={300}>
        <div
          className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
        >
          <Toolbar />
          <TranslatePanel />
        </div>

        <Toast.Root
          open={store.toastOpen}
          onOpenChange={(open) => store.setToastOpen(open)}
          className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
        >
          <div className="flex-1 min-w-0">
            <Toast.Title className={tw.toast.title}>翻译出错</Toast.Title>
            <Toast.Description className={tw.toast.description}>
              {store.toastMsg}
            </Toast.Description>
          </div>
          <Toast.Close className={tw.toast.close}>
            <X className="w-3.5 h-3.5" />
          </Toast.Close>
        </Toast.Root>

        <Toast.Viewport className={tw.toast.viewport} />
      </Tooltip.Provider>
    </Toast.Provider>
  )
})

export default App
