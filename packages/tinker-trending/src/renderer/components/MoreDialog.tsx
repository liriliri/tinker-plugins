import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, RefreshCw, Check, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import type { SourceMeta } from '../types'
import { getColors, tw } from '../theme'
import { SOURCES } from '../lib/sources'
import store, { previewStore } from '../store'
import { HottestList, TimelineList } from './NewsList'
import SourceIcon from './SourceIcon'

interface Props {
  onClose: () => void
}

interface CardPreviewProps {
  source: SourceMeta
  onToggle: () => void
}

const CardPreview = observer(({ source, onToggle }: CardPreviewProps) => {
  const { t } = useTranslation()
  const colors = getColors(source.color)
  const isActive = store.activeSourceIds.includes(source.id)

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden h-full ${colors.cardBg} ${colors.card}`}
    >
      <div
        className={`flex items-center px-3 py-2.5 border-b ${colors.headerBorder} shrink-0`}
      >
        <SourceIcon source={source} className="w-3.5 h-3.5 mr-2" />
        <span
          className={`text-xs font-semibold flex-1 tracking-tight ${colors.name}`}
        >
          {source.name}
        </span>
        <button
          onClick={() => previewStore.fetch(source.id)}
          disabled={previewStore.loading}
          className={`p-1.5 rounded-md transition-colors duration-150 disabled:opacity-40 cursor-pointer ${colors.refreshBtn}`}
        >
          <RefreshCw
            className={`w-3 h-3 ${previewStore.loading ? 'animate-spin' : ''}`}
          />
        </button>
        <button
          onClick={onToggle}
          className={`ml-1 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            isActive ? tw.dialog.removeBtn : `${colors.badge} hover:opacity-80`
          }`}
        >
          {isActive ? (
            <>
              <X className="w-2.5 h-2.5" />
              {t('remove')}
            </>
          ) : (
            <>
              <Plus className="w-2.5 h-2.5" />
              {t('add')}
            </>
          )}
        </button>
      </div>

      <div className="px-2 pb-2 pt-1.5 flex-1 overflow-hidden">
        <div
          className={`rounded-md overflow-hidden h-full ${colors.contentBg}`}
        >
          <div className="overflow-y-auto h-full">
            {previewStore.loading ? (
              <div
                className={`flex items-center justify-center h-full text-xs ${tw.text.muted}`}
              >
                <span className="animate-pulse">{t('loading')}</span>
              </div>
            ) : previewStore.error ? (
              <div
                className={`flex items-center justify-center h-full text-xs ${tw.text.error} px-4 text-center`}
              >
                {previewStore.error}
              </div>
            ) : previewStore.items.length === 0 ? (
              <div
                className={`flex items-center justify-center h-full text-xs ${tw.text.muted}`}
              >
                {t('noData')}
              </div>
            ) : source.type === 'hottest' ? (
              <HottestList items={previewStore.items} colors={colors} />
            ) : (
              <TimelineList items={previewStore.items} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

const MoreDialog = observer(({ onClose }: Props) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SourceMeta | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const queryLower = query.toLowerCase()
  const filtered = useMemo(
    () => SOURCES.filter((s) => s.name.toLowerCase().includes(queryLower)),
    [queryLower],
  )

  const handleSelect = useCallback((source: SourceMeta) => {
    setSelected(source)
    previewStore.fetch(source.id)
  }, [])

  const handleToggle = useCallback(() => {
    if (!selected) return
    if (store.activeSourceIds.includes(selected.id)) {
      store.removeSource(selected.id)
    } else {
      store.addSource(selected.id)
    }
  }, [selected])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div
        className={`flex w-[640px] h-[480px] rounded-xl shadow-2xl border ${tw.border.divider} ${tw.bg.card} overflow-hidden`}
      >
        <div
          className={`w-48 flex flex-col border-r ${tw.border.divider} shrink-0`}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2.5 border-b ${tw.border.divider}`}
          >
            <Search className={`w-3.5 h-3.5 shrink-0 ${tw.text.muted}`} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              className={`flex-1 text-xs bg-transparent outline-none ${tw.text.primary} ${tw.dialog.inputPlaceholder}`}
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.map((source) => {
              const isActive = store.activeSourceIds.includes(source.id)
              const isSelected = selected?.id === source.id
              const colors = getColors(source.color)
              return (
                <button
                  key={source.id}
                  onClick={() => handleSelect(source)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 cursor-pointer ${
                    isSelected ? tw.bg.app : tw.dialog.listItemHover
                  }`}
                >
                  <SourceIcon
                    source={source}
                    className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-45 grayscale-[0.2]'}`}
                  />
                  <span className={`flex-1 text-xs ${tw.text.primary}`}>
                    {source.name}
                  </span>
                  {isActive && (
                    <Check className={`w-3 h-3 shrink-0 ${colors.name}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-3">
          {selected ? (
            <CardPreview source={selected} onToggle={handleToggle} />
          ) : (
            <div
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 text-xs ${tw.text.muted}`}
            >
              <Search className="w-5 h-5 opacity-30" />
              <span>{t('selectSource')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default MoreDialog
