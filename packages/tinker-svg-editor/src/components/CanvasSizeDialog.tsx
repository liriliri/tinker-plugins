import { useEffect, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import { tw } from '../theme'

interface CanvasSizeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (width: number, height: number) => void
  currentWidth: number
  currentHeight: number
}

export default function CanvasSizeDialog({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
}: CanvasSizeDialogProps) {
  const { t } = useTranslation()
  const [width, setWidth] = useState(String(currentWidth))
  const [height, setHeight] = useState(String(currentHeight))

  useEffect(() => {
    if (open) {
      setWidth(String(currentWidth))
      setHeight(String(currentHeight))
    }
  }, [open, currentWidth, currentHeight])

  const w = toInt(width)
  const h = toInt(height)
  const isValid = !isStrBlank(width) && !isStrBlank(height) && w > 0 && h > 0

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(w, h)
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className('fixed inset-0 z-[100]', tw.overlay)}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 z-[101] flex h-auto w-[min(320px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-xl p-4 outline-none',
            tw.border.primary,
            tw.background.raised,
            tw.shadow.dialog,
          )}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            const input = (e.currentTarget as HTMLElement).querySelector(
              'input',
            )
            input?.focus({ preventScroll: true })
          }}
        >
          <Dialog.Title asChild>
            <h3
              className={className(
                'm-0 text-sm font-semibold tracking-[-0.01em]',
                tw.text.primary,
              )}
            >
              {t('setCanvasSize')}
            </h3>
          </Dialog.Title>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5">
              <span
                className={className(
                  'w-12 shrink-0 text-xs font-medium',
                  tw.text.secondary,
                )}
              >
                {t('width')}
              </span>
              <input
                type="number"
                className={className(
                  'min-w-0 flex-1 rounded-[var(--radius-sm)] px-2.5 py-[7px] font-[family-name:var(--font-ui)] text-[13px] outline-none',
                  tw.border.primary,
                  tw.background.secondary,
                  tw.text.primary,
                )}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onKeyDown={handleKeyDown}
                min={1}
              />
            </label>
            <label className="flex items-center gap-2.5">
              <span
                className={className(
                  'w-12 shrink-0 text-xs font-medium',
                  tw.text.secondary,
                )}
              >
                {t('height')}
              </span>
              <input
                type="number"
                className={className(
                  'min-w-0 flex-1 rounded-[var(--radius-sm)] px-2.5 py-[7px] font-[family-name:var(--font-ui)] text-[13px] outline-none',
                  tw.border.primary,
                  tw.background.secondary,
                  tw.text.primary,
                )}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onKeyDown={handleKeyDown}
                min={1}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className={className(
                  'cursor-pointer rounded-[var(--radius-sm)] px-3.5 py-[7px] font-[family-name:var(--font-ui)] text-[12.5px] font-medium transition-colors duration-150',
                  'disabled:pointer-events-none disabled:cursor-default disabled:opacity-45',
                  tw.border.primary,
                  tw.background.dialogBtn,
                  tw.text.primary,
                )}
              >
                {t('cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={className(
                'cursor-pointer rounded-[var(--radius-sm)] px-3.5 py-[7px] font-[family-name:var(--font-ui)] text-[12.5px] font-medium transition-colors duration-150',
                'disabled:pointer-events-none disabled:cursor-default disabled:opacity-45',
                tw.border.accent,
                tw.background.dialogBtnPrimary,
                tw.text.accentInk,
              )}
              disabled={!isValid}
              onClick={handleConfirm}
            >
              {t('confirm')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
