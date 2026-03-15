import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { XboxSVG } from './components/XboxSVG'
import { AxesSVG } from './components/AxesSVG'
import store from './store'
import { colors, tw, BUTTON_COLORS, CONNECTED_GLOW } from './theme'
import { readGamepadState } from './lib/util'
import type { GamepadState } from './types'

const BUTTON_LABELS = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'Back',
  'Start',
  'L3',
  'R3',
  '↑',
  '↓',
  '←',
  '→',
]

const DEFAULT_STATE: GamepadState = {
  leftX: 0,
  leftY: 0,
  rightX: 0,
  rightY: 0,
  l3Pressed: false,
  r3Pressed: false,
  lt: 0,
  rt: 0,
  lbPressed: false,
  rbPressed: false,
  APressed: false,
  BPressed: false,
  XPressed: false,
  YPressed: false,
  upPressed: false,
  downPressed: false,
  leftPressed: false,
  rightPressed: false,
  sharePressed: false,
  optionsPressed: false,
  connected: false,
  id: '',
  axes: [],
  buttonValues: [],
}

const AXES_LABELS = ['leftX', 'leftY', 'rightX', 'rightY']

const App = observer(() => {
  const { isDark } = store
  const { t } = useTranslation()
  const [state, setState] = useState<GamepadState>(DEFAULT_STATE)
  const [connectedIndices, setConnectedIndices] = useState<number[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const stateHashRef = useRef('')

  const theme = useMemo(
    () => ({
      accentColor: colors.accent(isDark),
      accentDim: colors.accentDim(isDark),
      accentGlow: colors.accentGlow(isDark),
      panelBg: colors.panelBg(isDark),
      panelBorder: colors.panelBorder(isDark),
      gridPattern: colors.gridPattern(isDark),
      axisBar: colors.axisBar(isDark),
      valueText: colors.valueText(isDark),
      btnUnpressedText: colors.btnUnpressedText(isDark),
    }),
    [isDark],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const gpads = navigator.getGamepads()
      const connected = (Array.from(gpads) as (Gamepad | null)[])
        .map((g, i) => ({ g, i }))
        .filter(({ g }) => g !== null && g.connected && g.buttons.length > 0)
        .map(({ i }) => i)

      setConnectedIndices((prev) => {
        if (
          prev.length === connected.length &&
          prev.every((v, i) => v === connected[i])
        )
          return prev
        return connected
      })

      setSelectedIndex((prev) => {
        if (connected.includes(prev)) return prev
        return connected[0] ?? 0
      })

      const gpad = gpads[selectedIndex]
      if (!gpad || !gpad.connected || !gpad.buttons) {
        setState((s) => (s.connected ? DEFAULT_STATE : s))
        stateHashRef.current = ''
        return
      }
      const next = readGamepadState(gpad)
      const hash = next.buttonValues.join(',') + '|' + next.axes.join(',')
      if (hash === stateHashRef.current) return
      stateHashRef.current = hash
      setState(next)
    }, 10)
    return () => clearInterval(interval)
  }, [selectedIndex])

  if (connectedIndices.length === 0) {
    return (
      <div
        className={`h-screen flex items-center justify-center font-mono ${tw.appBg(isDark)}`}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: theme.gridPattern,
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping-slow" />
              <div className="absolute inset-3 rounded-full border border-cyan-400/30" />
              <span className="text-5xl animate-float">🎮</span>
            </div>
          </div>
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-cyan-400">
              {t('waitingForInput')}
              <span className="animate-blink">_</span>
            </p>
            <p className="text-xs mt-2 text-zinc-600">{t('connectPrompt')}</p>
          </div>
        </div>
      </div>
    )
  }

  const {
    accentColor,
    accentDim,
    accentGlow,
    panelBg,
    panelBorder,
    gridPattern,
    axisBar,
    valueText,
    btnUnpressedText,
  } = theme

  const deviceMatch = state.id.match(/^(.*?)\s*\(([^)]*)\)/)
  const deviceName = deviceMatch ? deviceMatch[1].trim() : state.id
  const deviceSub = deviceMatch ? deviceMatch[2] : ''

  const getButtonStyle = (i: number, val: number) => {
    const pressed = val > 0
    if (!pressed) {
      return {
        background: 'transparent',
        border: `1px solid ${panelBorder}`,
        color: btnUnpressedText,
        boxShadow: 'none',
      }
    }
    if (BUTTON_COLORS[i]) {
      const c = BUTTON_COLORS[i]
      return {
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        boxShadow: c.glow,
      }
    }
    return {
      background: accentDim,
      border: `1px solid ${accentColor}`,
      color: accentColor,
      boxShadow: accentGlow,
    }
  }

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col font-mono ${tw.appBg(isDark)}`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: gridPattern, backgroundSize: '22px 22px' }}
      />

      <div
        className="relative flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          background: panelBg,
          borderBottom: `1px solid ${panelBorder}`,
        }}
      >
        <div className="min-w-0 flex-1">
          <div
            className="text-sm tracking-widest uppercase truncate"
            style={{ color: accentColor }}
          >
            {deviceName}
          </div>
          {deviceSub && (
            <div className="text-xs truncate text-zinc-500">{deviceSub}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {connectedIndices.length > 1 &&
            connectedIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className="text-xs tracking-widest uppercase px-2 py-0.5 rounded transition-colors"
                style={{
                  border: `1px solid ${idx === selectedIndex ? accentColor : panelBorder}`,
                  color: idx === selectedIndex ? accentColor : btnUnpressedText,
                  background: idx === selectedIndex ? accentDim : 'transparent',
                }}
              >
                P{idx + 1}
              </button>
            ))}
          <div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"
            style={{ boxShadow: CONNECTED_GLOW }}
          />
          <span className="text-xs tracking-widest uppercase text-emerald-400">
            {t('connected')}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 min-h-0 gap-2.5 p-2.5">
        <div className="flex flex-col gap-2 w-56 shrink-0">
          <div
            className="rounded p-2 space-y-2"
            style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
          >
            <div className="text-xs tracking-[0.2em] uppercase text-zinc-500">
              {t('axes')}
            </div>
            {state.axes.map((val, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">
                    {t(AXES_LABELS[i] ?? `Axis ${i}`)}
                  </span>
                  <span className={valueText}>{val.toFixed(3)}</span>
                </div>
                <div
                  className="relative h-1 rounded-full overflow-hidden"
                  style={{ background: axisBar }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: '50%', background: panelBorder }}
                  />
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      background: accentColor,
                      boxShadow: `0 0 4px ${accentColor}`,
                      left: val >= 0 ? '50%' : `${((val + 1) / 2) * 100}%`,
                      width: `${Math.abs(val) * 50}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded p-2 flex-1"
            style={{ background: panelBg, border: `1px solid ${panelBorder}` }}
          >
            <div className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-2">
              {t('buttons')}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {state.buttonValues.slice(0, 16).map((val, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center text-xs rounded py-2 transition-none h-10"
                  style={getButtonStyle(i, val)}
                >
                  <span>{BUTTON_LABELS[i] ?? `B${i}`}</span>
                  {(i === 6 || i === 7) && (
                    <span className="text-[11px]">{val.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-2 min-w-0 overflow-auto">
          <XboxSVG isDark={isDark} state={state} />
          <div className="-mt-4">
            <AxesSVG
              isDark={isDark}
              left={{
                x: state.leftX,
                y: state.leftY,
                pressed: state.l3Pressed,
              }}
              right={{
                x: state.rightX,
                y: state.rightY,
                pressed: state.r3Pressed,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default App
