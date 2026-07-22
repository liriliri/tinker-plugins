import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import map from 'licia/map'
import { ChevronDown, MailOpen } from 'lucide-react'
import type { MailAddress } from '../../common/types'
import store from '../store'
import { formatMessageDate, fullTimeString } from '../lib/dateFormat'
import { tw } from '../theme'
import EmailFrame from './EmailFrame'

function formatAddresses(list: MailAddress[]): string {
  return map(list, (a) =>
    a.name ? `${a.name} <${a.address}>` : a.address,
  ).join(', ')
}

const MessageView = observer(() => {
  const { t } = useTranslation()
  const msg = store.message
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    setDetailsOpen(false)
  }, [msg?.uid])

  if (store.loadingMessage && !msg) {
    return (
      <div className={`${tw.empty} ${tw.background.muted}`}>
        <div className={tw.spinner} />
      </div>
    )
  }

  if (!msg) {
    return (
      <div className={`${tw.empty} ${tw.background.muted}`}>
        <div className={tw.emptyIcon} aria-hidden>
          <MailOpen className="w-5 h-5" />
        </div>
        <span>{t('selectMessage')}</span>
      </div>
    )
  }

  return (
    <article
      key={msg.uid}
      className={`flex-1 min-w-0 flex flex-col ${tw.background.muted}`}
    >
      <header
        className={`px-6 py-5 border-b ${tw.border.divider} ${tw.background.muted}`}
      >
        <div className="flex items-start gap-2">
          <h1
            className={`flex-1 min-w-0 text-[1.35rem] leading-snug font-semibold ${tw.text.primary}`}
          >
            {msg.subject || t('noSubject')}
          </h1>
          <button
            type="button"
            className={`${tw.button.icon} ${detailsOpen ? tw.button.iconActive : ''} shrink-0 mt-0.5`}
            aria-expanded={detailsOpen}
            aria-label={t(detailsOpen ? 'hideDetails' : 'showDetails')}
            title={t(detailsOpen ? 'hideDetails' : 'showDetails')}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {detailsOpen && (
          <div
            className={`mt-3 grid gap-1 text-[12.5px] leading-relaxed ${tw.text.secondary}`}
          >
            <div>
              <span className={`${tw.text.muted} font-medium`}>
                {t('from')} ·{' '}
              </span>
              {formatAddresses(msg.from)}
            </div>
            <div>
              <span className={`${tw.text.muted} font-medium`}>
                {t('to')} ·{' '}
              </span>
              {formatAddresses(msg.to)}
            </div>
            {msg.cc.length > 0 && (
              <div>
                <span className={`${tw.text.muted} font-medium`}>
                  {t('cc')} ·{' '}
                </span>
                {formatAddresses(msg.cc)}
              </div>
            )}
            {msg.date && (
              <div title={fullTimeString(new Date(msg.date))}>
                <span className={`${tw.text.muted} font-medium`}>
                  {t('date')} ·{' '}
                </span>
                <span className="tabular-nums">
                  {formatMessageDate(msg.date, 'medium')}
                </span>
              </div>
            )}
            {msg.size != null && msg.size > 0 && (
              <div>
                <span className={`${tw.text.muted} font-medium`}>
                  {t('size')} ·{' '}
                </span>
                <span className="tabular-nums">{fileSize(msg.size)}B</span>
              </div>
            )}
          </div>
        )}
      </header>
      <div
        className="flex-1 overflow-y-auto px-6 py-5"
        style={{
          background: store.readerDark ? tw.readerBg.dark : tw.readerBg.light,
        }}
      >
        {msg.html ? (
          <EmailFrame html={msg.html} title={msg.subject || t('noSubject')} />
        ) : (
          <pre
            className={`${tw.bodyText} ${
              store.readerDark ? tw.bodyTextDark : tw.bodyTextLight
            }`}
          >
            {msg.text || ''}
          </pre>
        )}
      </div>
    </article>
  )
})

export default MessageView
