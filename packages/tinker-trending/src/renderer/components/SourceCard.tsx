import { forwardRef } from 'react'
import { observer } from 'mobx-react-lite'
import { RefreshCw, X, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SourceMeta } from '../types'
import { getColors } from '../theme'
import store from '../store'
import { SourceNewsPanel } from './SourceNewsPanel'
import SourceIcon from './SourceIcon'

interface Props {
  source: SourceMeta
  isDragging?: boolean
  setHandleRef?: (el: HTMLElement | null) => void
}

const SourceCardInner = forwardRef<HTMLDivElement, Props>(
  ({ source, isDragging, setHandleRef }, ref) => {
    const { t } = useTranslation()
    const { id, name, color, type } = source
    const colors = getColors(color)
    const items = store.items[id]
    const loading = store.loading[id]
    const error = store.errors[id]

    return (
      <div
        ref={ref}
        className={`flex flex-col h-full rounded-lg overflow-hidden p-3 ${colors.cardBg} transition-opacity duration-200 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      >
        <div
          className={`flex items-center px-1 pb-2.5 border-b ${colors.headerBorder} shrink-0`}
        >
          <div
            ref={setHandleRef}
            className={`mr-1 p-0.5 rounded cursor-grab ${colors.refreshBtn}`}
            title={t('dragToReorder')}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <SourceIcon source={source} className="w-5 h-5 mr-2" />
          <span
            className={`text-base font-bold flex-1 tracking-tight ${colors.name}`}
          >
            {name}
          </span>
          <button
            onClick={() => store.refresh(id)}
            disabled={loading}
            className={`p-1.5 rounded-md transition-colors duration-150 disabled:opacity-40 cursor-pointer ${colors.refreshBtn}`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => store.removeSource(id)}
            className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${colors.refreshBtn}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 pt-2">
          <div
            className={`rounded-md overflow-hidden h-full ${colors.contentBg}`}
          >
            <SourceNewsPanel
              loading={loading}
              error={error}
              items={items}
              type={type}
              colors={colors}
              dimWhileLoading
            />
          </div>
        </div>
      </div>
    )
  },
)

const SourceCard = observer(SourceCardInner)

export default SourceCard
