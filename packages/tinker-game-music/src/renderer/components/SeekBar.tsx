import { useRef } from 'react'
import clamp from 'licia/clamp'
import { tw } from '../theme'

function bindHorizontalDrag(
  track: HTMLDivElement,
  clientX: number,
  onRatio: (ratio: number) => void,
) {
  const update = (x: number) => {
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return
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

interface SeekBarProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

export default function SeekBar({
  value,
  max,
  onChange,
  disabled,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const percentage = max > 0 ? (value / max) * 100 : 0
  const barStyle = { width: `${percentage}%` }
  const thumbStyle = { left: `calc(${percentage}% - 4px)` }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current || max <= 0 || disabled) return
    e.preventDefault()
    bindHorizontalDrag(trackRef.current, e.clientX, (ratio) =>
      onChange(ratio * max),
    )
  }

  return (
    <div
      ref={trackRef}
      className={`${tw.seek.track} ${disabled ? tw.seek.disabled : tw.seek.enabled}`}
      onMouseDown={handleMouseDown}
    >
      <div className={tw.seek.rail} />
      <div className={tw.seek.fill} style={barStyle} />
      <div className={tw.seek.thumb} style={thumbStyle} />
    </div>
  )
}
