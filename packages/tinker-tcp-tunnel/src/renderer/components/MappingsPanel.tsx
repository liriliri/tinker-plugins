import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Trash2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import Field from './Field'

const MappingsPanel = observer(() => {
  const { t } = useTranslation()
  const host = store.activeHost
  const status = store.status
  const disabled = status.state === 'connected' || status.state === 'connecting'

  return (
    <div className="flex flex-col gap-3 p-3">
      {!store.hosts.length ? (
        <p className={className('px-1 text-[12px]', tw.text.secondary)}>
          {t('needHostFirst')}
        </p>
      ) : !host ? (
        <p className={className('px-1 text-[12px]', tw.text.secondary)}>
          {t('selectHostFirst')}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {store.mappings.map((m) => {
            const live = status.activeRemotes.includes(m.remotePort)
            return (
              <section
                key={m.id}
                className={className(
                  'rounded-md border p-3',
                  tw.background.card,
                  tw.border.card,
                  live && tw.cardLive,
                )}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={className(
                        'font-mono text-[11px] tabular-nums',
                        tw.text.muted,
                      )}
                    >
                      :{m.remotePort} → {m.localHost}:{m.localPort}
                    </span>
                    {live ? (
                      <span
                        className={className(
                          tw.status.badge,
                          tw.background.accentSoft,
                          tw.text.good,
                        )}
                      >
                        <span
                          className={className(
                            'h-1.5 w-1.5 rounded-full',
                            tw.fill.good,
                          )}
                        />
                        {t('statusConnected')}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={tw.button.ghost}
                    title={t('remove')}
                    disabled={disabled || store.mappings.length <= 1}
                    onClick={() => store.removeMapping(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t('remotePort')}>
                    <input
                      className={tw.input}
                      type="number"
                      disabled={disabled}
                      value={m.remotePort}
                      onChange={(e) =>
                        store.updateMapping(m.id, {
                          remotePort: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field label={t('localHost')}>
                    <input
                      className={tw.input}
                      disabled={disabled}
                      value={m.localHost}
                      onChange={(e) =>
                        store.updateMapping(m.id, {
                          localHost: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label={t('localPort')}>
                    <input
                      className={tw.input}
                      type="number"
                      disabled={disabled}
                      value={m.localPort}
                      onChange={(e) =>
                        store.updateMapping(m.id, {
                          localPort: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {(store.error || status.message) && (
        <p className={className('px-1 text-[11px]', tw.text.bad)}>
          {store.error || status.message}
        </p>
      )}
    </div>
  )
})

export default MappingsPanel
