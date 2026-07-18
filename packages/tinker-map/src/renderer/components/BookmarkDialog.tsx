import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { formatCoord } from '../lib/util'

const BookmarkDialog = observer(() => {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  const open = !!store.pendingBookmark
  const coords = store.pendingBookmark

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isStrBlank(name)) return
    store.addBookmark(name)
    setName('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      store.closeBookmarkDialog()
      setName('')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 z-[2001]',
            'w-80 rounded-xl shadow-2xl p-5 animate-scale-in',
            tw.dialog.content,
            'focus:outline-none',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${tw.dialog.iconBg}`}
            >
              <MapPin size={13} className={tw.dialog.iconColor} />
            </div>
            <Dialog.Title
              className={`text-sm font-semibold ${tw.dialog.title}`}
            >
              {t('bookmarkLocation')}
            </Dialog.Title>
          </div>
          <Dialog.Description
            className={`text-xs mb-3 font-mono ml-8 ${tw.dialog.description}`}
          >
            {coords ? formatCoord(coords.lat, coords.lng, 6) : ''}
          </Dialog.Description>
          <form onSubmit={handleSubmit}>
            <input
              autoFocus
              type="text"
              placeholder={t('bookmarkNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={className(
                'w-full px-3 py-1.5 rounded-lg border text-sm outline-none mb-3',
                'transition-all duration-200',
                tw.input.base,
                tw.input.bg,
                tw.input.text,
                tw.input.placeholder,
                tw.input.focus,
              )}
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded-lg transition-colors duration-150 ${tw.dialog.cancelBtn}`}
                >
                  {t('cancel')}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isStrBlank(name)}
                className={className(
                  'px-3 py-1 text-sm rounded-lg transition-all duration-150',
                  !isStrBlank(name)
                    ? tw.dialog.submit
                    : tw.dialog.submitDisabled,
                )}
              >
                {t('save')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default BookmarkDialog
