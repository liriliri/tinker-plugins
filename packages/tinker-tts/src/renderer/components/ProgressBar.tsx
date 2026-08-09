import { useRef } from 'react'
import clamp from 'licia/clamp'
import className from 'licia/className'
import { tw } from '../theme'

function bindHorizontalDrag(
  track: HTMLDivElement,
  clientX: number,
  onRatio: (ratio: number) => void,
) {
  const update = (x: number) => {
    const rect = track.getBoundingClientRect()
    onRatio(clamp((x - rect.left) / rect.width, 0, 1))
  }

  update(clientX)

  const handleMouseMove = (ev: MouseEvent) => update(ev.clientX)
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

interface ProgressBarProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function ProgressBar({
  value,
  max,
  onChange,
  disabled,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const percentage = max > 0 ? (value / max) * 100 : 0

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current || max <= 0 || disabled) return
    bindHorizontalDrag(trackRef.current, e.clientX, (ratio) =>
      onChange(ratio * max),
    )
  }

  return (
    <div
      ref={trackRef}
      className={className(
        'group relative h-3',
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer',
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={className(
          'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5',
          tw.progress.track,
        )}
      />
      <div
        className={className(
          'absolute top-1/2 -translate-y-1/2 h-0.5 pointer-events-none',
          tw.progress.bar,
        )}
        style={{ width: `${percentage}%` }}
      />
      <div
        className={className(
          'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          tw.progress.bar,
        )}
        style={{ left: `calc(${percentage}% - 5px)` }}
      />
    </div>
  )
}

interface VolumeBarProps {
  value: number
  onChange: (value: number) => void
}

export function VolumeBar({ value, onChange }: VolumeBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const percentage = clamp(value, 0, 100)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return
    bindHorizontalDrag(trackRef.current, e.clientX, (ratio) =>
      onChange(Math.round(ratio * 100)),
    )
  }

  return (
    <div
      ref={trackRef}
      className={className(
        'group relative h-1 w-20 rounded-full cursor-pointer',
        tw.progress.track,
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={className(
          'absolute h-full rounded-full pointer-events-none',
          tw.progress.bar,
        )}
        style={{ width: `${percentage}%` }}
      />
      <div
        className={className(
          'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          tw.progress.bar,
        )}
        style={{ left: `calc(${percentage}% - 5px)` }}
      />
    </div>
  )
}
