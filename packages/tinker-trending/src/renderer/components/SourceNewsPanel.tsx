import { useTranslation } from 'react-i18next'
import type { NewsItem } from '../../common/types'
import type { SourceColorTokens } from '../theme'
import { tw } from '../theme'
import type { SourceType } from '../types'
import { HottestList, TimelineList } from './NewsList'

interface SourceNewsPanelProps {
  loading: boolean
  error: string
  items: NewsItem[]
  type: SourceType
  colors: SourceColorTokens
  showEmpty?: boolean
  dimWhileLoading?: boolean
}

export function SourceNewsPanel({
  loading,
  error,
  items,
  type,
  colors,
  showEmpty = false,
  dimWhileLoading = false,
}: SourceNewsPanelProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`overflow-y-auto h-full transition-opacity duration-300 ${dimWhileLoading && loading && items.length ? 'opacity-40' : 'opacity-100'}`}
    >
      {loading && !items.length ? (
        <div
          className={`flex items-center justify-center h-full text-xs ${tw.text.muted}`}
        >
          <span className="animate-pulse">{t('loading')}</span>
        </div>
      ) : error ? (
        <div
          className={`flex items-center justify-center h-full text-xs ${tw.text.error} px-4 text-center`}
        >
          {error}
        </div>
      ) : showEmpty && !items.length ? (
        <div
          className={`flex items-center justify-center h-full text-xs ${tw.text.muted}`}
        >
          {t('noData')}
        </div>
      ) : type === 'hottest' ? (
        <HottestList items={items} colors={colors} />
      ) : (
        <TimelineList items={items} />
      )}
    </div>
  )
}
