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

  const startListening = useCallback((target: BindingTarget) => {
    setListening(target)
  }, [])

  const clearBinding = useCallback(
    (player: 0 | 1, button: NesButton, type: 'keyboard' | 'gamepad') => {
      setDraft((prev) => {
        const next: [PlayerKeymap, PlayerKeymap] = [
          cloneDeep(prev[0]),
          cloneDeep(prev[1]),
        ]
        next[player][button] = { ...next[player][button], [type]: null }
        return next
      })
    },
    [],
  )

  // keyboard capture
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
        const next: [PlayerKeymap, PlayerKeymap] = [
          cloneDeep(prev[0]),
          cloneDeep(prev[1]),
        ]
        next[player][button] = { ...next[player][button], keyboard: e.code }
        return next
      })
      setListening(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [listening])

  // gamepad capture
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
              const next: [PlayerKeymap, PlayerKeymap] = [
                cloneDeep(prev[0]),
                cloneDeep(prev[1]),
              ]
              next[player][button] = { ...next[player][button], gamepad: i }
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

  // close on backdrop click
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

  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/40'
  const dialogBg = isDark
    ? 'bg-[#111] border-[#2a2a2a] text-zinc-100'
    : 'bg-[#e8e4dc] border-[#b0aca4] text-zinc-900'
  const headerBg = isDark ? 'border-[#1e1e1e]' : 'border-[#b0aca4]'
  const tableBg = isDark ? 'bg-[#0a0a0a]' : 'bg-[#d4d0c8]'
  const thCls = isDark ? 'text-zinc-500' : 'text-zinc-500'
  const tdBorder = isDark ? 'border-[#1e1e1e]' : 'border-[#c0bcb4]'
  const btnCls = (active: boolean) =>
    `flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
      active
        ? 'bg-red-500/20 text-red-400 animate-pulse'
        : isDark
          ? 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
          : 'bg-black/5 text-zinc-600 hover:bg-black/10 hover:text-zinc-900'
    }`

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
      className={`py-1.5 px-3 border-b ${tdBorder}`}
    >
      <div className="flex gap-1.5">
        <button
          className={btnCls(isListening(player, button, 'keyboard'))}
          onClick={() =>
            isListening(player, button, 'keyboard')
              ? setListening(null)
              : startListening({ player, button, type: 'keyboard' })
          }
        >
          <Keyboard size={10} />
          <span className="min-w-[60px]">
            {isListening(player, button, 'keyboard')
              ? t('pressKey')
              : binding.keyboard
                ? formatKeyCode(binding.keyboard)
                : '—'}
          </span>
          {binding.keyboard && !isListening(player, button, 'keyboard') && (
            <X
              size={9}
              className="opacity-40 hover:opacity-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                clearBinding(player, button, 'keyboard')
              }}
            />
          )}
        </button>
        <button
          className={btnCls(isListening(player, button, 'gamepad'))}
          onClick={() =>
            isListening(player, button, 'gamepad')
              ? setListening(null)
              : startListening({ player, button, type: 'gamepad' })
          }
        >
          <Gamepad2 size={10} />
          <span className="min-w-[40px]">
            {isListening(player, button, 'gamepad')
              ? t('pressBtn')
              : binding.gamepad !== null
                ? `${t('btn')} ${binding.gamepad}`
                : '—'}
          </span>
          {binding.gamepad !== null &&
            !isListening(player, button, 'gamepad') && (
              <X
                size={9}
                className="opacity-40 hover:opacity-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  clearBinding(player, button, 'gamepad')
                }}
              />
            )}
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
        className={`rounded border shadow-xl w-[560px] max-h-[80vh] flex flex-col font-mono ${dialogBg}`}
      >
        {/* header */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b ${headerBg}`}
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
                    className={`py-1.5 px-3 border-b tracking-wider uppercase ${tdBorder} ${thCls}`}
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
          className={`flex items-center justify-between px-4 py-2.5 border-t ${headerBg}`}
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
            className={`px-4 py-1.5 rounded text-[10px] tracking-wider transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-900'
            }`}
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
