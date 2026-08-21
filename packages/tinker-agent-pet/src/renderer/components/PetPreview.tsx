import { useEffect, useRef, useState } from 'react'

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

      const sourceFrameWidth = Math.min(192, image.width)
      const sourceFrameHeight =
        image.height >= 208 && image.width >= 192
          ? 208
          : sourceFrameWidth * (208 / 192)
      canvas.width = 192
      canvas.height = 208
      ctx.imageSmoothingEnabled = false
      setReady(true)

      const draw = () => {
        if (cancelled) return
        ctx.clearRect(0, 0, 192, 208)
        ctx.drawImage(
          image!,
          0,
          0,
          sourceFrameWidth,
          sourceFrameHeight,
          0,
          0,
          192,
          208,
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
