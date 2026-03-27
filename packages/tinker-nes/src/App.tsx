import { useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import md5 from 'licia/md5'
import contain from 'licia/contain'
import endWith from 'licia/endWith'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import store from './store'
import { tw } from './theme'
import { buildIframeHtml } from './lib/util'
import {
  NesButton,
  PlayerKeymap,
  INTERNAL_KEYS,
  TURBO_BUTTON_MAP,
  loadKeymap,
  saveKeymap,
} from './lib/keymap'
import KeymapDialog from './components/KeymapDialog'
import Toolbar from './components/Toolbar'

const TOOLBAR_KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F2: 113,
  F4: 115,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

const TURBO_INTERVAL_MS = 50
const TURBO_PERIOD = 3 // gamepad turbo toggles every N frames

interface KeyLookup {
  btn: NesButton
  code: string
  keyCode: number
}

function findKeyBinding(
  inputCode: string,
  km: [PlayerKeymap, PlayerKeymap],
): KeyLookup | null {
  for (let p = 0; p < 2; p++) {
    const player = km[p as 0 | 1]
    for (const btn of Object.keys(player) as NesButton[]) {
      if (player[btn].keyboard === inputCode) {
        const targetBtn = TURBO_BUTTON_MAP[btn] ?? btn
        const { code, keyCode } = INTERNAL_KEYS[p as 0 | 1][targetBtn]
        return { btn, code, keyCode }
      }
    }
  }
  return null
}

function postKey(win: Window, type: string, code: string, keyCode: number) {
  win.postMessage({ type, code, keyCode }, '*')
}

const App = observer(() => {
  const { isDark } = store
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [romLoaded, setRomLoaded] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showKeymap, setShowKeymap] = useState(false)
  const [keymap, setKeymap] = useState(() => loadKeymap())

  const padPressedRef = useRef<Set<string>>(new Set())
  const turboFrameRef = useRef<Map<string, number>>(new Map())
  const keymapRef = useRef(keymap)
  useEffect(() => {
    keymapRef.current = keymap
  }, [keymap])

  const triggerToolbarKey = useCallback((code: string) => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const keyCode = TOOLBAR_KEY_CODES[code] ?? 0
    iframe.contentWindow.postMessage({ type: 'keydown', code, keyCode }, '*')
    setTimeout(
      () =>
        iframe.contentWindow?.postMessage(
          { type: 'keyup', code, keyCode },
          '*',
        ),
      60,
    )
  }, [])

  const loadRom = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    const romMd5 = md5([...new Uint8Array(buffer)]) + '.nes'
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(new Blob([buffer]))
    blobUrlRef.current = url
    const base = import.meta.env.BASE_URL || './'
    const baseUrl = endWith(base, '/') ? base : `${base}/`
    const html = buildIframeHtml(url, romMd5, baseUrl)
    if (iframeRef.current) {
      iframeRef.current.remove()
      iframeRef.current = null
    }

    const iframe = document.createElement('iframe')
    iframe.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;border:none;pointer-events:none;'
    containerRef.current?.appendChild(iframe)
    iframeRef.current = iframe

    const doc = iframe.contentWindow?.document as Document
    doc.open()
    doc.write(html)
    doc.close()

    setRomLoaded(true)
    setIsPaused(false)
    setIsMuted(false)
  }, [])

  const openFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.nes'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) loadRom(file)
    }
    input.click()
  }, [loadRom])

  const handleReset = useCallback(
    () => triggerToolbarKey('KeyH'),
    [triggerToolbarKey],
  )
  const handleSaveState = useCallback(
    () => triggerToolbarKey('F2'),
    [triggerToolbarKey],
  )
  const handleLoadState = useCallback(
    () => triggerToolbarKey('F4'),
    [triggerToolbarKey],
  )
  const handleTogglePause = useCallback(() => {
    triggerToolbarKey('KeyP')
    setIsPaused((p) => !p)
  }, [triggerToolbarKey])
  const handleToggleMute = useCallback(() => {
    triggerToolbarKey('F9')
    setIsMuted((m) => !m)
  }, [triggerToolbarKey])
  const handleFullscreen = useCallback(() => {
    fullscreen.toggle(containerRef.current ?? undefined)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = Array.from(e.dataTransfer.files).find((f) =>
        endWith(lowerCase(f.name), '.nes'),
      )
      if (file) loadRom(file)
    },
    [loadRom],
  )

  const handleSaveKeymap = useCallback(
    (newKeymap: [PlayerKeymap, PlayerKeymap]) => {
      saveKeymap(newKeymap)
      setKeymap(newKeymap)
    },
    [],
  )

  useEffect(() => {
    const turboIntervals = new Map<string, ReturnType<typeof setInterval>>()

    const onKeydown = (e: KeyboardEvent) => {
      if (showKeymap) return
      if (contain(HOTKEYS, e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, keymapRef.current)
      if (!binding) return
      e.preventDefault()
      const { btn, code, keyCode } = binding
      if (TURBO_BUTTON_MAP[btn] && !turboIntervals.has(e.code)) {
        postKey(win, 'keydown', code, keyCode)
        let turboDown = true
        const id = setInterval(() => {
          const w = iframeRef.current?.contentWindow
          if (!w) return
          turboDown = !turboDown
          postKey(w, turboDown ? 'keydown' : 'keyup', code, keyCode)
        }, TURBO_INTERVAL_MS)
        turboIntervals.set(e.code, id)
      } else if (!TURBO_BUTTON_MAP[btn]) {
        postKey(win, 'keydown', code, keyCode)
      }
    }

    const onKeyup = (e: KeyboardEvent) => {
      if (showKeymap) return
      if (contain(HOTKEYS, e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, keymapRef.current)
      if (!binding) return
      e.preventDefault()
      const { btn, code, keyCode } = binding
      if (TURBO_BUTTON_MAP[btn]) {
        const id = turboIntervals.get(e.code)
        if (id !== undefined) {
          clearInterval(id)
          turboIntervals.delete(e.code)
        }
      }
      postKey(win, 'keyup', code, keyCode)
    }

    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)
      turboIntervals.forEach((id) => clearInterval(id))
    }
  }, [showKeymap])

  // gamepad polling — send RetroArch default keys for each player's bindings
  useEffect(() => {
    let raf: number
    const poll = () => {
      const win = iframeRef.current?.contentWindow
      if (!win) {
        raf = requestAnimationFrame(poll)
        return
      }

      const km = keymapRef.current
      const pressed = new Set<string>()
      const pads = navigator.getGamepads()

      for (let p = 0; p < 2; p++) {
        const pad = pads[p]
        if (!pad) continue
        const player = km[p as 0 | 1]
        for (const btn of Object.keys(player) as NesButton[]) {
          const idx = player[btn].gamepad
          if (idx === null) continue
          if (pad.buttons[idx]?.pressed) {
            const key = `${p}-${btn}`
            pressed.add(key)
            const targetBtn = TURBO_BUTTON_MAP[btn] ?? btn
            const { code, keyCode } = INTERNAL_KEYS[p as 0 | 1][targetBtn]
            if (TURBO_BUTTON_MAP[btn]) {
              const frame =
                ((turboFrameRef.current.get(key) ?? 0) + 1) % (TURBO_PERIOD * 2)
              turboFrameRef.current.set(key, frame)
              if (frame % TURBO_PERIOD === 1) {
                postKey(win, 'keydown', code, keyCode)
              } else if (frame % TURBO_PERIOD === 0) {
                postKey(win, 'keyup', code, keyCode)
              }
            } else if (!padPressedRef.current.has(key)) {
              postKey(win, 'keydown', code, keyCode)
            }
          }
        }
      }

      for (const key of padPressedRef.current) {
        if (!pressed.has(key)) {
          const [pStr, btn] = key.split('-') as [string, NesButton]
          const targetBtn = TURBO_BUTTON_MAP[btn] ?? btn
          const { code, keyCode } = INTERNAL_KEYS[+pStr as 0 | 1][targetBtn]
          postKey(win, 'keyup', code, keyCode)
          turboFrameRef.current.delete(key)
        }
      }

      padPressedRef.current = pressed
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={`h-screen flex flex-col font-mono ${tw.appBg(isDark)}`}>
      <Toolbar
        isDark={isDark}
        romLoaded={romLoaded}
        isPaused={isPaused}
        isMuted={isMuted}
        onOpenFile={openFile}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onToggleMute={handleToggleMute}
        onSaveState={handleSaveState}
        onLoadState={handleLoadState}
        onFullscreen={handleFullscreen}
        onOpenKeymap={() => setShowKeymap(true)}
      />

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-black"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {romLoaded && (
          <div className="scanlines absolute inset-0 pointer-events-none z-10" />
        )}
        {!romLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
            <span className="text-5xl">🎮</span>
            <p
              className={`text-[10px] tracking-[0.25em] uppercase nes-blink ${tw.emptyText(isDark)}`}
            >
              {t('dropRom')}
            </p>
          </div>
        )}
        {isDragging && (
          <div className={tw.dragOverlay}>
            <p className="text-red-500 text-[10px] tracking-[0.3em] uppercase animate-pulse">
              {t('dropRom')}
            </p>
          </div>
        )}
      </div>

      {showKeymap && (
        <KeymapDialog
          isDark={isDark}
          keymap={keymap}
          onClose={() => setShowKeymap(false)}
          onSave={handleSaveKeymap}
        />
      )}
    </div>
  )
})

export default App
