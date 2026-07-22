import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import className from 'licia/className'
import map from 'licia/map'
import fileSize from 'licia/fileSize'
import type { IAvd } from '../../common/types'
import { tw } from '../theme'
import store from '../store'

interface AvdRowProps {
  item: IAvd
  selected: boolean
}

interface ColumnProps {
  children: ReactNode
  className?: string
  title?: string
}

interface HeaderColumn {
  key: string
  width: string
}

const HEADERS: HeaderColumn[] = [
  { key: 'name', width: 'w-[22%]' },
  { key: 'resolution', width: 'w-[12%]' },
  { key: 'sdkVersion', width: 'w-[8%]' },
  { key: 'abi', width: 'w-[14%]' },
  { key: 'memory', width: 'w-[10%]' },
  { key: 'storage', width: 'w-[10%]' },
  { key: 'status', width: 'w-[12%]' },
]

function Column({ children, className: extra, title }: ColumnProps) {
  return (
    <td
      className={className('px-2 py-[5px] text-[12px] truncate', extra)}
      title={title}
    >
      {children}
    </td>
  )
}

const AvdRow = observer(function AvdRow({ item, selected }: AvdRowProps) {
  const { t } = useTranslation()
  const running = item.pid > 0
  const text = selected ? tw.text.onSelect : tw.text.primary
  const muted = selected ? tw.text.onSelectMuted : tw.text.secondary

  return (
    <tr
      className={className(
        'cursor-default border-b',
        tw.border.divider,
        selected ? tw.background.rowSelected : tw.background.row,
      )}
      onClick={() => store.selectAvd(item)}
      onDoubleClick={() => {
        store.selectAvd(item)
        store.startAvd(item.id)
      }}
    >
      <Column className={className('font-medium', text)} title={item.name}>
        {item.name}
      </Column>
      <Column className={className('tabular-nums', muted)}>
        {item.resolution}
      </Column>
      <Column className={className('tabular-nums', muted)}>
        {item.sdkVersion}
      </Column>
      <Column className={muted} title={item.abi}>
        {item.abi}
      </Column>
      <Column className={className('tabular-nums', muted)}>
        {fileSize(item.memory * 1024 * 1024)}
      </Column>
      <Column className={className('tabular-nums', muted)}>
        {fileSize(item.internalStorage)}
      </Column>
      <Column className={muted}>{t(running ? 'running' : 'stopped')}</Column>
    </tr>
  )
})

const AvdList = observer(() => {
  const { t } = useTranslation()
  const rows = store.filteredAvds

  if (!store.isLoading && store.avds.length === 0) {
    return (
      <div
        className={className(
          'flex-1 flex items-center justify-center text-[12px] px-4 text-center',
          tw.empty,
        )}
      >
        {t('noAvds')}
      </div>
    )
  }

  if (!store.isLoading && rows.length === 0) {
    return (
      <div
        className={className(
          'flex-1 flex items-center justify-center text-[12px]',
          tw.empty,
        )}
      >
        {t('noMatches')}
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full border-collapse table-fixed">
        <thead
          className={className(
            'sticky top-0 z-10 border-b',
            tw.background.header,
            tw.border.divider,
          )}
        >
          <tr>
            {map(HEADERS, (col) => (
              <th
                key={col.key}
                className={className(
                  'px-2 py-1 text-left text-[11px] font-medium',
                  col.width,
                  tw.text.secondary,
                )}
              >
                {t(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {map(rows, (item) => (
            <AvdRow
              key={item.id}
              item={item}
              selected={store.avd?.id === item.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default AvdList
