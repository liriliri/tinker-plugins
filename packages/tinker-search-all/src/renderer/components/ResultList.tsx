import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppWindow,
  File,
  Loader2,
  Package,
  type LucideIcon,
} from 'lucide-react'
import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type { ResultCategory, SearchResultItem } from '../../common/types'
import { CATEGORY_LABEL } from '../lib/category'
import store from '../store'
import { tw } from '../theme'

const CATEGORY_ICON: Record<ResultCategory, LucideIcon> = {
  apps: AppWindow,
  plugins: Package,
  files: File,
}

interface ResultRowProps {
  item: SearchResultItem
  index: number
  active: boolean
}

const ResultRow = observer(function ResultRow({
  item,
  index,
  active,
}: ResultRowProps) {
  const { t } = useTranslation()
  const FallbackIcon = CATEGORY_ICON[item.category]
  const iconSrc = item.icon
    ? startWith(item.icon, 'data:')
      ? item.icon
      : fileUrl(item.icon)
    : ''

  useEffect(() => {
    if (item.category === 'files' && !item.icon) {
      void store.loadFileIcon(item.subtitle)
    }
  }, [item.category, item.icon, item.subtitle])

  return (
    <button
      type="button"
      data-index={index}
      onMouseEnter={() => store.setSelectedIndex(index)}
      onClick={() => void store.activate(item)}
      onContextMenu={(e) => {
        if (item.category !== 'files') return
        e.preventDefault()
        tinker.showContextMenu(e.clientX, e.clientY, [
          {
            label: t('showInFolder'),
            click: () => store.revealInFinder(item),
          },
        ])
      }}
      className={className(
        'w-full flex items-center gap-2.5 px-2 py-1.5 text-left border-none cursor-pointer rounded transition-[background-color,box-shadow,color] duration-100',
        active ? tw.row.active : tw.row.idle,
      )}
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          className="w-8 h-8 rounded shrink-0 object-contain"
        />
      ) : (
        <span
          className={className(
            'flex items-center justify-center w-8 h-8 rounded shrink-0',
            active ? 'opacity-90' : tw.row.iconFallback,
          )}
        >
          <FallbackIcon className="w-4 h-4" strokeWidth={1.75} />
        </span>
      )}
      <span className="flex-1 min-w-0 py-0.5">
        <span
          className={className(
            'block text-[13px] font-medium leading-tight truncate',
            active ? tw.row.titleActive : tw.row.title,
          )}
        >
          {item.title}
        </span>
        <span
          className={className(
            'block text-[11px] leading-tight truncate mt-0.5',
            active ? tw.row.subtitleActive : tw.row.subtitle,
          )}
        >
          {item.subtitle}
        </span>
      </span>
    </button>
  )
})

const ResultList = observer(function ResultList() {
  const { t } = useTranslation()
  const query = trim(store.query)
  const sections = store.sections
  const flat = store.flatResults

  useEffect(() => {
    const el = document.querySelector(`[data-index="${store.selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [store.selectedIndex, flat.length])

  const waitingFiles =
    store.searchingFiles &&
    !isStrBlank(query) &&
    isEmpty(flat) &&
    (store.category === 'all' || store.category === 'files')

  if (waitingFiles) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className={className('w-5 h-5 animate-spin', tw.empty)} />
      </div>
    )
  }

  if (isEmpty(sections)) {
    return (
      <div
        className={className(
          'flex-1 flex items-center justify-center text-[13px]',
          tw.empty,
        )}
      >
        {isStrBlank(query) ? t('emptyHint') : t('empty')}
      </div>
    )
  }

  let offset = 0

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-0.5">
      {sections.map((section) => {
        const sectionOffset = offset
        offset += section.items.length

        return (
          <div key={section.category} className="mb-1.5">
            {section.recent ? (
              <div
                className={className(
                  'px-2 pt-1 pb-1 text-[11px] font-medium tracking-wide',
                  tw.section,
                )}
              >
                {t('recent')}
              </div>
            ) : store.category === 'all' ? (
              <div
                className={className(
                  'px-2 pt-1 pb-1 text-[11px] font-medium tracking-wide',
                  tw.section,
                )}
              >
                {t(CATEGORY_LABEL[section.category])}
              </div>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item, i) => {
                const index = sectionOffset + i
                return (
                  <ResultRow
                    key={item.id}
                    item={item}
                    index={index}
                    active={index === store.selectedIndex}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ResultList
