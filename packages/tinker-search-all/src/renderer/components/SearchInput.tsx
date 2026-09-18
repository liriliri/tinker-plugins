import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const SearchInput = observer(function SearchInput() {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = () => inputRef.current?.focus()

    focus()
    const timer = window.setTimeout(focus, 0)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') focus()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div
      className={className(
        'flex items-center gap-2 px-3.5 h-[52px] shrink-0',
        tw.query.wrap,
      )}
    >
      <input
        ref={inputRef}
        value={store.query}
        onChange={(e) => store.setQuery(e.target.value)}
        placeholder={t('placeholder')}
        className={className(
          'flex-1 min-w-0 text-[17px] font-medium tracking-[-0.01em]',
          tw.query.input,
        )}
        spellCheck={false}
        autoComplete="off"
      />
      {store.query ? (
        <button
          type="button"
          onClick={() => store.setQuery('')}
          className={tw.iconBtn}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  )
})

export default SearchInput
