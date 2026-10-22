import { useEffect, useRef } from 'react'
import className from 'licia/className'
import map from 'licia/map'
import range from 'licia/range'
import { readSound } from '../lib/sound'
import { tw } from '../theme'

const BARS = 32
const BAR_INDEX = range(BARS)

function levels() {
  const { bands } = readSound()
  const group = bands.length / BARS
  const out: number[] = []
  for (let i = 0; i < BARS; i++) {
    const start = (i * group) | 0
    const end = ((i + 1) * group) | 0
    let sum = 0
    for (let j = start; j < end; j++) sum += bands[j]
    out.push(sum / Math.max(1, end - start))
  }
  return out
}

function Meter() {
  const bars = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shown = Array.from({ length: BARS }, () => 0.08)
    let frame = 0
    const paint = () => {
      const target = reduce ? shown.map(() => 0.12) : levels()
      for (let i = 0; i < BARS; i++) {
        shown[i] += (target[i] - shown[i]) * (reduce ? 1 : 0.42)
        const el = bars.current[i]
        if (!el) continue
        const value = shown[i]
        el.style.height = `${Math.max(8, value * 100)}%`
        el.style.opacity = String(0.1 + value * 0.18)
      }
      if (!reduce) frame = window.requestAnimationFrame(paint)
    }
    frame = window.requestAnimationFrame(paint)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-4 right-[clamp(16px,3.5vw,40px)] z-20 flex h-20 items-end gap-[3px]"
    >
      {map(BAR_INDEX, (index) => (
        <div
          key={index}
          ref={(el) => {
            bars.current[index] = el
          }}
          className={className('h-[8%] w-1.5 rounded-[1px]', tw.bar)}
        />
      ))}
    </div>
  )
}

export default Meter
