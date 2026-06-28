import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, RotateCcw, Gamepad2, Keyboard } from 'lucide-react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import cloneDeep from 'licia/cloneDeep'
import { tw } from '../theme'
import {
  N64_BUTTONS,
  N64Button,
  PlayerKeymap,
  DEFAULT_KEYMAP,
  ButtonBinding,
  ANALOG_BUTTONS,
  formatGamepadAxis,
  codeToKey,
} from '../lib/keymap'

interface Props {
  isDark: boolean
  keymap: PlayerKeymap
  onClose: () => void
  onSave: (keymap: PlayerKeymap) => void
}

type BindingTarget = {
  button: N64Button
  type: 'keyboard' | 'gamepad'
}

export default function KeymapDialog({
  isDark,
  keymap,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<PlayerKeymap>(() => cloneDeep(keymap))
  const [listening, setListening] = useState<BindingTarget | null>(null)

  const clearBinding = useCallback(
    (button: N64Button, type: 'keyboard' | 'gamepad') => {
      setDraft((prev) => ({
        ...prev,
        [button]: {
          ...prev[button],
          ...(type === 'keyboard'
            ? { keyboard: null }
            : { gamepad: null, gamepadAxis: null }),
        },
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
        [button]: {
          ...prev[button],
          keyboard: e.code,
          key: codeToKey(e.code),
        },
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
        const { button } = listening

        if (ANALOG_BUTTONS.has(button)) {
          for (let a = 0; a < pad.axes.length; a++) {
            const v = pad.axes[a]
            if (v < -0.5) {
              setDraft((prev) => ({
                ...prev,
                [button]: {
                  ...prev[button],
                  gamepad: null,
                  gamepadAxis: { axis: a, direction: 'negative' },
                },
              }))
              setListening(null)
              return
            }
            if (v > 0.5) {
              setDraft((prev) => ({
                ...prev,
                [button]: {
                  ...prev[button],
                  gamepad: null,
                  gamepadAxis: { axis: a, direction: 'positive' },
                },
              }))
              setListening(null)
              return
            }
          }
          continue
        }

        for (let i = 0; i < pad.buttons.length; i++) {
          if (pad.buttons[i].pressed) {
            setDraft((prev) => ({
              ...prev,
              [button]: {
                ...prev[button],
                gamepad: i,
                gamepadAxis: null,
              },
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
    setDraft(cloneDeep(DEFAULT_KEYMAP))
  }, [])

  const handleSave = useCallback(() => {
    setListening(null)
    onSave(draft)
  }, [draft, onSave])

  const overlayBg = tw.dialogOverlay(isDark)
  const dialogBg = tw.dialogBg(isDark)
  const borderCls = tw.dialogBorder(isDark)
  const tableBg = tw.tableBg(isDark)
  const thCls = tw.tableHeader(isDark)
  const btnCls = (active: boolean) => tw.dialogBindingBtn(isDark, active)

  const isListening = (button: N64Button, type: 'keyboard' | 'gamepad') =>
    listening?.button === button && listening?.type === type

  const formatGamepadBinding = (binding: ButtonBinding) => {
    if (binding.gamepadAxis) return formatGamepadAxis(binding.gamepadAxis)
    if (binding.gamepad !== null) return `${t('btn')} ${binding.gamepad}`
    return null
  }

  const renderBindingBtn = (
    button: N64Button,
    type: 'keyboard' | 'gamepad',
    binding: ButtonBinding,
  ) => {
    const active = isListening(button, type)
    const hasValue =
      type === 'keyboard'
        ? binding.keyboard !== null
        : binding.gamepad !== null || binding.gamepadAxis !== null
    const label = active
      ? type === 'keyboard'
        ? t('pressKey')
        : ANALOG_BUTTONS.has(button)
          ? t('pressAxis')
          : t('pressBtn')
      : type === 'keyboard'
        ? binding.keyboard
          ? formatKeyCode(binding.keyboard)
          : '—'
        : (formatGamepadBinding(binding) ?? '—')

    return (
      <td key={type} className={`py-1.5 px-3 border-b ${borderCls}`}>
        <button
          type="button"
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
        className={`rounded border shadow-xl w-[520px] max-h-[90vh] min-h-0 flex flex-col overflow-hidden font-mono ${dialogBg}`}
      >
        <div
          className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-b ${borderCls}`}
        >
          <span className="text-[11px] tracking-wider uppercase">
            {t('keymap')}
          </span>
          <button type="button" className={tw.btn(isDark)} onClick={onClose}>
            <X size={13} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ScrollArea.Root className={tw.scrollArea.root}>
            <ScrollArea.Viewport className={tw.scrollArea.viewport}>
              <table className={`w-full text-[10px] ${tableBg}`}>
                <thead>
                  <tr>
                    <th
                      className={`sticky top-0 z-10 py-1.5 px-3 text-left font-normal tracking-wider uppercase ${tableBg} ${thCls}`}
                    >
                      {t('button')}
                    </th>
                    <th
                      className={`sticky top-0 z-10 py-1.5 px-3 text-left font-normal tracking-wider uppercase ${tableBg} ${thCls}`}
                    >
                      <Keyboard size={10} className="inline mr-1" />
                      {t('keyboard')}
                    </th>
                    <th
                      className={`sticky top-0 z-10 py-1.5 px-3 text-left font-normal tracking-wider uppercase ${tableBg} ${thCls}`}
                    >
                      <Gamepad2 size={10} className="inline mr-1" />
                      {t('gamepad')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {N64_BUTTONS.map((btn) => (
                    <tr key={btn}>
                      <td
                        className={`py-1.5 px-3 border-b tracking-wider uppercase ${borderCls} ${thCls}`}
                      >
                        {t(`n64_${btn}`)}
                      </td>
                      {renderBindingBtn(btn, 'keyboard', draft[btn])}
                      {renderBindingBtn(btn, 'gamepad', draft[btn])}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className={tw.scrollArea.scrollbar(isDark)}
            >
              <ScrollArea.Thumb className={tw.scrollArea.thumb(isDark)} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>

        <div
          className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-t ${borderCls}`}
        >
          <button
            type="button"
            className={tw.btn(isDark)}
            onClick={handleReset}
            title={t('reset')}
          >
            <RotateCcw size={11} />
            <span className="text-[10px]">{t('reset')}</span>
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded text-[10px] tracking-wider transition-all active:scale-95 ${tw.dialogSaveBtn}`}
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
