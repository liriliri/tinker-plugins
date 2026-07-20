import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import map from 'licia/map'
import { MailOpen } from 'lucide-react'
import type { MailAddress } from '../../common/types'
import store from '../store'
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
        <h1
          className={`text-[1.35rem] leading-snug font-semibold ${tw.text.primary}`}
        >
          {msg.subject || t('noSubject')}
        </h1>
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
            <span className={`${tw.text.muted} font-medium`}>{t('to')} · </span>
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
            <div className={`mt-1 text-[11.5px] tabular-nums ${tw.text.muted}`}>
              {dateFormat(new Date(msg.date), 'yyyy-mm-dd HH:MM')}
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {msg.html ? (
          <EmailFrame html={msg.html} title={msg.subject || t('noSubject')} />
        ) : (
          <pre className={tw.bodyText}>{msg.text || ''}</pre>
        )}
      </div>
    </article>
  )
})

export default MessageView
