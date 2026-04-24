import { observer } from 'mobx-react-lite'
import { useRef, useEffect } from 'react'
import clamp from 'licia/clamp'
import { Search, BookMarked, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const SearchBar = observer(() => {
  const { t } = useTranslation()
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!store.dropdownOpen || !store.suggestions.length) return

      const idx = store.suggestions.findIndex(
        (s) => s.keyText === store.selectedWord,
      )

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = clamp(idx + 1, 0, store.suggestions.length - 1)
        store.selectedWord = store.suggestions[next].keyText
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = clamp(idx - 1, 0, store.suggestions.length - 1)
        store.selectedWord = store.suggestions[prev].keyText
      } else if (e.key === 'Enter' && store.selectedWord) {
        e.preventDefault()
        store.selectWord(store.selectedWord)
      } else if (e.key === 'Escape') {
        store.dropdownOpen = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!listRef.current || !store.selectedWord) return
    const activeEl = listRef.current.querySelector('[data-active="true"]')
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [store.selectedWord])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        store.dropdownOpen = false
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-2 px-3 py-2 ${tw.background.toolbar} border-b ${tw.border.divider} shrink-0`}
    >
      <button
        onClick={() => store.setShowDictPanel(!store.showDictPanel)}
        className={`relative flex items-center justify-center w-7 h-7 rounded border-none bg-transparent transition-colors duration-100 cursor-pointer shrink-0 ${
          store.showDictPanel ? tw.text.primary : `${tw.button.icon.default}`
        } ${tw.button.icon.hover}`}
        title={t('manageDictionaries')}
      >
        <BookMarked className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <div
        className={`flex items-center flex-1 gap-2 px-2.5 py-1 rounded border ${tw.border.divider} ${tw.background.content} transition-colors duration-100 focus-within:border-zinc-400 dark:focus-within:border-zinc-600`}
      >
        <Search
          className={`w-3.5 h-3.5 shrink-0 ${tw.text.muted}`}
          strokeWidth={2}
        />
        <input
          type="text"
          value={store.searchText}
          onChange={(e) => store.setSearchText(e.target.value)}
          onFocus={() => {
            if (store.suggestions.length > 0) store.dropdownOpen = true
          }}
          placeholder={t('searchPlaceholder')}
          disabled={!store.hasDictionary}
          className={`flex-1 text-[13px] bg-transparent outline-none border-none ${tw.text.primary} ${tw.text.placeholder} disabled:opacity-50`}
        />
        {store.searchText && (
          <button
            onClick={() => store.setSearchText('')}
            className={`flex items-center justify-center w-4 h-4 shrink-0 rounded-sm bg-transparent border-none cursor-pointer transition-colors duration-100 ${tw.button.icon.default} ${tw.button.icon.hover}`}
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {store.dropdownOpen && store.suggestions.length > 0 && (
        <ul
          ref={listRef}
          className={`absolute left-12 right-3 top-full mt-0.5 z-50 max-h-72 overflow-y-auto rounded border ${tw.border.divider} ${tw.background.content} shadow-lg shadow-black/8 dark:shadow-black/30 list-none m-0 p-1 animate-fade-up`}
        >
          {store.suggestions.map((entry) => {
            const isActive = entry.keyText === store.selectedWord
            return (
              <li
                key={entry.keyText}
                data-active={isActive}
                onClick={() => store.selectWord(entry.keyText)}
                className={`px-2.5 py-1.5 text-[13px] cursor-pointer select-none truncate rounded-sm transition-colors duration-75 ${
                  isActive
                    ? tw.list.itemActive
                    : `${tw.list.item} ${tw.list.itemHover}`
                }`}
              >
                {entry.keyText}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
})

export default SearchBar
