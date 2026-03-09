import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { tw } from '../theme'
import store from '../store'

interface ThumbProps {
  src: string
  onClick: () => void
}

function Thumb({ src, onClick }: ThumbProps) {
  const [localSrc, setLocalSrc] = useState(src)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLocalSrc(src)
    setLoaded(false)
    wallpaper
      .getThumbLocal(src)
      .then(setLocalSrc)
      .catch(() => {})
  }, [src])

  return (
    <button onClick={onClick} className={tw.thumb.wrapper}>
      {!loaded && <div className={tw.thumb.skeleton} />}
      <img
        src={localSrc}
        className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </button>
  )
}

const WallpaperGrid = observer(() => {
  const { t } = useTranslation()
  const obsRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (obsRef.current) obsRef.current.disconnect()
    if (!el) return
    obsRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) store.loadMore()
      },
      { threshold: 0.1 },
    )
    obsRef.current.observe(el)
  }, [])

  if (!store.isLoading && store.wallpapers.length === 0) {
    return <div className={tw.grid.empty}>{t('noResults')}</div>
  }

  return (
    <ScrollArea.Root className={tw.scrollArea.root}>
      <ScrollArea.Viewport
        className={`w-full h-full ${tw.scrollArea.viewport}`}
      >
        <div className="p-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
            {store.wallpapers.map((w, i) => (
              <Thumb
                key={i}
                src={w.thumb}
                onClick={() => store.setSelectedWallpaper(w)}
              />
            ))}
          </div>
          {store.isLoading && (
            <div className="fixed bottom-0 left-0 right-0 h-0.5">
              <div className={tw.grid.progress} />
            </div>
          )}
          {store.hasMore && <div ref={sentinelRef} className="h-4" />}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className={tw.scrollArea.scrollbar}
        orientation="vertical"
      >
        <ScrollArea.Thumb className={tw.scrollArea.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
})

export default WallpaperGrid
