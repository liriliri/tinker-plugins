import { useCallback, useEffect, useRef } from 'react'
import i18n from 'i18next'
import fullscreen from 'licia/fullscreen'
import splitPath from 'licia/splitPath'
import toArr from 'licia/toArr'
import contain from 'licia/contain'
import store from '../store'
import { getPluginBaseUrl } from './util'
import { buildDosboxIframeHtml } from './dosboxLoader'
import {
  createProgramZip,
  createShellZip,
  isDosProgramName,
  isZipName,
  prepareGameZip,
} from './zip'

const SHORTCUT_KEYS = ['o', 'r', 'f', 'b']

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data
  return new Uint8Array(data)
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
}

export function useEmulator() {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const currentZipRef = useRef<Uint8Array | null>(null)
  const currentExeRef = useRef<string>('START.BAT')
  const shortcutRef = useRef<(key: string) => void>(() => {})
  const dropRef = useRef<(e: DragEvent) => void>(() => {})

  const cleanupIframe = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    if (iframeRef.current) {
      iframeRef.current.remove()
      iframeRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupIframe()
  }, [cleanupIframe])

  const startWithZip = useCallback(
    async (zipData: Uint8Array, startExe: string) => {
      const container = containerRef.current
      if (!container) return

      cleanupIframe()
      store.setLoading(true)

      const zipUrl = URL.createObjectURL(
        new Blob([toArrayBuffer(zipData)], { type: 'application/zip' }),
      )
      blobUrlRef.current = zipUrl
      currentZipRef.current = zipData
      currentExeRef.current = startExe

      const html = buildDosboxIframeHtml(zipUrl, startExe, getPluginBaseUrl())

      const iframe = document.createElement('iframe')
      iframe.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;border:none;background:#000;'
      iframe.allow = 'autoplay; gamepad'
      container.appendChild(iframe)
      iframeRef.current = iframe

      const doc = iframe.contentWindow?.document
      if (!doc) return
      doc.open()
      doc.write(html)
      doc.close()

      // Handle the drop here rather than inside the iframe: only this frame can
      // resolve a dropped File to its path via tinker.getPathForFile.
      doc.addEventListener('dragover', (e) => e.preventDefault())
      doc.addEventListener('drop', (e) => dropRef.current(e))
    },
    [cleanupIframe],
  )

  const startShell = useCallback(async () => {
    const zip = createShellZip()
    await startWithZip(zip, 'START.BAT')
  }, [startWithZip])

  useEffect(() => {
    void startShell()
  }, [startShell])

  const loadProgramBuffer = useCallback(
    async (buffer: ArrayBuffer | Uint8Array, fileName: string) => {
      const data = toUint8Array(buffer)
      let zipData: Uint8Array
      let startExe: string

      if (isZipName(fileName)) {
        const prepared = prepareGameZip(data)
        if (!prepared) {
          store.showError(i18n.t('noExecutable'))
          return
        }
        zipData = prepared.zipData
        startExe = prepared.startExe
      } else {
        zipData = createProgramZip(fileName, data)
        startExe = splitPath(fileName).name || fileName
      }

      await startWithZip(zipData, startExe)
    },
    [startWithZip],
  )

  const loadProgramFromPath = useCallback(
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
        await loadProgramBuffer(
          data instanceof Uint8Array ? data : new Uint8Array(data),
          splitPath(filePath).name,
        )
        store.setCurrentProgram(filePath)
      } catch {
        store.showError(
          i18n.t('fileNotFound', { name: splitPath(filePath).name }),
        )
      }
    },
    [loadProgramBuffer],
  )

  const loadProgram = useCallback(
    async (file: File) => {
      await loadProgramBuffer(await file.arrayBuffer(), file.name)
      const path = tinker.getPathForFile(file)
      if (path) store.setCurrentProgram(path)
    },
    [loadProgramBuffer],
  )

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data
      if (!data || typeof data.type !== 'string') return

      if (data.type === 'tinker-dos:ready') {
        store.setLoading(false)
        iframeRef.current?.contentWindow?.document
          .getElementById('canvas')
          ?.focus()
        return
      }
      if (data.type === 'tinker-dos:error') {
        store.setLoading(false)
        store.showError(i18n.t('loadFailed'))
        return
      }
      if (data.type === 'tinker-dos:shortcut') {
        shortcutRef.current(data.key)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const openFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.exe,.com,.bat,.zip'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void loadProgram(file)
    }
    input.click()
  }, [loadProgram])

  const handleReset = useCallback(() => {
    const zip = currentZipRef.current
    if (!zip) {
      void startShell()
      return
    }
    void startWithZip(zip, currentExeRef.current)
  }, [startShell, startWithZip])

  const handleFullscreen = useCallback(() => {
    fullscreen.toggle(containerRef.current ?? undefined)
  }, [])

  const handleShortcut = useCallback(
    (key: string) => {
      if (key === 'o') openFile()
      if (key === 'r') handleReset()
      if (key === 'f') handleFullscreen()
      if (key === 'b') store.toggleSidebar()
    },
    [openFile, handleReset, handleFullscreen],
  )

  useEffect(() => {
    shortcutRef.current = handleShortcut

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const key = e.key.toLowerCase()
      if (!contain(SHORTCUT_KEYS, key)) return
      e.preventDefault()
      handleShortcut(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleShortcut])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent | DragEvent) => {
      e.preventDefault()
      const file = toArr(e.dataTransfer?.files).find((f) =>
        isDosProgramName(f.name),
      )
      if (file) void loadProgram(file)
    },
    [loadProgram],
  )

  useEffect(() => {
    dropRef.current = handleDrop
  }, [handleDrop])

  return {
    containerRef,
    openFile,
    loadProgramFromPath,
    handleReset,
    handleFullscreen,
    handleDragOver,
    handleDrop,
  }
}
