import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import className from 'licia/className'
import contain from 'licia/contain'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X } from 'lucide-react'
import store from '../store'
import Flag from './Flag'
import { tw } from '../theme'
import { useTranslation } from 'react-i18next'

interface CurrencySearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (code: string) => void
  title: string
  excludeCodes?: string[]
}

const CurrencySearchDialog = observer(
  ({
    open,
    onOpenChange,
    onSelect,
    title,
    excludeCodes = [],
  }: CurrencySearchDialogProps) => {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')

    useEffect(() => {
      if (open) setSearch('')
    }, [open])

    const filtered = store.currencyCodes.filter((code) => {
      if (contain(excludeCodes, code)) return false
      if (!search) return true
      const q = search.toLowerCase()
      const name = store.getCurrencyName(code).toLowerCase()
      return code.toLowerCase().includes(q) || name.includes(q)
    })

    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content
            className={className(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[calc(100vw-3rem)] max-w-sm max-h-[420px]',
              'flex flex-col rounded-xl shadow-2xl overflow-hidden outline-none',
              tw.background.primary,
            )}
          >
            <div
              className={className(
                'flex items-center justify-between px-4 py-3 shrink-0',
              )}
            >
              <Dialog.Title
                className={className('text-sm font-semibold', tw.text.accent)}
              >
                {title}
              </Dialog.Title>
              <Dialog.Close
                className={className(
                  'p-1 rounded transition-colors',
                  tw.text.secondary,
                  tw.danger.hoverText,
                )}
              >
                <X size={14} />
              </Dialog.Close>
            </div>

            <div
              className={className(
                'flex items-center gap-2 mx-3 mb-2 px-3 py-1.5 rounded-lg',
                tw.background.secondary,
                tw.border.primary,
              )}
            >
              <Search size={14} className={tw.text.secondary} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchCurrency')}
                autoFocus
                className={className(
                  'flex-1 bg-transparent text-sm outline-none',
                  tw.text.placeholder,
                )}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {filtered.length > 0 ? (
                filtered.slice(0, 100).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      onSelect(code)
                      onOpenChange(false)
                    }}
                    className={className(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors',
                      tw.background.hover,
                    )}
                  >
                    <span className="shrink-0">
                      <Flag code={code} />
                    </span>
                    <span
                      className={className(
                        'font-bold w-12 shrink-0',
                        tw.text.accent,
                      )}
                    >
                      {code}
                    </span>
                    <span className={className('truncate', tw.text.secondary)}>
                      {store.getCurrencyName(code)}
                    </span>
                  </button>
                ))
              ) : (
                <div
                  className={className(
                    'py-8 text-center text-sm',
                    tw.text.secondary,
                  )}
                >
                  {t('noResults')}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  },
)

export default CurrencySearchDialog
