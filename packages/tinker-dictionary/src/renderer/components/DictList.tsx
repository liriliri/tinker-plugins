import { observer } from 'mobx-react-lite'
import { Plus, BookOpen, Library } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import { tw } from '../theme'
import store from '../store'

const DictList = observer(() => {
  const { t } = useTranslation()

  if (!store.showDictPanel) return null

  return (
    <div
      className={className(
        'w-48 shrink-0 flex flex-col border-r h-full',
        tw.border.divider,
        tw.background.sidebar,
      )}
    >
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        <div className="flex flex-col gap-px">
          <div
            onClick={() => store.selectDict(null)}
            className={className(
              'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors duration-75',
              store.selectedDictPath === null
                ? tw.list.itemActive
                : className(tw.list.item, tw.list.itemHover),
            )}
          >
            <Library className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
            <span className="flex-1 text-[12px] font-medium truncate">
              {t('all')}
            </span>
          </div>
          {map(store.dictList, (dict) => {
            const isActive = store.selectedDictPath === dict.path
            return (
              <div
                key={dict.path}
                onClick={() => store.selectDict(dict.path)}
                className={className(
                  'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors duration-75 group',
                  isActive
                    ? tw.list.itemActive
                    : className(tw.list.item, tw.list.itemHover),
                )}
                onContextMenu={(e) => {
                  e.preventDefault()
                  tinker.showContextMenu(e.clientX, e.clientY, [
                    {
                      label: t('showInFolder'),
                      click: () => tinker.showItemInPath(dict.path),
                    },
                    { type: 'separator' },
                    {
                      label: t('remove'),
                      click: () => void store.removeDictionary(dict.path),
                    },
                  ])
                }}
              >
                {dict.icon ? (
                  <img
                    src={dict.icon}
                    alt=""
                    className="w-3.5 h-3.5 shrink-0 rounded-sm"
                  />
                ) : (
                  <BookOpen
                    className={className('w-3.5 h-3.5 shrink-0', tw.text.muted)}
                    strokeWidth={1.8}
                  />
                )}
                <span className="flex-1 text-[12px] truncate" title={dict.path}>
                  {dict.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className={className('px-1.5 py-2 border-t', tw.border.divider)}>
        <button
          type="button"
          onClick={() => void store.openDictionary()}
          className={className(
            'w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm border border-dashed bg-transparent text-[12px] cursor-pointer transition-colors duration-100',
            tw.border.divider,
            tw.text.secondary,
            tw.list.itemHover,
          )}
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          {t('addDictionary')}
        </button>
      </div>
    </div>
  )
})

export default DictList
