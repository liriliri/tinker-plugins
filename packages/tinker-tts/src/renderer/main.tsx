import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import TextPanel from './components/TextPanel'
import OptionsPanel from './components/OptionsPanel'
import AudioPlayer from './components/AudioPlayer'
import ErrorToast from './components/ErrorToast'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  useEffect(() => {
    void store.loadVoices()
  }, [])

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen overflow-hidden flex flex-col',
          tw.background.app,
          tw.text.primary,
        )}
      >
        <div
          className={className('flex-1 min-h-0 flex border-b', tw.border.color)}
        >
          <div
            className={className(
              'flex-1 min-w-0 min-h-0 border-r',
              tw.border.color,
            )}
          >
            <TextPanel />
          </div>
          <OptionsPanel />
        </div>
        <AudioPlayer />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
