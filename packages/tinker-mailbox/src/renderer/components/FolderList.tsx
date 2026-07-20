import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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
      <div className={`px-1.5 pt-2.5 pb-2 border-b ${tw.border.divider}`}>
        <button
          type="button"
          className={`${tw.button.primary} w-full`}
          disabled={!store.account}
          onClick={() => store.openCompose()}
        >
          <MailPlus className="w-3.5 h-3.5" />
          {t('compose')}
        </button>
      </div>
      <div className={tw.sectionEyebrow}>{t('folders')}</div>
      <div className="flex-1 overflow-y-auto px-1.5 pb-3">
        {store.folders.length === 0 &&
        (store.loadingFolders || store.connecting) ? (
          <div className={`${tw.empty} py-10`}>
            <div className={tw.spinner} />
          </div>
        ) : (
          store.folders.map((folder) => {
            const Icon = folderIcon(folder.role)
            const active = store.currentFolder === folder.path
            const label = folder.role ? t(folder.role) : folder.name
            return (
              <button
                key={folder.path}
                type="button"
                className={`${tw.list.item} rounded-lg flex items-center gap-2 text-[13px] ${
                  active ? tw.list.itemActive : tw.list.itemIdle
                }`}
                onClick={() => store.selectFolder(folder.path)}
              >
                {active && <span className={tw.list.spine} aria-hidden />}
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    active ? 'opacity-100' : 'opacity-55'
                  }`}
                />
                <span className="truncate font-medium">{label}</span>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
})

export default FolderList
