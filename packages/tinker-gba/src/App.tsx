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
  GbaButton,
  Keymap,
  INTERNAL_KEYS,
  loadKeymap,
  saveKeymap,
} from './lib/keymap'
import KeymapDialog from './components/KeymapDialog'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'

interface FileWithPath extends File {
  path?: string
}

const TOOLBAR_KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F2: 113,
  F4: 115,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

interface KeyLookup {
  btn: GbaButton
  code: string
  keyCode: number
}

function findKeyBinding(inputCode: string, km: Keymap): KeyLookup | null {
  for (const btn of Object.keys(km) as GbaButton[]) {
    if (km[btn].keyboard === inputCode) {
      const { code, keyCode } = INTERNAL_KEYS[btn]
      return { btn, code, keyCode }
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
  const keymapRef = useRef(keymap)
  const showKeymapRef = useRef(showKeymap)
  useEffect(() => {
    keymapRef.current = keymap
  }, [keymap])
  useEffect(() => {
    showKeymapRef.current = showKeymap
  }, [showKeymap])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

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

  const loadRomBuffer = useCallback(async (buffer: ArrayBuffer) => {
    const romMd5 = md5([...new Uint8Array(buffer)]) + '.gba'
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

  const loadRomFromPath = useCallback(
    async (filePath: string) => {
      const data = await tinker.readFile(filePath)
      const buffer =
        data instanceof ArrayBuffer
          ? data
          : data.buffer.slice(
              data.byteOffset,
              data.byteOffset + data.byteLength,
            )
      await loadRomBuffer(buffer)
      store.setCurrentRom(filePath)
    },
    [loadRomBuffer],
  )

  const loadRom = useCallback(
    async (file: File) => {
      await loadRomBuffer(await file.arrayBuffer())
      const path = (file as FileWithPath).path
      if (path) store.setCurrentRom(path)
    },
    [loadRomBuffer],
  )

  const openFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.gba'
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
        endWith(lowerCase(f.name), '.gba'),
      )
      if (file) loadRom(file)
    },
    [loadRom],
  )

  const handleSaveKeymap = useCallback((newKeymap: Keymap) => {
    saveKeymap(newKeymap)
    setKeymap(newKeymap)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showKeymapRef.current) return
      if (contain(HOTKEYS, e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, keymapRef.current)
      if (!binding) return
      e.preventDefault()
      postKey(win, e.type, binding.code, binding.keyCode)
    }

    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
    }
  }, [])

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
      const pad = pads[0]

      if (pad) {
        for (const btn of Object.keys(km) as GbaButton[]) {
          const idx = km[btn].gamepad
          if (idx === null) continue
          if (pad.buttons[idx]?.pressed) {
            pressed.add(btn)
            const { code, keyCode } = INTERNAL_KEYS[btn]
            if (!padPressedRef.current.has(btn)) {
              postKey(win, 'keydown', code, keyCode)
            }
          }
        }
      }

      for (const btn of padPressedRef.current) {
        if (!pressed.has(btn)) {
          const { code, keyCode } = INTERNAL_KEYS[btn as GbaButton]
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
      <Toolbar
        isDark={isDark}
        romLoaded={romLoaded}
        isPaused={isPaused}
        isMuted={isMuted}
        onOpenFile={openFile}
        onLoadRomPath={loadRomFromPath}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onToggleMute={handleToggleMute}
        onSaveState={handleSaveState}
        onLoadState={handleLoadState}
        onFullscreen={handleFullscreen}
        onOpenKeymap={() => setShowKeymap(true)}
      />

      <div className="flex flex-1 min-h-0">
        {store.sidebarOpen && <Sidebar onSelect={loadRomFromPath} />}

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
                className={`text-xs tracking-[0.25em] uppercase gba-blink ${tw.emptyText()}`}
              >
                {t('dropRom')}
              </p>
            </div>
          )}
          {isDragging && (
            <div className={tw.dragOverlay}>
              <p
                className={`text-[10px] tracking-[0.3em] uppercase animate-pulse ${tw.dragText(isDark)}`}
              >
                {t('dropRom')}
              </p>
            </div>
          )}
        </div>
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
