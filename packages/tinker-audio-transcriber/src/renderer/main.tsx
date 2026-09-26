import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import contain from 'licia/contain'
import i18n from 'i18next'
import renderApp from 'tinker-share/lib/renderApp'
import Toolbar from './components/Toolbar'
import ResultPanel from './components/ResultPanel'
import ErrorToast from './components/ErrorToast'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  useEffect(() => {
    store.initModelPreference(i18n.language)
    store.refreshModelsStatus()
  }, [])

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (store.isTranscribing) return
    if (contain(e.dataTransfer.types, 'Files')) {
      store.setDragging(true)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    store.setDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    store.setDragging(false)
    if (store.isTranscribing) return
    const file = e.dataTransfer.files?.[0]
    if (file) void store.openDroppedFile(file)
  }

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen flex flex-col overflow-hidden',
          tw.background.app,
          tw.text.primary,
          store.isDragging && tw.empty.dragActive,
        )}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Toolbar />
        <ResultPanel />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
