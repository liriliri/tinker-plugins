import { observer } from 'mobx-react-lite'
import { Download, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import type { IVersionEntry } from '../../common/types'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'
import TooltipIconButton from './TooltipIconButton'

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
  { key: 'version', width: 'w-[30%]' },
  { key: 'meta', width: 'w-[34%]' },
  { key: 'status', width: 'w-[18%]' },
  { key: 'actions', width: 'w-[18%]' },
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

interface VersionRowProps {
  item: IVersionEntry
}

const VersionRow = observer(function VersionRow({ item }: VersionRowProps) {
  const { t } = useTranslation()
  const metaParts = item.installed ? item.aliases : item.lts ? [item.lts] : []
  const metaText = isEmpty(metaParts) ? '—' : metaParts.join(', ')
  const status = item.isDefault
    ? t('default')
    : item.isSystem
      ? t('system')
      : item.installed
        ? t('installed')
        : t('available')

  return (
    <tr
      className={className(
        'border-b',
        tw.border.divider,
        item.isDefault ? tw.background.rowDefault : tw.background.row,
      )}
    >
      <Column className={className('font-medium', tw.text.primary)}>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span className="version-mono truncate">{item.version}</span>
          {!item.installed && item.lts ? (
            <span className={tw.badgeLts}>{t('lts')}</span>
          ) : null}
        </span>
      </Column>
      <Column className={tw.text.secondary} title={metaText}>
        {metaText}
      </Column>
      <Column className={tw.text.secondary}>{status}</Column>
      <td className="px-1 py-[3px]">
        <div className="flex items-center justify-end gap-0.5">
          {!item.installed && !item.isSystem ? (
            <TooltipIconButton
              title={t('install')}
              disabled={store.isBusy}
              onClick={() => store.installVersion(item.version)}
            >
              <Download className="w-3.5 h-3.5" />
            </TooltipIconButton>
          ) : null}
          {item.installed && !item.isSystem ? (
            <>
              {!item.isDefault ? (
                <TooltipIconButton
                  title={t('setDefault')}
                  disabled={store.isBusy}
                  onClick={() => store.setDefault(item.id)}
                >
                  <Star className="w-3.5 h-3.5" />
                </TooltipIconButton>
              ) : null}
              <TooltipIconButton
                title={t('uninstall')}
                disabled={store.isBusy}
                onClick={() => store.openUninstallDialog(item)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </TooltipIconButton>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  )
})

const VersionList = observer(() => {
  const { t } = useTranslation()
  const rows = store.filteredEntries
  const empty = isEmpty(store.entries)

  if (!store.isLoading && (empty || isEmpty(rows))) {
    return (
      <div
        className={className(
          'flex-1 flex items-center justify-center text-[12px] px-4 text-center',
          tw.empty,
        )}
      >
        {t(empty ? 'noVersions' : 'noMatches')}
      </div>
    )
  }

  return (
    <Tooltip.Provider delayDuration={500}>
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          className={className(
            'shrink-0 border-b',
            tw.background.header,
            tw.border.divider,
          )}
        >
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              {map(HEADERS, (col) => (
                <col key={col.key} className={col.width} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {map(HEADERS, (col) => (
                  <th
                    key={col.key}
                    className={className(
                      'px-2 py-1 text-[11px] font-medium',
                      tw.text.secondary,
                      col.key === 'actions' ? 'text-right' : 'text-left',
                    )}
                  >
                    {col.key === 'actions' ? '' : t(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <AppScrollArea>
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              {map(HEADERS, (col) => (
                <col key={col.key} className={col.width} />
              ))}
            </colgroup>
            <tbody>
              {map(rows, (item) => (
                <VersionRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </AppScrollArea>
      </div>
    </Tooltip.Provider>
  )
})

export default VersionList
