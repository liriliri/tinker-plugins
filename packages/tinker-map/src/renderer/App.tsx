import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import className from 'licia/className'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import LocationList from './components/LocationList'
import BookmarkDialog from './components/BookmarkDialog'
import { tw } from './theme'

const App = observer(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen relative">
      <div className="absolute inset-0">
        <Map />
      </div>
      <div
        className={className(
          'absolute top-3 left-3 bottom-3 z-[1000] flex flex-col rounded-xl overflow-hidden',
          'transition-all duration-300 ease-out',
          tw.sidebar.bg,
          sidebarOpen
            ? 'w-60 opacity-100 translate-x-0'
            : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
        )}
      >
        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={className(
              'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150',
              'hover:scale-105 active:scale-95',
              tw.controlBtn.inactive,
            )}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <LocationList />
        </div>
      </div>
      <button
        onClick={() => setSidebarOpen(true)}
        className={className(
          'absolute top-3 left-3 z-[1000] w-9 h-9 rounded-lg shadow-lg',
          'flex items-center justify-center transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          tw.controlBtn.inactive,
          sidebarOpen
            ? 'opacity-0 -translate-x-2 pointer-events-none'
            : 'opacity-100 translate-x-0',
        )}
      >
        <PanelLeftOpen size={18} />
      </button>
      <BookmarkDialog />
    </div>
  )
})

export default App
