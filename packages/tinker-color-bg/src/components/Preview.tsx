import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import clone from 'licia/clone'
import store from '../store'
import { applyOptions, createBg, destroyBg } from '../lib/backgrounds'
import type { ColorBg } from 'color4bg'

const PREVIEW_ID = 'color-bg-preview'

const Preview = observer(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<ColorBg | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.id = PREVIEW_ID
    destroyBg(bgRef.current)
    bgRef.current = createBg(PREVIEW_ID, store.config)
    bgRef.current.resize()

    const observer = new ResizeObserver(() => {
      bgRef.current?.resize()
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      destroyBg(bgRef.current)
      bgRef.current = null
    }
  }, [store.style])

  useEffect(() => {
    bgRef.current?.colors(clone(store.colors))
  }, [store.colors])

  useEffect(() => {
    bgRef.current?.reset(store.seed)
  }, [store.seed])

  useEffect(() => {
    if (bgRef.current) bgRef.current.loop = store.loop
  }, [store.loop])

  useEffect(() => {
    if (bgRef.current) applyOptions(bgRef.current, store.options)
  }, [store.options])

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0 overflow-hidden" />
    </div>
  )
})

export default Preview
