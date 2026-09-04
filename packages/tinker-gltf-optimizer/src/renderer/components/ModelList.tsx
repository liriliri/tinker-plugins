import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Box, Check, Loader2 } from 'lucide-react'
import type { MenuItemConstructorOptions } from 'electron'
import map from 'licia/map'
import type { GltfItem } from '../../common/types'
import { tw } from '../theme'
import store from '../store'
import { formatSize, getReduction, isSmaller } from '../lib/util'

const VIEWER_ID = 'tinker-3d-viewer'

async function openIn3dViewer(path: string) {
  await tinker.openPlugin(VIEWER_ID)
  await tinker.callMcpTool(VIEWER_ID, 'open', { path })
}

interface ModelRowProps {
  item: GltfItem
}

const ModelRow = observer(function ModelRow({ item }: ModelRowProps) {
  const { t } = useTranslation()
  const options = store.optimizeOptions

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (item.isOptimizing) {
      return
    }

    const menuItems: MenuItemConstructorOptions[] = []

    if (item.isDone && item.outputPath) {
      if (await tinker.hasPlugin(VIEWER_ID)) {
        menuItems.push({
          label: t('openIn3dViewer'),
          click: () => {
            void openIn3dViewer(item.outputPath!)
          },
        })
      }
      menuItems.push({
        label: t('showInFileManager'),
        click: () => tinker.showItemInPath(item.outputPath!),
      })
      menuItems.push({ type: 'separator' })
    }

    menuItems.push({
      label: t('remove'),
      click: () => store.removeItem(item.id),
    })

    tinker.showContextMenu(e.clientX, e.clientY, menuItems)
  }

  return (
    <div
      className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 border-b last:border-b-0 ${tw.border} ${
        item.isOptimizing ? tw.bg.rowBusy : tw.bg.row
      } select-none transition-colors`}
      onContextMenu={(e) => {
        void handleContextMenu(e)
      }}
    >
      {item.isOptimizing ? (
        <div
          className={`absolute left-0 top-0 bottom-0 w-0.5 ${tw.accent.bar} ${tw.busyBar}`}
        />
      ) : null}

      <div
        className={`w-8 h-8 flex items-center justify-center rounded ${tw.bg.iconWell} ${tw.text.secondary} shrink-0`}
      >
        <Box size={15} strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-[12px] font-medium truncate ${tw.text.primary}`}>
          {item.fileName}
        </div>
        <div
          className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${tw.mono} ${tw.text.muted}`}
        >
          <span>
            {t('size')} {formatSize(item.originalSize)}
          </span>
          <span>·</span>
          <span>
            {t('meshRatio')}{' '}
            {options.simplifyEnabled
              ? `${Math.round(options.simplifyRatio * 100)}%`
              : '100%'}
          </span>
          <span>·</span>
          <span>
            {t('textureMax')} {options.textureResolution}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 min-w-[5.5rem] justify-end">
        {item.isOptimizing ? (
          <Loader2 size={14} className={`${tw.accent.text} animate-spin`} />
        ) : null}

        {item.isDone ? (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div
                className={`text-[12px] font-medium ${tw.mono} ${tw.text.primary}`}
              >
                {formatSize(item.outputSize)}
              </div>
              {item.originalSize > 0 ? (
                <div
                  className={`text-[10px] font-semibold ${tw.mono} ${
                    isSmaller(item) ? tw.status.success : tw.status.error
                  }`}
                >
                  {getReduction(item)}
                </div>
              ) : null}
            </div>
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center ${tw.accent.soft}`}
            >
              <Check size={10} className={tw.status.success} strokeWidth={3} />
            </div>
          </div>
        ) : null}

        {item.error ? (
          <div className="flex items-center gap-1 max-w-36" title={item.error}>
            <AlertCircle size={13} className={`${tw.status.error} shrink-0`} />
            <span className={`text-[10px] ${tw.status.error} truncate`}>
              {item.error.split('\n')[0]}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default observer(function ModelList() {
  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <div
        className={`rounded border overflow-hidden ${tw.border} ${tw.bg.surface} ${tw.panel}`}
      >
        {map(store.items, (item) => (
          <ModelRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
})
