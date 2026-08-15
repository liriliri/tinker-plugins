import { useEffect, useRef } from 'react'
import { reaction } from 'mobx'
import { createAquarium, type Aquarium } from '../lib/aquarium'
import store from '../store'

/** Owns the WebGL canvas and pushes reef changes from the store into three.js. */
export default function AquariumView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const aquarium: Aquarium = createAquarium(canvasRef.current, store.reef)
    let timer = 0

    // reaction skips the initial run — createAquarium already used store.reef.
    // Slider drags fire many times a second; debounce so rebuilds settle.
    const dispose = reaction(
      () => [
        store.reef.count,
        store.reef.size,
        store.reef.vibrance,
        store.reef.seed,
      ],
      () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          aquarium.setReef(store.reef)
        }, 80)
      },
    )

    return () => {
      dispose()
      window.clearTimeout(timer)
      aquarium.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  )
}
