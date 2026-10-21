import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import Globe from './components/Globe'
import Header from './components/Header'
import Meter from './components/Meter'
import PlayerBar from './components/PlayerBar'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import store from './store'
import { tw } from './theme'
import './index.scss'

const App = observer(function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        document.getElementById('station-search')?.focus()
        return
      }
      if (typing || target instanceof HTMLButtonElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        store.toggle()
      } else if (e.code === 'ArrowRight') {
        store.next()
      } else if (e.code === 'ArrowLeft') {
        store.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={className(
        'relative h-screen select-none overflow-hidden font-sans',
        tw.background.app,
        tw.text.primary,
      )}
    >
      <div className="absolute inset-0">
        <Globe />
      </div>
      <Header />
      <PlayerBar />
      <Meter />
    </div>
  )
})

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
