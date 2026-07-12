import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import {
  Search,
  RotateCw,
  X,
  Plus,
  FolderUp,
  Store,
  Github,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!store.addMenuOpen) return

    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        store.setAddMenuOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') store.setAddMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [store.addMenuOpen])

  return (
    <div
      className={className(
        'relative z-20 flex items-center gap-2.5 px-3.5 py-2.5 border-b shrink-0',
        tw.background.toolbar,
        tw.border.divider,
      )}
    >
      <div
        className={className(
          'flex items-center flex-1 gap-2 px-2.5 py-1.5 rounded-lg border transition-shadow',
          tw.border.search,
          tw.border.searchFocus,
          tw.background.search,
        )}
      >
        <Search
          className={className('w-3.5 h-3.5 shrink-0', tw.text.muted)}
          strokeWidth={2}
        />
        <input
          type="text"
          value={store.query}
          onChange={(e) => store.setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={className(
            'flex-1 text-[13px] bg-transparent outline-none border-none',
            tw.text.primary,
            tw.text.placeholder,
          )}
        />
        {store.query ? (
          <button
            type="button"
            onClick={() => store.setQuery('')}
            className={className(
              'flex items-center justify-center w-4 h-4 shrink-0 rounded-sm bg-transparent border-none cursor-pointer',
              tw.button.icon.default,
              tw.button.icon.hover,
            )}
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => store.setAddMenuOpen(!store.addMenuOpen)}
          title={t('add')}
          aria-expanded={store.addMenuOpen}
          aria-haspopup="menu"
          className={className(
            'flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer transition-colors',
            tw.button.icon.default,
            tw.button.icon.hover,
          )}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>

        {store.addMenuOpen ? (
          <div
            role="menu"
            className={className(
              'absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] py-1 rounded-lg border shadow-lg',
              tw.background.dialog,
              tw.border.dialog,
            )}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => store.openAddDialog()}
              className={className(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] border-none bg-transparent cursor-pointer',
                tw.text.primary,
                tw.background.dialogRow,
              )}
            >
              <FolderUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              {t('addFromLocal')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => store.openRepoDialog()}
              className={className(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] border-none bg-transparent cursor-pointer',
                tw.text.primary,
                tw.background.dialogRow,
              )}
            >
              <Github className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              {t('addFromRepo')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => store.openMarketplace()}
              className={className(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] border-none bg-transparent cursor-pointer',
                tw.text.primary,
                tw.background.dialogRow,
              )}
            >
              <Store className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              {t('addFromMarketplace')}
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => store.loadSkills({ notify: true })}
        disabled={store.isLoading}
        title={t('refresh')}
        className={className(
          'flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
          tw.button.icon.default,
          tw.button.icon.hover,
        )}
      >
        <RotateCw
          className={className(
            'w-3.5 h-3.5',
            store.isLoading && 'animate-spin',
          )}
          strokeWidth={2}
        />
      </button>
    </div>
  )
})

export default Toolbar
