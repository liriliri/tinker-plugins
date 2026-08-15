import { useEffect, useRef } from 'react'
import { reaction } from 'mobx'
import { createAquarium, type Aquarium } from '../lib/aquarium'
import store from '../store'

/** Owns the WebGL canvas and pushes reef changes from the store into three.js. */
export default function AquariumView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const aquarium: Aquarium = createAquarium(
      canvasRef.current,
      store.reef,
      store.view,
      (view) => store.setView(view),
    )
    let timer = 0

    const disposeReef = reaction(
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
    const disposeView = reaction(
      () => store.viewEpoch,
      () => aquarium.setView(store.view),
    )

    return () => {
      disposeReef()
      disposeView()
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
