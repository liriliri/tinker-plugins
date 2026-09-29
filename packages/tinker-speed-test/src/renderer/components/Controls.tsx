import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import startWith from 'licia/startWith'
import { phaseI18nKey } from '../lib/phase'
import store from '../store'
import { tw } from '../theme'

export default observer(function Controls() {
  const { t, i18n } = useTranslation()
  const zh = startWith(i18n.language, 'zh')
  const status = store.running
    ? 'running'
    : store.phase === 'done'
      ? 'done'
      : 'idle'

  return (
    <header
      className={className(
        'flex h-11 shrink-0 items-center gap-2 px-3',
        tw.chrome,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={tw.label}>{t('node')}</span>
        <select
          className={tw.select}
          value={store.nodeId}
          disabled={store.running}
          onChange={(e) => store.setNodeId(e.target.value)}
        >
          {store.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {zh ? node.nameZh : node.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={tw.label}>{t('unit')}</span>
        <select
          className={className(tw.select, 'min-w-[5.5rem]')}
          value={store.unit}
          onChange={(e) =>
            store.setUnit(e.target.value === 'mbs' ? 'mbs' : 'mbps')
          }
        >
          <option value="mbps">Mbps</option>
          <option value="mbs">MB/s</option>
        </select>
      </div>

      <div
        className={className(
          'ml-2 min-w-0 flex-1 truncate text-[12px]',
          tw.mono,
          tw.muted,
        )}
        title={`${t('publicIp')} ${store.ip}`}
      >
        {t('publicIp')} <span className={tw.ink}>{store.ip}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          className={className(
            'inline-flex items-center gap-1.5 text-[11px]',
            tw.muted,
          )}
        >
          <span className={tw.statusDot} data-state={status} />
          {t(phaseI18nKey(store.phase))}
        </span>
        <button
          type="button"
          className={store.running ? tw.btnStop : tw.btnPrimary}
          onClick={() => store.toggle()}
        >
          {store.running ? t('stop') : t('start')}
        </button>
      </div>
    </header>
  )
})
