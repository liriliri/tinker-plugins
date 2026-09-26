import { useEffect, useRef, useState } from 'react'
import { FRAME_HEIGHT, FRAME_WIDTH } from '../lib/util'

interface PetPreviewProps {
  src: string
  fallbackSrc?: string
  label: string
  className?: string
}

export default function PetPreview({
  src,
  fallbackSrc,
  label,
  className,
}: PetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let frame = 0
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    async function load(url: string) {
      try {
        const dataUrl = await agentPet.loadPreviewAsset(url)
        if (cancelled) return null
        const image = new Image()
        image.src = dataUrl
        await image.decode()
        return image
      } catch {
        return null
      }
    }

    ;(async () => {
      setReady(false)
      setFailed(false)
      let image = await load(src)
      if (!image && fallbackSrc) image = await load(fallbackSrc)
      if (cancelled) return
      if (!image) {
        setFailed(true)
        return
      }

      const sourceFrameWidth = Math.min(FRAME_WIDTH, image.width)
      const sourceFrameHeight =
        image.height >= FRAME_HEIGHT && image.width >= FRAME_WIDTH
          ? FRAME_HEIGHT
          : sourceFrameWidth * (FRAME_HEIGHT / FRAME_WIDTH)
      canvas.width = FRAME_WIDTH
      canvas.height = FRAME_HEIGHT
      ctx.imageSmoothingEnabled = false
      setReady(true)

      const draw = () => {
        if (cancelled) return
        ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)
        ctx.drawImage(
          image!,
          0,
          0,
          sourceFrameWidth,
          sourceFrameHeight,
          0,
          0,
          FRAME_WIDTH,
          FRAME_HEIGHT,
        )
        frame = requestAnimationFrame(draw)
      }
      draw()
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [src, fallbackSrc])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`${className || ''} ${ready ? 'opacity-100' : 'opacity-40'} ${failed ? 'opacity-30' : ''}`}
    />
  )
}
