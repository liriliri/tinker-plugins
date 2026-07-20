import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import dateFormat from 'licia/dateFormat'
import { Inbox } from 'lucide-react'
import type { MailAddress } from '../../common/types'
import store from '../store'
import { tw } from '../theme'

function formatSender(from: MailAddress[]): string {
  const first = from[0]
  if (!first) return ''
  return first.name || first.address
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return dateFormat(d, 'HH:MM')
  }
  return dateFormat(d, 'mm/dd')
}

const MessageList = observer(() => {
  const { t } = useTranslation()

  return (
    <section className={tw.shell.messages}>
      {store.loadingMessages && store.messages.length === 0 ? (
        <div className={tw.empty}>
          <div className={tw.spinner} />
        </div>
      ) : store.messages.length === 0 ? (
        <div className={tw.empty}>
          <Inbox className="w-8 h-8 opacity-35" />
          <span>
            {store.currentFolder ? t('noMessages') : t('selectFolder')}
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {store.messages.map((msg) => {
            const active = store.selectedUid === msg.uid
            return (
              <button
                key={msg.uid}
                type="button"
                className={`${tw.list.item} border-b ${tw.border.divider} px-3.5 py-3 ${
                  active ? tw.background.selected : tw.background.hover
                }`}
                onClick={() => store.selectMessage(msg.uid)}
              >
                {active && <span className={tw.list.spine} aria-hidden />}
                <div className="flex items-start gap-2.5">
                  {msg.unseen ? (
                    <span className={`${tw.list.unreadDot} mt-1.5`} />
                  ) : (
                    <span className="w-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-[13px] ${
                          msg.unseen ? tw.text.unread : tw.text.primary
                        }`}
                      >
                        {formatSender(msg.from) || t('from')}
                      </span>
                      <span
                        className={`shrink-0 text-[10.5px] tabular-nums ${
                          msg.unseen ? tw.text.accent : tw.text.muted
                        }`}
                      >
                        {formatDate(msg.date)}
                      </span>
                    </div>
                    <div
                      className={`truncate text-[12.5px] mt-0.5 ${
                        msg.unseen ? tw.text.secondary : tw.text.muted
                      }`}
                    >
                      {msg.subject || t('noSubject')}
                    </div>
                    {msg.snippet && (
                      <div
                        className={`truncate text-[11.5px] mt-1 leading-snug ${tw.text.muted}`}
                      >
                        {msg.snippet}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
})

export default MessageList
