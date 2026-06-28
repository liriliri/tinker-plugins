import { useCallback, useEffect, useRef, useState } from 'react'
import i18n from 'i18next'
import md5 from 'licia/md5'
import endWith from 'licia/endWith'
import fullscreen from 'licia/fullscreen'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'
import store from '../store'
import { buildIframeHtml } from './util'
import { N64Button, codeToKeyCode } from './keymap'
import { findKeyBinding, postKey, postAction } from './emulatorInput'

const ROM_EXTS = ['.n64', '.v64', '.z64']

function isRomFile(name: string) {
  const lower = lowerCase(name)
  return ROM_EXTS.some((ext) => endWith(lower, ext))
}

const AXIS_THRESHOLD = 0.5

export function useEmulator(showKeymap: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [romLoaded, setRomLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const padPressedRef = useRef<Set<N64Button>>(new Set())

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const loadRomBuffer = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      const ext = ROM_EXTS.find((e) => endWith(lowerCase(name), e)) ?? '.n64'
      const romMd5 = md5([...new Uint8Array(buffer)]) + ext
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      const url = URL.createObjectURL(new Blob([buffer]))
      blobUrlRef.current = url
      const base = import.meta.env.BASE_URL || './'
      const baseUrl = endWith(base, '/') ? base : `${base}/`
      const html = buildIframeHtml(
        url,
        romMd5,
        baseUrl,
        i18n.t('loading'),
        store.keymap,
      )
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
      setIsMuted(false)
    },
    [],
  )

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
        await loadRomBuffer(buffer, splitPath(filePath).name)
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
      await loadRomBuffer(await file.arrayBuffer(), file.name)
      const path = (file as File & { path?: string }).path
      if (path) store.setCurrentRom(path)
    },
    [loadRomBuffer],
  )

  const openFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.n64,.v64,.z64'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) loadRom(file)
    }
    input.click()
  }, [loadRom])

  const handleReset = useCallback(() => {
    iframeRef.current?.contentWindow &&
      postAction(iframeRef.current.contentWindow, 'reset')
  }, [])

  const handleSaveState = useCallback(() => {
    iframeRef.current?.contentWindow &&
      postAction(iframeRef.current.contentWindow, 'saveState')
  }, [])

  const handleLoadState = useCallback(() => {
    iframeRef.current?.contentWindow &&
      postAction(iframeRef.current.contentWindow, 'loadState')
  }, [])

  const handleToggleMute = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    const muted = !isMuted
    postAction(win, 'mute', { muted })
    setIsMuted(muted)
  }, [isMuted])

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
        isRomFile(f.name),
      )
      if (file) loadRom(file)
    },
    [loadRom],
  )

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (showKeymap) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, store.keymap)
      if (!binding) return
      const { code, keyCode } = binding
      e.preventDefault()
      postKey(win, 'keydown', code, keyCode)
    }

    const onKeyup = (e: KeyboardEvent) => {
      if (showKeymap) return
      const win = iframeRef.current?.contentWindow
      if (!win) return
      const binding = findKeyBinding(e.code, store.keymap)
      if (!binding) return
      const { code, keyCode } = binding
      e.preventDefault()
      postKey(win, 'keyup', code, keyCode)
    }

    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)
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
      const pressed = new Set<N64Button>()
      const pads = navigator.getGamepads()
      const pad = pads[0]
      if (pad) {
        for (const btn of Object.keys(km) as N64Button[]) {
          const binding = km[btn]
          const code = binding.keyboard
          let active = false

          if (binding.gamepad !== null && binding.gamepad >= 0) {
            active = !!pad.buttons[binding.gamepad]?.pressed
          } else if (binding.gamepadAxis) {
            const v = pad.axes[binding.gamepadAxis.axis] ?? 0
            active =
              binding.gamepadAxis.direction === 'negative'
                ? v < -AXIS_THRESHOLD
                : v > AXIS_THRESHOLD
          }

          if (!active) continue

          pressed.add(btn)
          if (code && !padPressedRef.current.has(btn)) {
            postKey(win, 'keydown', code, codeToKeyCode(code))
          }
        }
      }

      for (const btn of padPressedRef.current) {
        if (!pressed.has(btn)) {
          const code = km[btn].keyboard
          if (code) postKey(win, 'keyup', code, codeToKeyCode(code))
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
    isMuted,
    isDragging,
    openFile,
    loadRomFromPath,
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
