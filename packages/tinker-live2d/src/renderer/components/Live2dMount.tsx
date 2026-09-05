import { useEffect, useRef, useState } from 'react'
import sleep from 'licia/sleep'
import { mountLive2d, type Live2dRuntime } from '../lib/live2dRuntime'

interface Live2dMountProps {
  modelUrl: string
  width: number
  height: number
  /** Capture a still as soon as the model first finishes rendering. */
  captureOnReady?: boolean
  onReady?: (thumbnail?: string | null) => void
  onError?: (error: unknown) => void
}

/** Mount Live2D via pixi-live2d-display (Cubism cores must be on window). */
export default function Live2dMount({
  modelUrl,
  width,
  height,
  captureOnReady = false,
  onReady,
  onError,
}: Live2dMountProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<Live2dRuntime | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    setReady(false)
    runtimeRef.current?.destroy()
    runtimeRef.current = null

    async function load() {
      try {
        const runtime = await mountLive2d({
          container: host!,
          modelUrl,
          width,
          height,
          autoInteract: !captureOnReady,
        })
        if (cancelled) {
          runtime.destroy()
          return
        }
        runtimeRef.current = runtime

        let thumbnail: string | null | undefined
        if (captureOnReady) {
          runtime.resetFocus()
          await sleep(50)
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve())
          })
          if (cancelled) return
          runtime.resetFocus()
          thumbnail = runtime.capture()
          runtime.setAutoInteract(true)
        }

        setReady(true)
        onReady?.(thumbnail)
      } catch (error) {
        if (!cancelled) onError?.(error)
      }
    }

    void load()
    return () => {
      cancelled = true
      runtimeRef.current?.destroy()
      runtimeRef.current = null
    }
  }, [modelUrl, width, height, captureOnReady, onReady, onError])

  return (
    <div
      ref={hostRef}
      className="overflow-hidden"
      style={{ width, height, opacity: ready ? 1 : 0.35 }}
      data-live2d-mount
    />
  )
}
