import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, RotateCcw, Gamepad2, Keyboard } from 'lucide-react'
import cloneDeep from 'licia/cloneDeep'
import { tw } from '../theme'
import {
  NES_BUTTONS,
  NesButton,
  PlayerKeymap,
  DEFAULT_KEYMAP,
  ButtonBinding,
} from '../lib/keymap'

interface Props {
  isDark: boolean
  keymap: [PlayerKeymap, PlayerKeymap]
  onClose: () => void
  onSave: (keymap: [PlayerKeymap, PlayerKeymap]) => void
}

type BindingTarget = {
  player: 0 | 1
  button: NesButton
  type: 'keyboard' | 'gamepad'
}

export default function KeymapDialog({
  isDark,
  keymap,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<[PlayerKeymap, PlayerKeymap]>(() =>
    cloneDeep(keymap),
  )
  const [listening, setListening] = useState<BindingTarget | null>(null)

  const clearBinding = useCallback(
    (player: 0 | 1, button: NesButton, type: 'keyboard' | 'gamepad') => {
      setDraft((prev) => {
        const next = [...prev] as [PlayerKeymap, PlayerKeymap]
        next[player] = {
          ...prev[player],
          [button]: { ...prev[player][button], [type]: null },
        }
        return next
      })
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
      const { player, button } = listening
      setDraft((prev) => {
        const next = [...prev] as [PlayerKeymap, PlayerKeymap]
        next[player] = {
          ...prev[player],
          [button]: { ...prev[player][button], keyboard: e.code },
        }
        return next
      })
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
            const { player, button } = listening
            setDraft((prev) => {
              const next = [...prev] as [PlayerKeymap, PlayerKeymap]
              next[player] = {
                ...prev[player],
                [button]: { ...prev[player][button], gamepad: i },
              }
              return next
            })
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
    setDraft([cloneDeep(DEFAULT_KEYMAP[0]), cloneDeep(DEFAULT_KEYMAP[1])])
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

  const isListening = (
    player: 0 | 1,
    button: NesButton,
    type: 'keyboard' | 'gamepad',
  ) =>
    listening?.player === player &&
    listening?.button === button &&
    listening?.type === type

  const renderCell = (
    player: 0 | 1,
    button: NesButton,
    binding: ButtonBinding,
  ) => (
    <td
      key={`${player}-${button}`}
      className={`py-1.5 px-3 border-b ${borderCls}`}
    >
      <div className="flex gap-1.5">
        <button
          className={btnCls(isListening(player, button, 'keyboard'))}
          onClick={() =>
            isListening(player, button, 'keyboard')
              ? setListening(null)
              : setListening({ player, button, type: 'keyboard' })
          }
        >
          <Keyboard size={10} />
          <span className="w-[72px] truncate">
            {isListening(player, button, 'keyboard')
              ? t('pressKey')
              : binding.keyboard
                ? formatKeyCode(binding.keyboard)
                : '—'}
          </span>
          <X
            size={9}
            className={`cursor-pointer ${binding.keyboard && !isListening(player, button, 'keyboard') ? 'opacity-40 hover:opacity-100' : 'invisible'}`}
            onClick={(e) => {
              e.stopPropagation()
              clearBinding(player, button, 'keyboard')
            }}
          />
        </button>
        <button
          className={btnCls(isListening(player, button, 'gamepad'))}
          onClick={() =>
            isListening(player, button, 'gamepad')
              ? setListening(null)
              : setListening({ player, button, type: 'gamepad' })
          }
        >
          <Gamepad2 size={10} />
          <span className="w-[52px] truncate">
            {isListening(player, button, 'gamepad')
              ? t('pressBtn')
              : binding.gamepad !== null
                ? `${t('btn')} ${binding.gamepad}`
                : '—'}
          </span>
          <X
            size={9}
            className={`cursor-pointer ${binding.gamepad !== null && !isListening(player, button, 'gamepad') ? 'opacity-40 hover:opacity-100' : 'invisible'}`}
            onClick={(e) => {
              e.stopPropagation()
              clearBinding(player, button, 'gamepad')
            }}
          />
        </button>
      </div>
    </td>
  )

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg}`}
      onClick={handleBackdrop}
    >
      <div
        className={`rounded border shadow-xl w-[620px] max-h-[90vh] flex flex-col font-mono ${dialogBg}`}
      >
        {/* header */}
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

        {/* table */}
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
                  {t('player1')}
                </th>
                <th
                  className={`py-1.5 px-3 text-left font-normal tracking-wider uppercase ${thCls}`}
                >
                  {t('player2')}
                </th>
              </tr>
            </thead>
            <tbody>
              {NES_BUTTONS.map((btn) => (
                <tr key={btn}>
                  <td
                    className={`py-1.5 px-3 border-b tracking-wider uppercase ${borderCls} ${thCls}`}
                  >
                    {t(`nes_${btn}`)}
                  </td>
                  {renderCell(0, btn, draft[0][btn])}
                  {renderCell(1, btn, draft[1][btn])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* footer */}
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
