import { observer } from 'mobx-react-lite'
import { useCallback, useState, type DragEvent } from 'react'
import className from 'licia/className'
import * as Toast from '@radix-ui/react-toast'
import renderApp from 'tinker-share/lib/renderApp'
import DropZone from './components/DropZone'
import ErrorToast from './components/ErrorToast'
import ModelStage from './components/ModelStage'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    setIsDragOver(false)
    store.handleDropEvent(e)
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div className={className('h-screen overflow-hidden', tw.background.app)}>
        {store.status === 'idle' ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : (
          <ModelStage />
        )}
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
