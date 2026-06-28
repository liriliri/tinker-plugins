import { useCallback, useEffect, useRef, useState } from 'react'
import i18n from 'i18next'
import md5 from 'licia/md5'
import endWith from 'licia/endWith'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'
import store from '../store'
import { buildIframeHtml } from './util'
import { GbaButton, INTERNAL_KEYS } from './keymap'
import {
  TOOLBAR_KEY_CODES,
  findKeyBinding,
  isHotkey,
  postKey,
} from './emulatorInput'

const ROM_EXT = '.gba'
const AXIS_THRESHOLD = 0.5

function isGamepadBindingActive(
  pad: Gamepad,
  binding: {
    gamepad: number | null
    gamepadAxis: { axis: number; direction: 'negative' | 'positive' } | null
  },
) {
  if (binding.gamepad !== null && binding.gamepad >= 0) {
    if (pad.buttons[binding.gamepad]?.pressed) return true
  }
  if (binding.gamepadAxis) {
    const v = pad.axes[binding.gamepadAxis.axis] ?? 0
    return binding.gamepadAxis.direction === 'negative'
      ? v < -AXIS_THRESHOLD
      : v > AXIS_THRESHOLD
  }
  return false
}

export function useEmulator(showKeymap: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [romLoaded, setRomLoaded] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const padPressedRef = useRef<Set<string>>(new Set())

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
    const romMd5 = md5([...new Uint8Array(buffer)]) + ROM_EXT
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(new Blob([buffer]))
    blobUrlRef.current = url
    const base = import.meta.env.BASE_URL || './'
    const baseUrl = endWith(base, '/') ? base : `${base}/`
    const html = buildIframeHtml(url, romMd5, baseUrl, i18n.t('loading'))
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
      try {
        const stat = await tinker.fstat(filePath)
        if (!stat.isFile) {
          store.showError(
            i18n.t('fileNotFound', { name: splitPath(filePath).name }),
          )
          return
        }
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
      } catch {
        store.showError(
          i18n.t('fileNotFound', { name: splitPath(filePath).name }),
        )
      }
    },
    [loadRomBuffer],
  )

  const loadRom = useCallback(
    async (file: File) => {
      await loadRomBuffer(await file.arrayBuffer())
      const path = (file as File & { path?: string }).path
      if (path) store.setCurrentRom(path)
    },
    [loadRomBuffer],
  )

  const openFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ROM_EXT
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
        endWith(lowerCase(f.name), ROM_EXT),
      )
      if (file) loadRom(file)
    },
    [loadRom],
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showKeymap) return
      if (isHotkey(e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, store.keymap)
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
  }, [showKeymap])

  useEffect(() => {
    let raf: number
    const poll = () => {
      const win = iframeRef.current?.contentWindow
      if (!win) {
        raf = requestAnimationFrame(poll)
        return
      }

      const km = store.keymap
      const pressed = new Set<string>()
      const pad = navigator.getGamepads()[0]

      if (pad) {
        for (const btn of Object.keys(km) as GbaButton[]) {
          const binding = km[btn]
          if (!isGamepadBindingActive(pad, binding)) continue
          pressed.add(btn)
          const { code, keyCode } = INTERNAL_KEYS[btn]
          if (!padPressedRef.current.has(btn)) {
            postKey(win, 'keydown', code, keyCode)
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

  return {
    containerRef,
    romLoaded,
    isPaused,
    isMuted,
    isDragging,
    openFile,
    loadRomFromPath,
    handleTogglePause,
    handleReset,
    handleToggleMute,
    handleSaveState,
    handleLoadState,
    handleFullscreen,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
