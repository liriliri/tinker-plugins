import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import {
  Archive,
  FileText,
  Folder,
  Inbox,
  Mail,
  MailPlus,
  Send,
  Trash2,
} from 'lucide-react'
import type { FolderRole } from '../../common/types'
import { folderLabel } from '../lib/mail'
import store from '../store'
import { tw } from '../theme'

function folderIcon(role?: FolderRole) {
  switch (role) {
    case 'inbox':
      return Inbox
    case 'sent':
      return Send
    case 'drafts':
      return FileText
    case 'trash':
      return Trash2
    case 'junk':
      return Mail
    case 'archive':
      return Archive
    default:
      return Folder
  }
}

const FolderList = observer(() => {
  const { t } = useTranslation()

  return (
    <aside className={tw.shell.folder}>
      <div className={`${tw.shell.composeBar} px-4.5`}>
        <button
          type="button"
          className={`${tw.button.primary} !h-8 w-full`}
          disabled={!store.account}
          onClick={() => store.openCompose()}
        >
          <MailPlus className="w-3.5 h-3.5" />
          {t('compose')}
        </button>
      </div>
      <ScrollArea.Root type="hover" className={tw.scrollArea.root}>
        <ScrollArea.Viewport className={tw.scrollArea.viewport}>
          <div className="px-1.5 pt-1.5 pb-3">
            {store.folders.length === 0 &&
            (store.loadingFolders || store.connecting) ? (
              <div className={`${tw.empty} py-10`}>
                <div className={tw.spinner} />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {store.folders.map((folder) => {
                  const Icon = folderIcon(folder.role)
                  const active = store.currentFolder === folder.path
                  const label = folderLabel(folder, t)
                  return (
                    <button
                      key={folder.path}
                      type="button"
                      className={`${tw.list.item} rounded-lg flex items-center gap-2 text-[13px] ${
                        active ? tw.list.itemActive : tw.list.itemIdle
                      }`}
                      onClick={() => store.selectFolder(folder.path)}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'opacity-100' : 'opacity-55'
                        }`}
                      />
                      <span className="truncate font-medium">{label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={tw.scrollArea.scrollbar}
        >
          <ScrollArea.Thumb className={tw.scrollArea.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </aside>
  )
})

export default FolderList
