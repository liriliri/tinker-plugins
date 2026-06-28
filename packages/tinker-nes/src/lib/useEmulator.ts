import { useCallback, useEffect, useRef, useState } from 'react'
import i18n from 'i18next'
import md5 from 'licia/md5'
import endWith from 'licia/endWith'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'
import store from '../store'
import { buildIframeHtml } from './util'
import { NesButton, INTERNAL_KEYS, TURBO_BUTTON_MAP } from './keymap'
import {
  TOOLBAR_KEY_CODES,
  TURBO_INTERVAL_MS,
  TURBO_PERIOD,
  findKeyBinding,
  isHotkey,
  postKey,
} from './emulatorInput'

const ROM_EXT = '.nes'

export function useEmulator(showKeymap: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [romLoaded, setRomLoaded] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const padPressedRef = useRef<Set<string>>(new Set())
  const turboFrameRef = useRef<Map<string, number>>(new Map())

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
    const turboIntervals = new Map<string, ReturnType<typeof setInterval>>()

    const onKeydown = (e: KeyboardEvent) => {
      if (showKeymap) return
      if (isHotkey(e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, store.keymap)
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
      if (isHotkey(e.keyCode)) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, store.keymap)
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
