import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import className from 'licia/className'
import SearchInput from './components/SearchInput'
import CategoryTabs from './components/CategoryTabs'
import ResultList from './components/ResultList'
import Footer from './components/Footer'
import store from './store'
import { tw } from './theme'

const App = observer(function App() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        store.moveSelection(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        store.moveSelection(-1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        void store.activateSelected()
      } else if (e.key === 'Escape' && store.query) {
        e.preventDefault()
        store.setQuery('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      className={className('h-screen flex flex-col overflow-hidden', tw.app)}
    >
      <div className="sa-glow" aria-hidden />
      <div className={className('flex flex-col flex-1 min-h-0', tw.content)}>
        <SearchInput />
        <div className="flex flex-col flex-1 min-h-0 px-2.5 pt-2 gap-1.5">
          <CategoryTabs />
          <ResultList />
        </div>
        <Footer />
      </div>
    </div>
  )
})

export default App
