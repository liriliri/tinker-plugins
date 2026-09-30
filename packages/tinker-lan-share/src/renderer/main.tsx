import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import toNum from 'licia/toNum'
import {
  Check,
  Copy,
  FolderOpen,
  Play,
  QrCode,
  Square,
  Trash2,
} from 'lucide-react'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import ClearConfirmDialog from './components/ClearConfirmDialog'
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

const btnClass = className(
  'h-6 px-2 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors disabled:cursor-not-allowed',
)

const App = observer(function App() {
  const { t } = useTranslation()
  const running = store.status.running
  const errorText =
    store.error === 'qrcodeMissing' ? t('qrcodeMissing') : store.error

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
        <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap">
          <label className="flex items-center gap-1">
            <span className={className('text-[10px] shrink-0', tw.text.muted)}>
              {t('port')}
            </span>
            <input
              className={className(fieldClass, 'w-[72px]')}
              type="number"
              min={1024}
              max={65535}
              disabled={running || store.busy}
              value={store.config.port}
              onChange={(e) => store.setPort(toNum(e.target.value) || 18080)}
            />
          </label>

          {running ? (
            <div className="flex items-center gap-0.5 min-w-0">
              <button
                type="button"
                className={className(
                  'text-[11px] truncate max-w-[220px] font-mono text-left hover:underline',
                  tw.text.link,
                )}
                title={store.primaryUrl}
                onClick={() => void store.openInBrowser()}
              >
                {store.primaryUrl}
              </button>
              <button
                type="button"
                className={className(
                  'shrink-0 w-5 h-5 inline-flex items-center justify-center rounded',
                  store.urlCopied ? tw.text.success : tw.button.icon,
                )}
                title={t('copyUrl')}
                onClick={() => void store.copyUrl()}
              >
                {store.urlCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          ) : null}

          <div className="flex-1" />

          {running ? (
            <>
              <button
                type="button"
                className={className(btnClass, tw.button.ghost)}
                title={t('openFolder')}
                onClick={() => void store.openShareDir()}
              >
                <FolderOpen size={12} />
                {t('openFolder')}
              </button>
              <button
                type="button"
                className={className(btnClass, tw.button.ghost)}
                title={t('showQrcode')}
                onClick={() => void store.showQrcode()}
              >
                <QrCode size={12} />
                {t('showQrcode')}
              </button>
              <button
                type="button"
                className={className(btnClass, tw.button.ghost)}
                title={t('clear')}
                onClick={() => store.setClearConfirmOpen(true)}
              >
                <Trash2 size={12} />
                {t('clear')}
              </button>
              <button
                type="button"
                className={className(btnClass, tw.button.danger)}
                disabled={store.busy}
                onClick={() => void store.stopServer()}
              >
                <Square size={12} />
                {t('stop')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={className(btnClass, tw.button.primary)}
              disabled={store.busy}
              onClick={() => void store.startServer()}
            >
              <Play size={12} />
              {t('start')}
            </button>
          )}
        </div>

        {errorText ? (
          <div className={className('px-2 pb-1.5 text-[11px]', tw.text.error)}>
            {errorText}
          </div>
        ) : null}
      </section>

      {running && store.previewUrl ? (
        <iframe
          key={store.iframeKey}
          title="lan-share"
          src={store.previewUrl}
          className={className('flex-1 w-full border-0', tw.background.iframe)}
        />
      ) : (
        <div
          className={className(
            'flex-1 flex items-center justify-center px-6 text-center text-[13px]',
            tw.text.secondary,
          )}
        >
          {t('stoppedHint')}
        </div>
      )}

      <ClearConfirmDialog />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
