import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import store from './store'
import { tw } from './theme'
import SearchBar from './components/SearchBar'
import CategoryTabs from './components/CategoryTabs'
import EmojiGrid from './components/EmojiGrid'

const App = observer(() => {
  return (
    <div
      className={className(
        'h-screen flex flex-col p-3',
        'bg-white dark:bg-zinc-900',
      )}
    >
      <div className="mx-auto max-w-6xl w-full flex flex-col h-full gap-3">
        {/* Search Bar */}
        <div className="flex-shrink-0">
          <SearchBar />
        </div>

        {/* Category Tabs */}
        <div className="flex-shrink-0">
          <CategoryTabs />
        </div>

        {/* Emoji Grid */}
        <div className="flex-1 min-h-0">
          <EmojiGrid />
        </div>
      </div>
    </div>
  )
})

export default App
