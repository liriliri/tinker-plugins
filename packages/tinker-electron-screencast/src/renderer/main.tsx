import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import dateFormat from 'licia/dateFormat'
import map from 'licia/map'
import { Play, QrCode, RotateCw, Square, Trash2 } from 'lucide-react'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import DotSpinner from './components/DotSpinner'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const fieldClass = className(
  'h-6 px-1.5 rounded border text-[11px] outline-none transition-colors disabled:opacity-55',
  tw.background.input,
  tw.text.primary,
  tw.border.input,
  tw.border.focus,
)

function urlFromLog(message: string) {
  const match = message.match(/https?:\/\/[^\s)]+/)
  return match ? match[0] : null
}

const ElectronScreencast = observer(function ElectronScreencast() {
  const { t } = useTranslation()
  const running = store.status.running

  useEffect(() => {
    void store.loadApps()
    return () => store.dispose()
  }, [])

  return (
    <div
      className={className(
        'h-screen flex flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <section
        className={className(
          'shrink-0 border-b',
          tw.border.divider,
          tw.background.panel,
        )}
      >
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5">
            <label className="flex items-center gap-1 min-w-0 flex-1">
              <span
                className={className('text-[10px] shrink-0', tw.text.muted)}
              >
                {t('host')}
              </span>
              <select
                className={className(fieldClass, 'w-full min-w-0')}
                disabled={running}
                value={store.config.host}
                onChange={(e) => store.setHost(e.target.value)}
              >
                <option value="0.0.0.0">{t('hostLan')}</option>
                <option value="127.0.0.1">{t('hostLocal')}</option>
              </select>
            </label>
            <label className="flex items-center gap-1 min-w-0 flex-1">
              <span
                className={className('text-[10px] shrink-0', tw.text.muted)}
              >
                {t('port')}
              </span>
              <input
                className={className(fieldClass, 'w-full min-w-0')}
                type="number"
                min={1}
                max={65535}
                disabled={running}
                value={store.config.port}
                onChange={(e) => store.setPort(Number(e.target.value) || 9223)}
              />
            </label>
            <label className="flex items-center gap-1 min-w-0 flex-1">
              <span
                className={className('text-[10px] shrink-0', tw.text.muted)}
              >
                {t('username')}
              </span>
              <input
                className={className(fieldClass, 'w-full min-w-0')}
                type="text"
                disabled={running}
                value={store.config.username}
                placeholder={t('authHint')}
                onChange={(e) => store.setUsername(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-1 min-w-0 flex-1">
              <span
                className={className('text-[10px] shrink-0', tw.text.muted)}
              >
                {t('password')}
              </span>
              <input
                className={className(fieldClass, 'w-full min-w-0')}
                type="password"
                disabled={running}
                value={store.config.password}
                onChange={(e) => store.setPassword(e.target.value)}
              />
            </label>

            {running ? (
              <button
                type="button"
                className={className(
                  'h-6 w-6 inline-flex items-center justify-center rounded border-none cursor-pointer shrink-0',
                  tw.button.danger,
                )}
                disabled={store.busy}
                onClick={() => store.stopServer()}
                aria-label={t('stop')}
                title={t('stop')}
              >
                <Square className="w-3 h-3" fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                className={className(
                  'h-6 w-6 inline-flex items-center justify-center rounded border-none cursor-pointer shrink-0',
                  tw.button.primary,
                )}
                disabled={store.busy}
                onClick={() => store.startServer()}
                aria-label={t('start')}
                title={t('start')}
              >
                <Play className="w-3.5 h-3.5" fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        {store.error ? (
          <div className={className('px-2.5 py-1 text-[11px]', tw.text.error)}>
            {store.error === 'qrcodeMissing' ? t('qrcodeMissing') : store.error}
          </div>
        ) : null}
      </section>

      <div className="flex-1 min-h-0 grid grid-cols-2">
        <section
          className={className(
            'flex flex-col min-h-0 border-r',
            tw.border.divider,
            tw.background.panel,
          )}
        >
          <div
            className={className(
              'flex items-center h-7 px-2 border-b',
              tw.border.divider,
            )}
          >
            <h2
              className={className(
                'text-[11px] font-semibold tracking-wide uppercase',
                tw.text.secondary,
              )}
            >
              {t('apps')}
            </h2>
            <span
              className={className(
                'ml-1.5 text-[10px] tabular-nums',
                tw.text.muted,
              )}
            >
              {store.apps.length}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              className={className(
                'p-1 rounded bg-transparent border-none cursor-pointer',
                tw.button.icon,
              )}
              onClick={() => store.loadApps()}
              aria-label={t('refresh')}
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
          <div
            className={className(
              'flex-1 overflow-y-auto p-1.5',
              tw.background.inset,
            )}
          >
            {store.loadingApps ? (
              <div className="flex items-center justify-center h-full">
                <DotSpinner size="sm" />
              </div>
            ) : store.apps.length === 0 ? (
              <div
                className={className(
                  'flex items-center justify-center h-full text-[11px]',
                  tw.text.muted,
                )}
              >
                {t('noApps')}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-0.5">
                {map(store.apps, (app) => (
                  <div
                    key={app.path}
                    className={className(
                      'group flex flex-col items-center gap-1 p-1.5 rounded-md',
                      tw.appCard.base,
                      tw.appCard.hover,
                    )}
                    title={app.path}
                  >
                    <img
                      src={fileUrl(app.icon)}
                      alt={app.name}
                      className="w-8 h-8 object-contain"
                      draggable={false}
                    />
                    <span
                      className={className(
                        'text-[10px] text-center leading-tight line-clamp-2 w-full',
                        tw.text.secondary,
                      )}
                    >
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className={className('flex flex-col min-h-0', tw.background.panel)}
        >
          <div
            className={className(
              'flex items-center h-7 px-2 border-b',
              tw.border.divider,
            )}
          >
            <h2
              className={className(
                'text-[11px] font-semibold tracking-wide uppercase',
                tw.text.secondary,
              )}
            >
              {t('logs')}
            </h2>
            <span
              className={className(
                'ml-1.5 text-[10px] tabular-nums',
                tw.text.muted,
              )}
            >
              {store.logs.length}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              className={className(
                'p-1 rounded bg-transparent border-none cursor-pointer',
                tw.button.icon,
              )}
              onClick={() => store.clearLogs()}
              aria-label={t('clearLogs')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <div
            className={className(
              'flex-1 overflow-y-auto px-2 py-1.5 font-mono text-[10.5px] leading-relaxed',
              tw.background.log,
            )}
          >
            {store.logs.length === 0 ? (
              <div
                className={className(
                  'flex items-center justify-center h-full',
                  tw.text.muted,
                )}
              >
                {t('noLogs')}
              </div>
            ) : (
              <div className="space-y-0.5">
                {map(store.reversedLogs, (log) => {
                  const url = urlFromLog(log.message)
                  return (
                    <div key={log.id} className="flex gap-2 items-start">
                      <span
                        className={className(
                          'shrink-0 tabular-nums',
                          tw.text.logTime,
                        )}
                      >
                        {dateFormat(new Date(log.time), 'HH:MM:ss')}
                      </span>
                      <span
                        className={className(
                          'flex-1 min-w-0 break-all',
                          log.level === 'error'
                            ? tw.text.error
                            : log.level === 'warn'
                              ? tw.text.warn
                              : tw.text.log,
                        )}
                      >
                        {log.message}
                      </span>
                      {url ? (
                        <button
                          type="button"
                          className={className(
                            'h-4 w-4 mt-0.5 inline-flex items-center justify-center rounded bg-transparent border-none cursor-pointer shrink-0',
                            tw.button.icon,
                          )}
                          onClick={() => store.showQrcode(url)}
                          aria-label={t('showQrcode')}
                          title={t('showQrcode')}
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
})

renderApp(ElectronScreencast, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
