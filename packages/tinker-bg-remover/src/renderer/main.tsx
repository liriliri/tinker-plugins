import { observer } from 'mobx-react-lite'
import { useState, useCallback } from 'react'
import className from 'licia/className'
import startWith from 'licia/startWith'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import Sidebar from './components/Sidebar'
import DropZone from './components/DropZone'
import ImageViewer from './components/ImageViewer'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && startWith(file.type, 'image/')) {
      store.handleDrop(file)
    }
  }, [])

  return (
    <div
      className={className(
        'h-screen flex overflow-hidden antialiased',
        tw.background.app,
      )}
    >
      <Sidebar />
      <div className={className('flex-1 min-w-0', tw.background.preview)}>
        {!store.originalImage ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : (
          <ImageViewer />
        )}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
