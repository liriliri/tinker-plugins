import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import { tw } from '../theme'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  birthday: string
  lifespan: number
  onSave: (settings: { birthday: string; lifespan: number }) => void
}

export default function Settings({
  open,
  onOpenChange,
  birthday,
  lifespan,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [bd, setBd] = useState(birthday)
  const [ls, setLs] = useState(lifespan)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in" />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-80 rounded-lg p-6 shadow-2xl zoom-in-95',
            tw.dialog.content,
          )}
        >
          <Dialog.Title
            className={className(
              'text-base font-bold tracking-tight mb-5',
              tw.text.primary,
            )}
          >
            {t('settings')}
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={className('text-xs font-medium', tw.text.muted)}>
                {t('birthday')}
              </span>
              <input
                type="date"
                value={bd}
                onChange={(e) => setBd(e.target.value)}
                className={className(
                  'rounded-lg px-3 py-2 text-sm',
                  tw.input.base,
                  tw.text.primary,
                )}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={className('text-xs font-medium', tw.text.muted)}>
                {t('lifespan')}
              </span>
              <input
                type="number"
                value={ls}
                onChange={(e) => setLs(Number(e.target.value))}
                min={1}
                max={150}
                className={className(
                  'rounded-lg px-3 py-2 text-sm',
                  tw.input.base,
                  tw.text.primary,
                )}
              />
            </label>
            <button
              onClick={() => onSave({ birthday: bd, lifespan: ls })}
              className={className(
                'self-end px-5 py-2 rounded-md text-sm font-semibold mt-1',
                'bg-gradient-to-r from-amber-400 to-amber-500',
                'hover:from-amber-500 hover:to-amber-600',
                'text-zinc-900 shadow-sm',
                'transition-all duration-200 hover:shadow-md',
              )}
            >
              {t('save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
