import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import store from './store'
import { tw } from './theme'
import SearchBar from './components/SearchBar'
import CategorySelect from './components/CategoryTabs'
import EmojiGrid from './components/EmojiGrid'

const App = observer(() => {
  return (
    <div
      className={className('h-screen flex flex-col p-3', tw.background.primary)}
    >
      <div className="mx-auto max-w-6xl w-full flex flex-col h-full gap-3">
        <div className="shrink-0 flex gap-2">
          <div className="shrink-0">
            <CategorySelect />
          </div>
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <EmojiGrid />
        </div>
      </div>
    </div>
  )
})

export default App
