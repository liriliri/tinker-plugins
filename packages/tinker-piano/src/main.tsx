import { useEffect, type DragEvent } from 'react'
import { observer } from 'mobx-react-lite'
import find from 'licia/find'
import toArr from 'licia/toArr'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import { isMidiFile } from './lib/util'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import Toolbar from './components/Toolbar'
import Stage from './components/Stage'
import Keyboard from './components/Keyboard'
import './index.scss'

const App = observer(function App() {
  useEffect(() => {
    void store.init()
    return () => store.dispose()
  }, [])

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = find(toArr(e.dataTransfer.files), isMidiFile)
    if (!file) return
    void store.openMidiFromFile(file)
  }

  return (
    <div className={tw.shell} onDragOver={onDragOver} onDrop={onDrop}>
      <Toolbar />
      <div className={tw.cabinet}>
        <Stage />
        <Keyboard />
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
