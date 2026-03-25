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
} from 'lucide-react'
import contain from 'licia/contain'
import endWith from 'licia/endWith'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import store from './store'
import { tw } from './theme'
import { buildIframeHtml } from './lib/util'

const KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

interface BtnProps {
  onClick: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  icon: React.ReactNode
  label: string
  isDark: boolean
  title?: string
}

const ToolbarBtn = ({
  onClick,
  onMouseDown,
  icon,
  label,
  isDark,
  title,
}: BtnProps) => (
  <button
    className={tw.btn(isDark)}
    onClick={onClick}
    onMouseDown={onMouseDown}
    title={title}
  >
    {icon}
    <span>{label}</span>
  </button>
)

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

  const triggerKey = useCallback((code: string) => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const keyCode = KEY_CODES[code] ?? 0
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
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }
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
      'position:absolute;inset:0;width:100%;height:100%;border:none;'
    containerRef.current?.appendChild(iframe)
    iframeRef.current = iframe

    const doc = iframe.contentWindow?.document as Document
    doc.open()
    doc.write(html)
    doc.close()

    setRomLoaded(true)
    setIsPaused(false)
    setIsMuted(false)

    iframe.addEventListener('load', () => {
      iframe.contentWindow?.focus()
    })
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

  const focusCanvas = useCallback(() => {
    const canvas =
      iframeRef.current?.contentWindow?.document.getElementById('canvas')
    if (canvas) {
      canvas.focus()
    } else {
      iframeRef.current?.contentWindow?.focus()
    }
  }, [])

  const handleReset = useCallback(() => {
    triggerKey('KeyH')
    focusCanvas()
  }, [triggerKey, focusCanvas])

  const handleTogglePause = useCallback(() => {
    triggerKey('KeyP')
    setIsPaused((p) => !p)
    focusCanvas()
  }, [triggerKey, focusCanvas])

  const handleToggleMute = useCallback(() => {
    triggerKey('F9')
    setIsMuted((m) => !m)
    focusCanvas()
  }, [triggerKey, focusCanvas])

  const preventFocusLoss = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

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

  useEffect(() => {
    const forward = (type: string) => (e: KeyboardEvent) => {
      if (contain(HOTKEYS, e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      win.postMessage(
        {
          type,
          code: e.code,
          key: e.key,
          keyCode: e.keyCode,
          which: e.which,
          charCode: e.charCode,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        },
        '*',
      )
    }
    const onKeydown = forward('keydown')
    const onKeyup = forward('keyup')
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)
    }
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
              onMouseDown={preventFocusLoss}
            />
            <ToolbarBtn
              onClick={handleReset}
              icon={<RotateCcw size={13} />}
              label={t('reset')}
              isDark={isDark}
              onMouseDown={preventFocusLoss}
            />
            <ToolbarBtn
              onClick={handleToggleMute}
              icon={isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              label={isMuted ? t('unmute') : t('mute')}
              isDark={isDark}
              onMouseDown={preventFocusLoss}
            />
          </>
        )}
        <div className="ml-auto" />
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
    </div>
  )
})

export default App
