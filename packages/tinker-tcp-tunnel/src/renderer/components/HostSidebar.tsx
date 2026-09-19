import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { statusDotClass } from '../lib/util'

const HostSidebar = observer(() => {
  const { t } = useTranslation()

  return (
    <aside
      className={className(
        'flex w-56 shrink-0 flex-col border-r',
        tw.background.sidebar,
        tw.border.toolbar,
      )}
    >
      <div
        className={className(
          'flex h-10 shrink-0 items-center justify-between gap-3 border-b px-3',
          tw.background.toolbar,
          tw.border.toolbar,
        )}
      >
        <span
          className={className(
            'truncate text-[13px] font-semibold tracking-tight',
            tw.text.primary,
          )}
        >
          {t('tabHosts')}
        </span>
        <button
          type="button"
          className={tw.button.ghost}
          title={t('addHost')}
          onClick={() => store.openCreateHost()}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {!store.hosts.length ? (
          <p className={className('px-1.5 py-2 text-[11px]', tw.text.muted)}>
            {t('noHosts')}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {store.hosts.map((h) => {
              const active = h.id === store.appData.activeHostId
              const state = store.statusOf(h.id).state
              return (
                <li key={h.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => store.selectHost(h.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      store.openEditHost(h.id)
                    }}
                    className={className(
                      'flex w-full flex-col items-start gap-0.5 rounded-[5px] py-1.5 pl-2 pr-14 text-left transition-colors',
                      active ? tw.sidebar.itemActive : tw.sidebar.item,
                    )}
                  >
                    <span className="flex w-full items-center gap-1.5">
                      <span
                        className={className(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          statusDotClass(state),
                        )}
                      />
                      <span
                        className={className(
                          'min-w-0 flex-1 truncate text-[12px] font-medium',
                          tw.text.primary,
                        )}
                      >
                        {h.name || h.relayHost || h.id}
                      </span>
                    </span>
                    {h.relayHost ? (
                      <span
                        className={className(
                          'w-full truncate pl-3 font-mono text-[10px]',
                          tw.text.muted,
                        )}
                      >
                        {h.relayHost}:{h.relayPort}
                      </span>
                    ) : null}
                  </button>
                  <div className="absolute right-0.5 top-1/2 z-10 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className={tw.button.ghost}
                      title={t('editHost')}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        store.openEditHost(h.id)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className={tw.button.ghost}
                      title={t('removeHost')}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        store.removeHost(h.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
})

export default HostSidebar
