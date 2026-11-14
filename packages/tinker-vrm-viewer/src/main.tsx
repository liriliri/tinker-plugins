import { useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import DropZone from './components/DropZone'
import VrmStage from './components/VrmStage'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
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
    if (file && endWith(lowerCase(file.name), '.vrm')) {
      void store.handleDrop(file)
    }
  }, [])

  return (
    <div
      className={className(
        'h-screen flex overflow-hidden antialiased',
        tw.background.app,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 min-w-0">
        {!store.hasModel ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : (
          <VrmStage />
        )}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
