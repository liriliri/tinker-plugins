import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import store from '../store'
import { tw, xtermTheme } from '../theme'
import type { PageInfo } from '../types'
import Xterm from './Xterm'

interface PageRowProps {
  page: PageInfo
  nodePort: number
}

const PageRow = observer(({ page, nodePort }: PageRowProps) => {
  const { t } = useTranslation()
  const typeStyle =
    page.type === 'node'
      ? tw.pageType.node
      : page.type === 'page'
        ? tw.pageType.page
        : tw.pageType.other

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-b ${tw.border.divider} last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors duration-100 group`}
    >
      <span
        className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}
      >
        {page.type}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-[12px] ${tw.text.primary} truncate leading-snug`}>
          {page.title || page.url}
        </div>
        {page.title && (
          <div className={`text-[10.5px] ${tw.text.muted} truncate mt-0.5`}>
            {page.url}
          </div>
        )}
      </div>
      <button
        className={`shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer bg-transparent transition-all duration-150 ${tw.button.inspect}`}
        onClick={() =>
          electronDebug
            .openDevTools(nodePort, page.devtoolsFrontendUrl)
            .catch((e) => alert(e?.message || String(e)))
        }
      >
        {t('inspect')}
      </button>
    </div>
  )
})

const DebugView = observer(() => {
  const { t } = useTranslation()
  const { activeSession } = store
  const theme = store.isDark ? xtermTheme.dark : xtermTheme.light

  return (
    <div className="flex flex-col h-full">
      {activeSession ? (
        <>
          <div
            className={`shrink-0 border-b ${tw.border.divider} max-h-48 overflow-y-auto`}
          >
            {activeSession.pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="flex gap-1">
                  <span
                    className={`w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse`}
                  />
                  <span
                    className={`w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse-2`}
                  />
                  <span
                    className={`w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse-3`}
                  />
                </div>
                <span className={`text-[11px] ${tw.text.muted}`}>
                  {t('waitingForDebug')}
                </span>
              </div>
            ) : (
              activeSession.pages.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  nodePort={activeSession.nodePort}
                />
              ))
            )}
          </div>

          <div className={`flex-1 min-h-0 p-1 ${tw.background.term}`}>
            <Xterm
              key={activeSession.sessionId}
              content={activeSession.log}
              theme={theme}
            />
          </div>
        </>
      ) : (
        <div
          className={`flex-1 flex items-center justify-center text-[12.5px] ${tw.text.muted}`}
        >
          {t('noActiveSession')}
        </div>
      )}
    </div>
  )
})

const DebugDialog = observer(() => {
  const { dialogApp } = store
  const hasHadSession = useRef(false)
  const sessionsSize = store.sessions.size

  useEffect(() => {
    if (dialogApp) store.launchApp(dialogApp)
  }, [dialogApp])

  useEffect(() => {
    if (sessionsSize > 0) {
      hasHadSession.current = true
    } else if (hasHadSession.current && dialogApp) {
      hasHadSession.current = false
      store.closeDialog()
    }
  }, [sessionsSize, dialogApp])

  const handleClose = () => {
    store.stopAllSessions()
    store.closeDialog()
  }

  return (
    <Dialog.Root
      open={!!dialogApp}
      onOpenChange={(open) => !open && handleClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col w-[calc(100vw-4rem)] max-w-2xl max-h-[580px] rounded-xl shadow-2xl border ${tw.border.divider} ${tw.background.app} overflow-hidden animate-fade-up`}
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 border-b ${tw.border.divider} ${tw.background.toolbar} shrink-0`}
          >
            {dialogApp && (
              <div className="relative shrink-0">
                <img
                  src={fileUrl(dialogApp.icon)}
                  alt={dialogApp.name}
                  className="w-5 h-5 object-contain"
                />
                <span
                  className={`status-pulse absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border ${tw.border.statusIndicator}`}
                />
              </div>
            )}
            <Dialog.Title
              className={`text-[13px] font-semibold ${tw.text.primary} flex-1 min-w-0 truncate`}
            >
              {dialogApp?.name}
            </Dialog.Title>
            <Dialog.Close
              className={`p-1 rounded bg-transparent border-none cursor-pointer ${tw.text.muted} hover:${tw.text.primary} transition-colors duration-150`}
            >
              <X className="w-3.5 h-3.5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 min-h-0">
            <DebugView />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default DebugDialog
