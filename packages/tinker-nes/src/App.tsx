import { useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Keyboard,
} from 'lucide-react'
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
  loadKeymap,
  saveKeymap,
} from './lib/keymap'
import KeymapDialog from './components/KeymapDialog'

const TOOLBAR_KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

interface BtnProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  isDark: boolean
}

const ToolbarBtn = ({ onClick, icon, label, isDark }: BtnProps) => (
  <button className={tw.btn(isDark)} onClick={onClick} title={label}>
    {icon}
  </button>
)

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

  const loadRom = useCallback((file: File) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    const base = import.meta.env.BASE_URL || './'
    const baseUrl = endWith(base, '/') ? base : `${base}/`
    const html = buildIframeHtml(url, baseUrl)
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

  // keyboard forwarding with remap: user key → internal fixed key for that player
  useEffect(() => {
    const forward = (type: string) => (e: KeyboardEvent) => {
      if (showKeymap) return
      if (contain(HOTKEYS, e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const km = keymapRef.current
      for (let p = 0; p < 2; p++) {
        const player = km[p as 0 | 1]
        for (const btn of Object.keys(player) as NesButton[]) {
          if (player[btn].keyboard === e.code) {
            e.preventDefault()
            const { code, keyCode } = INTERNAL_KEYS[p as 0 | 1][btn]
            postKey(win, type, code, keyCode)
            return
          }
        }
      }
    }
    const onKeydown = forward('keydown')
    const onKeyup = forward('keyup')
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)
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
            if (!padPressedRef.current.has(key)) {
              const { code, keyCode } = INTERNAL_KEYS[p as 0 | 1][btn]
              postKey(win, 'keydown', code, keyCode)
            }
          }
        }
      }

      for (const key of padPressedRef.current) {
        if (!pressed.has(key)) {
          const [pStr, btn] = key.split('-') as [string, NesButton]
          const { code, keyCode } = INTERNAL_KEYS[+pStr as 0 | 1][btn]
          postKey(win, 'keyup', code, keyCode)
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
      <div
        className={`flex items-center gap-0.5 px-2 py-1 shrink-0 border-b ${tw.toolbar(isDark)}`}
      >
        <ToolbarBtn
          onClick={openFile}
          icon={<FolderOpen size={13} />}
          label={t('openRom')}
          isDark={isDark}
        />
        {romLoaded && (
          <>
            <div className={tw.divider(isDark)} />
            <ToolbarBtn
              onClick={handleTogglePause}
              icon={isPaused ? <Play size={13} /> : <Pause size={13} />}
              label={isPaused ? t('resume') : t('pause')}
              isDark={isDark}
            />
            <ToolbarBtn
              onClick={handleReset}
              icon={<RotateCcw size={13} />}
              label={t('reset')}
              isDark={isDark}
            />
            <ToolbarBtn
              onClick={handleToggleMute}
              icon={isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              label={isMuted ? t('unmute') : t('mute')}
              isDark={isDark}
            />
          </>
        )}
        <div className="ml-auto" />
        <ToolbarBtn
          onClick={() => setShowKeymap(true)}
          icon={<Keyboard size={13} />}
          label={t('keymap')}
          isDark={isDark}
        />
        <ToolbarBtn
          onClick={handleFullscreen}
          icon={<Maximize size={13} />}
          label={t('fullscreen')}
          isDark={isDark}
        />
      </div>

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
