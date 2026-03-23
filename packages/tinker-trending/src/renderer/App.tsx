import { useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { RefreshCw, Plus, TrendingUp } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import store from './store'
import { tw, getColors } from './theme'
import SourceCard from './components/SourceCard'
import MoreDialog from './components/MoreDialog'
import SourceIcon from './components/SourceIcon'
import { DndContext } from './components/dnd/DndContext'
import { useSortable } from './components/dnd/useSortable'
import type { SourceMeta } from './types'
import type { SourceId } from '../common/types'

function SortableCard({ source }: { source: SourceMeta }) {
  const { setHandleRef, setNodeRef, isDragging, overlayContainer } =
    useSortable(source.id)
  const colors = getColors(source.color)

  return (
    <>
      <SourceCard
        ref={setNodeRef}
        source={source}
        isDragging={isDragging}
        setHandleRef={setHandleRef}
      />
      {overlayContainer &&
        createPortal(
          <div
            className={`flex flex-col rounded-lg overflow-hidden p-3 ${colors.cardBg} opacity-90`}
            style={{ height: '380px' }}
          >
            <div
              className={`flex items-center px-1 pb-2.5 border-b ${colors.headerBorder} shrink-0`}
            >
              <SourceIcon source={source} className="w-5 h-5 mr-2" />
              <span
                className={`text-base font-bold flex-1 tracking-tight ${colors.name}`}
              >
                {source.name}
              </span>
            </div>
          </div>,
          overlayContainer,
        )}
    </>
  )
}

const App = observer(() => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { t } = useTranslation()
  const allLoading = store.activeSources.some((s) => store.loading[s.id])

  const handleDrop = useCallback((fromId: SourceId, toId: SourceId) => {
    store.moveSource(fromId, toId)
  }, [])

  return (
    <div className={`h-screen flex flex-col ${tw.bg.app} overflow-hidden`}>
      <div
        className={`flex items-center px-3 py-2 border-b ${tw.border.divider} ${tw.bg.toolbar} shrink-0`}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/15 dark:bg-orange-400/15">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
          </div>
          <span
            className={`text-sm font-semibold tracking-tight ${tw.text.primary}`}
          >
            {t('appTitle')}
          </span>
          <span
            className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${tw.bg.card} ${tw.text.muted} border ${tw.border.divider}`}
          >
            {store.activeSources.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => store.refreshAll()}
            disabled={allLoading}
            className={tw.button.icon}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 transition-transform ${allLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setDialogOpen(true)}
            className={tw.button.icon}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        <DndContext onDrop={handleDrop}>
          <div
            className="grid gap-3 content-start"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gridAutoRows: '380px',
            }}
          >
            {store.activeSources.map((s) => (
              <SortableCard key={s.id} source={s} />
            ))}
          </div>
        </DndContext>
      </div>

      {dialogOpen && <MoreDialog onClose={() => setDialogOpen(false)} />}
    </div>
  )
})

export default App
