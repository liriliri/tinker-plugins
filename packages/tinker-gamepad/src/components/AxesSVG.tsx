import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors } from '../theme'
import { renderPath, stickVisualY } from '../lib/util'
import type { GamepadState } from '../types'

interface AxesSVGProps {
  isDark: boolean
  state: GamepadState
}

const MAX_POINTS = 300
const RADIUS = 78.5

function useStickPath(x: number, y: number) {
  const [path, setPath] = useState<[number, number][]>([])
  useEffect(() => {
    setPath((prev) => {
      const updated: [number, number][] = [
        ...prev,
        [x * RADIUS, stickVisualY(y) * RADIUS],
      ]
      return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated
    })
  }, [x, y])
  return { path, clear: () => setPath([]) }
}

interface StickViewProps {
  cx: number
  x: number
  y: number
  pressed: boolean
  path: [number, number][]
  accent: string
  gridColor: string
  dotColor: string
}

function StickView({
  cx,
  x,
  y,
  pressed,
  path,
  accent,
  gridColor,
  dotColor,
}: StickViewProps) {
  const px = x * RADIUS
  const py = stickVisualY(y) * RADIUS
  return (
    <g transform={`translate(${cx} ${RADIUS}) scale(0.95,0.95)`}>
      <circle
        cx="0"
        cy="0"
        r={RADIUS}
        fill="none"
        stroke={gridColor}
        strokeWidth={pressed ? 3 : 1}
      />
      <line
        x1="0"
        y1={-RADIUS}
        x2="0"
        y2={RADIUS}
        stroke={gridColor}
        strokeWidth="1"
      />
      <line
        x1={-RADIUS}
        y1="0"
        x2={RADIUS}
        y2="0"
        stroke={gridColor}
        strokeWidth="1"
      />
      <path
        d={renderPath(path)}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.7"
      />
      <line
        x1="0"
        y1="0"
        x2={px}
        y2={py}
        stroke={dotColor}
        strokeWidth="1"
        opacity="0.5"
      />
      <circle
        cx={px}
        cy={py}
        r="5"
        fill={accent}
        stroke="none"
        filter="url(#dot-glow)"
      />
    </g>
  )
}

export function AxesSVG({ isDark, state }: AxesSVGProps) {
  const { t } = useTranslation()
  const { path: leftPath, clear: clearLeft } = useStickPath(
    state.leftX,
    state.leftY,
  )
  const { path: rightPath, clear: clearRight } = useStickPath(
    state.rightX,
    state.rightY,
  )
  const [hovered, setHovered] = useState(false)

  const clearPaths = () => {
    clearLeft()
    clearRight()
  }

  const accent = colors.accent(isDark)
  const gridColor = colors.gridColor(isDark)
  const dotColor = colors.dotColor(isDark)
  const clearBtnText = colors.clearBtnText(isDark)
  const clearBtnBorder = colors.clearBtnBorder(isDark)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={clearPaths}
        className="text-[11px] tracking-widest uppercase px-3 py-1 rounded transition-colors"
        style={{
          border: `1px solid ${hovered ? accent : clearBtnBorder}`,
          color: hovered ? accent : clearBtnText,
          background: 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {t('clearPaths')}
      </button>
      <svg viewBox="0 0 337 157" height="140" width="310">
        <defs>
          <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <StickView
          cx={78.5}
          x={state.leftX}
          y={state.leftY}
          pressed={state.l3Pressed}
          path={leftPath}
          accent={accent}
          gridColor={gridColor}
          dotColor={dotColor}
        />
        <StickView
          cx={258.5}
          x={state.rightX}
          y={state.rightY}
          pressed={state.r3Pressed}
          path={rightPath}
          accent={accent}
          gridColor={gridColor}
          dotColor={dotColor}
        />
      </svg>
    </div>
  )
}
