import { observer } from 'mobx-react-lite'
import map from 'licia/map'
import store from '../store'
import { colors } from '../theme'

interface SideButtonProps {
  pressed: boolean
  path: string
  tickX: number
  tickY1: number
  tickY2: number
  fill: string
  pressedFill: string
  stroke: string
  accent: string
  tick: string
  tickOn: string
}

function SideButton({
  pressed,
  path,
  tickX,
  tickY1,
  tickY2,
  fill,
  pressedFill,
  stroke,
  accent,
  tick,
  tickOn,
}: SideButtonProps) {
  return (
    <g filter={pressed ? 'url(#softGlow)' : undefined}>
      <path
        d={path}
        fill={pressed ? pressedFill : fill}
        stroke={pressed ? accent : stroke}
        strokeWidth="1.2"
        opacity={pressed ? 1 : 0.95}
      />
      <path
        d={`M${tickX} ${tickY1} L${tickX} ${tickY2}`}
        stroke={pressed ? tickOn : tick}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={pressed ? 0.95 : 0.5}
      />
    </g>
  )
}

export const MouseVisual = observer(function MouseVisual() {
  const { isDark, pressed, wheel, activity } = store

  const left = pressed.has(0)
  const middle = pressed.has(1)
  const right = pressed.has(2)
  const back = pressed.has(3)
  const fwd = pressed.has(4)

  const shell = colors.mouseShell(isDark)
  const shellLit = colors.mouseShellLit(isDark)
  const stroke = colors.mouseStroke(isDark)
  const btn = colors.mouseBtn(isDark)
  const btnOn = colors.mouseBtnPressed(isDark)
  const text = colors.mouseBtnText(isDark)
  const textOn = colors.mouseBtnTextOn(isDark)
  const copper = colors.copper(isDark)
  const teal = colors.teal(isDark)

  const sensorGlow = 0.22 + Math.min(activity, 1) * 0.78
  const sensorR = 10 + Math.min(activity, 1) * 4

  const sideBtn = {
    fill: shellLit,
    pressedFill: btnOn,
    stroke,
    accent: copper,
    tick: text,
    tickOn: textOn,
  }

  return (
    <div className="relative w-[252px] h-[340px] shrink-0">
      <svg
        viewBox="0 0 252 340"
        className="w-full h-full drop-shadow-2xl"
        aria-hidden
      >
        <defs>
          <linearGradient id="shellGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={shellLit} />
            <stop offset="55%" stopColor={shell} />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="btnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shellLit} />
            <stop offset="100%" stopColor={btn} />
          </linearGradient>
          <radialGradient id="sensorGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={copper} stopOpacity={sensorGlow} />
            <stop
              offset="55%"
              stopColor={copper}
              stopOpacity={sensorGlow * 0.35}
            />
            <stop offset="100%" stopColor={copper} stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <SideButton
          {...sideBtn}
          pressed={back}
          path="M30 116 C24 118 21 126 21 138 C21 150 24 158 30 160 L46 158 C50 156 52 149 52 138 C52 127 50 120 46 118 Z"
          tickX={26}
          tickY1={128}
          tickY2={148}
        />
        <SideButton
          {...sideBtn}
          pressed={fwd}
          path="M28 166 C22 168 19 176 19 188 C19 200 22 208 28 210 L44 208 C48 206 50 199 50 188 C50 177 48 170 44 168 Z"
          tickX={24}
          tickY1={178}
          tickY2={198}
        />

        <path
          d="M126 18
             C174 18 204 48 214 96
             C226 150 228 205 214 255
             C200 300 164 324 126 326
             C88 324 52 300 38 255
             C24 205 26 150 38 96
             C48 48 78 18 126 18Z"
          fill="url(#shellGrad)"
          stroke={stroke}
          strokeWidth="2.5"
        />

        <path
          d="M72 215 C92 262 160 262 180 215 C190 190 184 168 126 168 C68 168 62 190 72 215Z"
          fill={stroke}
          opacity="0.18"
        />

        <g transform={left ? 'translate(0 2)' : undefined}>
          <path
            d="M126 28
               C98 28 72 42 58 68
               C48 92 44 118 48 138
               L118 138
               L118 36
               C122 31 124 28 126 28Z"
            fill={left ? btnOn : 'url(#btnGrad)'}
            stroke={stroke}
            strokeWidth="1.5"
            opacity={left ? 1 : 0.95}
          />
          <text
            x="82"
            y="92"
            textAnchor="middle"
            fill={left ? textOn : text}
            fontSize="13"
            fontWeight="700"
            fontFamily="Familjen Grotesk, sans-serif"
          >
            L
          </text>
        </g>

        <g transform={right ? 'translate(0 2)' : undefined}>
          <path
            d="M126 28
               C154 28 180 42 194 68
               C204 92 208 118 204 138
               L134 138
               L134 36
               C130 31 128 28 126 28Z"
            fill={right ? btnOn : 'url(#btnGrad)'}
            stroke={stroke}
            strokeWidth="1.5"
            opacity={right ? 1 : 0.95}
          />
          <text
            x="170"
            y="92"
            textAnchor="middle"
            fill={right ? textOn : text}
            fontSize="13"
            fontWeight="700"
            fontFamily="Familjen Grotesk, sans-serif"
          >
            R
          </text>
        </g>

        <line
          x1="126"
          y1="34"
          x2="126"
          y2="138"
          stroke={stroke}
          strokeWidth="1.5"
          opacity="0.45"
        />

        <rect
          x="116"
          y="52"
          width="20"
          height="58"
          rx="10"
          fill={middle ? btnOn : stroke}
          opacity={middle ? 1 : 0.55}
        />
        <rect
          x="120"
          y="60"
          width="12"
          height="42"
          rx="6"
          fill={middle ? textOn : shellLit}
          opacity="0.9"
        />
        {map([66, 74, 82, 90], (y) => (
          <line
            key={y}
            x1="122"
            y1={y}
            x2="130"
            y2={y}
            stroke={middle ? copper : stroke}
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        <path
          d="M126 44 L120 52 L132 52 Z"
          fill={wheel === 'up' ? copper : text}
          opacity={wheel === 'up' ? 1 : 0.35}
          filter={wheel === 'up' ? 'url(#softGlow)' : undefined}
        />
        <path
          d="M126 118 L120 110 L132 110 Z"
          fill={wheel === 'down' ? copper : text}
          opacity={wheel === 'down' ? 1 : 0.35}
          filter={wheel === 'down' ? 'url(#softGlow)' : undefined}
        />

        <rect
          x="114"
          y="198"
          width="24"
          height="6"
          rx="3"
          fill={teal}
          opacity="0.55"
        />

        <circle cx="126" cy="268" r={sensorR + 14} fill="url(#sensorGrad)" />
        <circle
          cx="126"
          cy="268"
          r="11"
          fill={stroke}
          stroke={copper}
          strokeWidth="1.5"
          opacity="0.9"
        />
        <circle
          cx="126"
          cy="268"
          r="4.5"
          fill={copper}
          opacity={0.4 + sensorGlow * 0.6}
          filter="url(#softGlow)"
        />
      </svg>
    </div>
  )
})
