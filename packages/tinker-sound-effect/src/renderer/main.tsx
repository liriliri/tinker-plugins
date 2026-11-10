import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import TextPanel from './components/TextPanel'
import OptionsPanel from './components/OptionsPanel'
import AudioList from './components/AudioList'
import ErrorToast from './components/ErrorToast'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  useEffect(() => {
    void store.load()
    return () => {
      soundEffect.stopEngine()
    }
  }, [])

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen overflow-hidden flex',
          tw.background.app,
          tw.text.primary,
        )}
      >
        <aside
          className={className(
            'w-[320px] shrink-0 min-h-0 flex flex-col border-r',
            tw.background.sidebar,
            tw.border.color,
          )}
        >
          <div
            className={className(
              'min-h-[180px] flex-[2_1_0%] border-b',
              tw.border.soft,
            )}
          >
            <TextPanel />
          </div>
          <div className="min-h-0 flex-[3_1_0%]">
            <OptionsPanel />
          </div>
        </aside>
        <main
          className={className(
            'flex-1 min-w-0 min-h-0',
            tw.background.recessed,
          )}
        >
          <AudioList />
        </main>
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
