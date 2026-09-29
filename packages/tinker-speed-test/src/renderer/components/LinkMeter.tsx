import { useEffect, useMemo, useRef, useState } from 'react'
import className from 'licia/className'
import isFinite from 'licia/isFinite'
import max from 'licia/max'
import { clamp01, toMeterScale } from '../lib/meter'
import { tw } from '../theme'

interface Props {
  valueLabel: string
  unit: string
  numericValue: number
  progress: number
  running: boolean
  isPing: boolean
  hint: string
}

const SCALE_MARKS_MBPS = [0, 50, 100, 250, 500, 1000]
const SCALE_MARKS_MS = [0, 20, 50, 100, 200, 500]
const TRAIL_MAX = 48
const SPARK_W = 100
const SPARK_H = 36

export default function LinkMeter({
  valueLabel,
  unit,
  numericValue,
  progress,
  running,
  isPing,
  hint,
}: Props) {
  const [trail, setTrail] = useState<number[]>([])
  const wasRunning = useRef(false)
  const pos = clamp01(toMeterScale(numericValue, isPing))
  const marks = isPing ? SCALE_MARKS_MS : SCALE_MARKS_MBPS

  useEffect(() => {
    if (running && !wasRunning.current) {
      setTrail([])
    }
    wasRunning.current = running
  }, [running])

  useEffect(() => {
    if (!running || !isFinite(numericValue)) return
    setTrail((prev) => {
      const next = [...prev, max(0, numericValue)]
      return next.length > TRAIL_MAX ? next.slice(-TRAIL_MAX) : next
    })
  }, [numericValue, running, progress, isPing])

  const spark = useMemo(() => {
    if (trail.length === 0) return ''
    const peak = max(...trail, 1e-6)
    const padY = 3
    const usableH = SPARK_H - padY * 2
    if (trail.length === 1) {
      const y = padY + (1 - trail[0] / peak) * usableH
      return `0,${y} ${SPARK_W},${y}`
    }
    return trail
      .map((v, i) => {
        const x = (i / (trail.length - 1)) * SPARK_W
        const y = padY + (1 - v / peak) * usableH
        return `${x},${y}`
      })
      .join(' ')
  }, [trail])

  const fillWidth = `${pos * 100}%`
  const needleLeft = `calc(${pos * 100}% - 1px)`

  return (
    <section className={className('overflow-hidden rounded-[4px]', tw.panel)}>
      <div className={tw.panelHeader}>
        <span className={tw.label}>{hint}</span>
        <span className={className('text-[11px]', tw.mono, tw.muted)}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className={className('px-4 py-5', tw.lcd)}>
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <div className={className(tw.lcdValue, tw.mono)}>{valueLabel}</div>
            <div className={className(tw.lcdUnit, tw.mono)}>{unit}</div>
          </div>
          <svg
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            preserveAspectRatio="none"
            className="mb-0.5 h-11 min-w-0 flex-1 opacity-80"
            aria-hidden
          >
            {spark ? (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={spark}
              />
            ) : null}
          </svg>
        </div>
      </div>

      <div className="px-3 pb-3 pt-3">
        <div className={tw.meterTrack}>
          <div
            className={tw.meterFill}
            data-live={running ? 'true' : 'false'}
            style={{ width: fillWidth }}
          />
          <div className={tw.meterNeedle} style={{ left: needleLeft }} />
        </div>
        <div className="mt-1.5 flex justify-between">
          {marks.map((mark) => (
            <span
              key={mark}
              className={className('text-[10px]', tw.mono, tw.tick)}
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
