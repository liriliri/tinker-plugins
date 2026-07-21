import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import filter from 'licia/filter'
import { Inbox } from 'lucide-react'
import type { FolderInfo, MailAddress } from '../../common/types'
import store from '../store'
import { formatMessageDate } from '../lib/dateFormat'
import { isTrashFolderPath } from '../lib/mail'
import { tw } from '../theme'

function formatSender(from: MailAddress[]): string {
  const first = from[0]
  if (!first) return ''
  return first.name || first.address
}

function moveTargetFolders(
  folders: FolderInfo[],
  currentFolder: string | null,
): FolderInfo[] {
  return filter(
    folders,
    (f) => f.path !== currentFolder && f.role !== 'drafts' && f.role !== 'sent',
  )
}

function folderLabel(folder: FolderInfo, t: (key: string) => string): string {
  return folder.role ? t(folder.role) : folder.name
}

const MessageList = observer(() => {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      !store.hasMoreMessages ||
      store.loadingMore ||
      store.loadingMessages ||
      store.messages.length === 0
    ) {
      return
    }
    const el = viewportRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight + 4) {
      void store.loadMoreMessages()
    }
  }, [
    store.messages.length,
    store.hasMoreMessages,
    store.loadingMore,
    store.loadingMessages,
  ])

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
        <ScrollArea.Root type="hover" className={tw.scrollArea.root}>
          <ScrollArea.Viewport
            ref={viewportRef}
            className={tw.scrollArea.viewport}
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollHeight - el.scrollTop - el.clientHeight > 80) return
              void store.loadMoreMessages()
            }}
          >
            {store.messages.map((msg) => {
              const active = store.selectedUid === msg.uid
              return (
                <button
                  key={msg.uid}
                  type="button"
                  className={`${tw.list.item} !flex flex-col justify-center border-b ${tw.border.divider} !px-3 !py-0 h-14 ${
                    active ? tw.background.selected : tw.background.hover
                  }`}
                  onClick={() => store.selectMessage(msg.uid)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (!active) store.selectMessage(msg.uid)
                    const inTrash = store.currentFolder
                      ? isTrashFolderPath(store.folders, store.currentFolder)
                      : false
                    const targets = moveTargetFolders(
                      store.folders,
                      store.currentFolder,
                    )
                    const standard = filter(targets, (f) => !!f.role)
                    const custom = filter(targets, (f) => !f.role)
                    const moveItems = [
                      ...standard.map((folder) => ({
                        label: folderLabel(folder, t),
                        click: () =>
                          void store.moveMessage(msg.uid, folder.path),
                      })),
                      ...(standard.length > 0 && custom.length > 0
                        ? [{ type: 'separator' as const }]
                        : []),
                      ...custom.map((folder) => ({
                        label: folderLabel(folder, t),
                        click: () =>
                          void store.moveMessage(msg.uid, folder.path),
                      })),
                    ]
                    tinker.showContextMenu(e.clientX, e.clientY, [
                      {
                        label: inTrash ? t('deletePermanently') : t('delete'),
                        click: () => void store.deleteMessage(msg.uid),
                      },
                      { type: 'separator' },
                      {
                        label: t('moveTo'),
                        enabled: moveItems.length > 0,
                        submenu: moveItems,
                      },
                    ])
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-[12.5px] leading-snug ${
                          msg.unseen ? tw.text.unread : tw.text.primary
                        }`}
                      >
                        {formatSender(msg.from) || t('from')}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] tabular-nums leading-snug ${
                          msg.unseen ? tw.text.accent : tw.text.muted
                        }`}
                      >
                        {formatMessageDate(msg.date)}
                      </span>
                    </div>
                    <div
                      className={`truncate text-[12px] leading-snug ${
                        msg.unseen ? tw.text.secondary : tw.text.muted
                      }`}
                    >
                      {msg.subject || t('noSubject')}
                    </div>
                  </div>
                </button>
              )
            })}
            {(store.loadingMore || store.hasMoreMessages) && (
              <div
                className={`flex items-center justify-center h-10 text-[11px] ${tw.text.muted}`}
              >
                {store.loadingMore ? (
                  <div className={tw.spinner} />
                ) : (
                  t('loadingMore')
                )}
              </div>
            )}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className={tw.scrollArea.scrollbar}
          >
            <ScrollArea.Thumb className={tw.scrollArea.thumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      )}
    </section>
  )
})

export default MessageList
