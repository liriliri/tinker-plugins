import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Plug, PlugZap, Plus } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const host = store.activeHost
  const status = store.status
  const connected = status.state === 'connected'
  const connecting = status.state === 'connecting'
  const busy = !!host && store.busyHostId === host.id
  const mappingLocked = connected || connecting

  return (
    <header
      className={className(
        'flex h-10 shrink-0 items-center justify-between gap-3 border-b px-3',
        tw.background.toolbar,
        tw.border.toolbar,
      )}
    >
      <span
        className={className(
          'min-w-0 truncate text-[13px] font-semibold tracking-tight',
          tw.text.primary,
        )}
      >
        {host ? host.name || host.relayHost || t('appTitle') : t('appTitle')}
      </span>
      {host ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className={tw.button.toolbar}
            disabled={mappingLocked}
            title={t('addMapping')}
            onClick={() => store.addMapping()}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addMapping')}
          </button>
          {connected || connecting ? (
            <button
              type="button"
              className={tw.button.danger}
              disabled={busy}
              onClick={() => store.disconnect(host.id)}
            >
              <PlugZap className="h-3.5 w-3.5" />
              {t('disconnect')}
            </button>
          ) : (
            <button
              type="button"
              className={tw.button.primary}
              disabled={busy || !store.canConnect}
              onClick={() => void store.connect(host.id)}
            >
              <Plug className="h-3.5 w-3.5" />
              {t('connect')}
            </button>
          )}
        </div>
      ) : null}
    </header>
  )
})

export default Toolbar
