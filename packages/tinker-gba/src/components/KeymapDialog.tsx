import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, RotateCcw, Gamepad2, Keyboard } from 'lucide-react'
import { tw } from '../theme'
import { GBA_BUTTONS, GbaButton, Keymap, DEFAULT_KEYMAP } from '../lib/keymap'

interface Props {
  isDark: boolean
  keymap: Keymap
  onClose: () => void
  onSave: (keymap: Keymap) => void
}

type BindingTarget = {
  button: GbaButton
  type: 'keyboard' | 'gamepad'
}

export default function KeymapDialog({
  isDark,
  keymap,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Keymap>(() => ({ ...keymap }))
  const [listening, setListening] = useState<BindingTarget | null>(null)

  const clearBinding = useCallback(
    (button: GbaButton, type: 'keyboard' | 'gamepad') => {
      setDraft((prev) => ({
        ...prev,
        [button]: { ...prev[button], [type]: null },
      }))
    },
    [],
  )

  useEffect(() => {
    if (!listening || listening.type !== 'keyboard') return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') {
        setListening(null)
        return
      }
      const { button } = listening
      setDraft((prev) => ({
        ...prev,
        [button]: { ...prev[button], keyboard: e.code },
      }))
      setListening(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [listening])

  useEffect(() => {
    if (!listening || listening.type !== 'gamepad') return
    let raf: number
    const poll = () => {
      const pads = navigator.getGamepads()
      for (const pad of pads) {
        if (!pad) continue
        for (let i = 0; i < pad.buttons.length; i++) {
          if (pad.buttons[i].pressed) {
            const { button } = listening
            setDraft((prev) => ({
              ...prev,
              [button]: { ...prev[button], gamepad: i },
            }))
            setListening(null)
            return
          }
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [listening])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  const handleReset = useCallback(() => {
    setDraft({ ...DEFAULT_KEYMAP })
  }, [])

  const handleSave = useCallback(() => {
    onSave(draft)
    onClose()
  }, [draft, onSave, onClose])

  const overlayBg = tw.dialogOverlay(isDark)
  const dialogBg = tw.dialogBg(isDark)
  const borderCls = tw.dialogBorder(isDark)
  const tableBg = tw.tableBg(isDark)
  const thCls = tw.tableHeader(isDark)

  const btnCls = (active: boolean) => tw.dialogBindingBtn(isDark, active)

  const isListening = (button: GbaButton, type: 'keyboard' | 'gamepad') =>
    listening?.button === button && listening?.type === type

  const renderBindingBtn = (
    button: GbaButton,
    type: 'keyboard' | 'gamepad',
    value: string | number | null,
  ) => {
    const active = isListening(button, type)
    const hasValue = value !== null
    const label = active
      ? type === 'keyboard'
        ? t('pressKey')
        : t('pressBtn')
      : hasValue
        ? type === 'keyboard'
          ? formatKeyCode(value as string)
          : `${t('btn')} ${value}`
        : '—'

    return (
      <td key={type} className={`py-1.5 px-3 border-b ${borderCls}`}>
        <button
          className={`${btnCls(active)} w-full justify-between`}
          onClick={() =>
            active ? setListening(null) : setListening({ button, type })
          }
        >
          <span className="truncate">{label}</span>
          <X
            size={9}
            className={`shrink-0 cursor-pointer ${hasValue && !active ? 'opacity-40 hover:opacity-100' : 'invisible'}`}
            onClick={(e) => {
              e.stopPropagation()
              clearBinding(button, type)
            }}
          />
        </button>
      </td>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`}
      onClick={handleBackdrop}
    >
      <div
        className={`rounded border shadow-xl w-[480px] max-h-[90vh] flex flex-col font-mono ${dialogBg}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b ${borderCls}`}
        >
          <span className="text-[11px] tracking-wider uppercase">
            {t('keymap')}
          </span>
          <button className={tw.btn(isDark)} onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className={`w-full text-[10px] ${tableBg}`}>
            <thead>
              <tr>
                <th
                  className={`py-1.5 px-3 text-left font-normal tracking-wider uppercase ${thCls}`}
                >
                  {t('button')}
                </th>
                <th
                  className={`py-1.5 px-3 text-left font-normal tracking-wider uppercase ${thCls}`}
                >
                  <Keyboard size={10} className="inline mr-1" />
                  {t('keyboard')}
                </th>
                <th
                  className={`py-1.5 px-3 text-left font-normal tracking-wider uppercase ${thCls}`}
                >
                  <Gamepad2 size={10} className="inline mr-1" />
                  {t('gamepad')}
                </th>
              </tr>
            </thead>
            <tbody>
              {GBA_BUTTONS.map((btn) => (
                <tr key={btn}>
                  <td
                    className={`py-1.5 px-3 border-b tracking-wider uppercase ${borderCls} ${thCls}`}
                  >
                    {t(`gba_${btn}`)}
                  </td>
                  {renderBindingBtn(btn, 'keyboard', draft[btn].keyboard)}
                  {renderBindingBtn(btn, 'gamepad', draft[btn].gamepad)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={`flex items-center justify-between px-4 py-2.5 border-t ${borderCls}`}
        >
          <button
            className={tw.btn(isDark)}
            onClick={handleReset}
            title={t('reset')}
          >
            <RotateCcw size={11} />
            <span className="text-[10px]">{t('reset')}</span>
          </button>
          <button
            className={`px-4 py-1.5 rounded text-[10px] tracking-wider transition-all active:scale-95 ${tw.dialogSaveBtn()}`}
            onClick={handleSave}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatKeyCode(code: string): string {
  return code
    .replace('Arrow', '')
    .replace('Key', '')
    .replace('Digit', '')
    .replace('Numpad', 'Num')
    .replace('ShiftLeft', 'L.Shift')
    .replace('ShiftRight', 'R.Shift')
    .replace('ControlLeft', 'L.Ctrl')
    .replace('ControlRight', 'R.Ctrl')
    .replace('AltLeft', 'L.Alt')
    .replace('AltRight', 'R.Alt')
}
