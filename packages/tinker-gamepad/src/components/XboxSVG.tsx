import { stickVisualY } from '../lib/util'
import { colors, ABXY_COLORS } from '../theme'
import type { GamepadState } from '../types'

interface XboxSVGProps {
  isDark: boolean
  state: GamepadState
}

export function XboxSVG({ isDark, state }: XboxSVGProps) {
  const {
    leftX,
    leftY,
    rightX,
    rightY,
    l3Pressed,
    r3Pressed,
    lt,
    rt,
    lbPressed,
    rbPressed,
    APressed,
    BPressed,
    XPressed,
    YPressed,
    upPressed,
    downPressed,
    leftPressed,
    rightPressed,
    sharePressed,
    optionsPressed,
  } = state

  const bodyFill = colors.xboxBody(isDark)
  const bodyStroke = colors.xboxStroke(isDark)
  const accent = colors.accent(isDark)

  const stickFill = (x: number, y: number, pressed: boolean) => {
    if (pressed) return accent
    if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
      const alpha = Math.min(Math.abs(x) + Math.abs(y), 0.9)
      return colors.stickAlpha(isDark, alpha)
    }
    return bodyFill
  }

  const triggerFill = (val: number) => {
    if (!val) return bodyFill
    return colors.triggerAlpha(isDark, val)
  }

  const btnFill = (pressed: boolean, color?: string) => {
    if (!pressed) return bodyFill
    return color ?? accent
  }

  const btnStroke = (pressed: boolean, color?: string) => {
    if (!pressed) return bodyStroke
    return color ?? accent
  }

  return (
    <svg
      fill={bodyFill}
      stroke={bodyStroke}
      strokeWidth="2"
      viewBox="0 0 580.032 490"
      height="310"
      width="310"
    >
      <defs>
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>
        <g>
          <rect
            x="122"
            y="60"
            width="60"
            height="27"
            rx="6.5"
            fill={btnFill(lbPressed)}
            stroke={btnStroke(lbPressed)}
            filter={lbPressed ? 'url(#glow-cyan)' : undefined}
          />
          <rect
            x="400"
            y="60"
            width="60"
            height="27"
            rx="6.5"
            fill={btnFill(rbPressed)}
            stroke={btnStroke(rbPressed)}
            filter={rbPressed ? 'url(#glow-cyan)' : undefined}
          />
          <rect
            x="150"
            y="1"
            width="27"
            height="55"
            rx="8"
            fill={triggerFill(lt)}
            stroke={lt > 0 ? accent : bodyStroke}
          />
          <rect
            x="406"
            y="1"
            width="27"
            height="55"
            rx="8"
            fill={triggerFill(rt)}
            stroke={rt > 0 ? accent : bodyStroke}
          />

          <circle
            cx={142 + leftX * 19}
            cy={210.8 + stickVisualY(leftY) * 19}
            r="30"
            strokeWidth={l3Pressed ? '4' : '2'}
            stroke={l3Pressed ? accent : bodyStroke}
            fill={stickFill(leftX, leftY, l3Pressed)}
            filter={l3Pressed ? 'url(#glow-cyan)' : undefined}
          />
          <circle
            cx="249.019"
            cy="212.094"
            r="9.804"
            fill={btnFill(sharePressed)}
            stroke={btnStroke(sharePressed)}
          />

          <path d="M505.765,151.733c-16.255-10.392-4.528-16.329-21.353-29.193c-16.824-12.864-85.104-34.639-96.983-24.743 s-25.233,11.873-25.233,11.873h-72.112h-0.122h-72.118c0,0-13.36-1.977-25.233-11.873c-11.873-9.896-80.16,11.873-96.983,24.743 c-16.824,12.864-5.098,18.801-21.353,29.193C58.02,162.125,15.467,305.619,15.467,305.619s-55.417,159.824,43.544,179.12 c0,0,24.248-15.336,45.025-40.079c20.784-24.743,61.353-59.872,83.128-60.368c21.298-0.483,99.389-0.019,102.792,0l0,0 c0,0,0.024,0,0.061,0c0.043,0,0.062,0,0.062,0l0,0c3.403-0.019,81.494-0.483,102.792,0c21.769,0.496,62.345,35.625,83.128,60.368 s45.024,40.079,45.024,40.079c98.961-19.296,43.544-179.12,43.544-179.12S522.02,162.125,505.765,151.733z M438.047,149.107 c13.728,0,24.89,11.169,24.89,24.89c0,13.721-11.169,24.89-24.89,24.89s-24.89-11.163-24.89-24.89 S424.319,149.107,438.047,149.107z M399.932,187.204c13.727,0,24.89,11.163,24.89,24.89s-11.169,24.89-24.89,24.89 c-13.722,0-24.891-11.169-24.891-24.89S386.204,187.204,399.932,187.204z M332.146,196.17c8.782,0,15.924,7.148,15.924,15.93 s-7.142,15.924-15.924,15.924s-15.925-7.142-15.925-15.924S323.364,196.17,332.146,196.17z M93.062,211.103 c0-27.062,22.02-49.076,49.083-49.076c27.062,0,49.076,22.014,49.076,49.076c0,27.063-22.014,49.083-49.076,49.083 C115.082,260.185,93.062,238.166,93.062,211.103z M256.399,317.578c0,1.689-1.371,3.06-3.06,3.06h-22.448v22.455 c0,1.688-1.371,3.06-3.06,3.06h-24.235c-1.689,0-3.06-1.371-3.06-3.06v-22.455h-22.448c-1.689,0-3.06-1.37-3.06-3.06v-24.235 c0-1.689,1.371-3.059,3.06-3.059h22.448v-22.455c0-1.689,1.371-3.06,3.06-3.06h24.235c1.689,0,3.06,1.371,3.06,3.06v22.455h22.448 c1.689,0,3.06,1.37,3.06,3.059V317.578z M249.019,228.019c-8.782,0-15.924-7.142-15.924-15.924s7.142-15.931,15.924-15.931 s15.924,7.148,15.924,15.931S257.794,228.019,249.019,228.019z M365.299,349.745c-27.063,0-49.077-22.021-49.077-49.083c0-27.062,22.014-49.076,49.077-49.076 c27.062,0,49.076,22.014,49.076,49.076C414.375,327.725,392.361,349.745,365.299,349.745z M438.047,277.083 c-13.728,0-24.89-11.163-24.89-24.89s11.169-24.89,24.89-24.89s24.89,11.169,24.89,24.89S451.774,277.083,438.047,277.083z M479.1,236.99c-13.727,0-24.89-11.169-24.89-24.89c0-13.721,11.163-24.89,24.89-24.89c13.728,0,24.891,11.163,24.891,24.89 C503.99,225.828,492.827,236.99,479.1,236.99z" />

          {/* A - green */}
          <circle
            cx="438.047"
            cy="252.192"
            r="18.77"
            fill={btnFill(APressed, ABXY_COLORS.A)}
            stroke={btnStroke(APressed, ABXY_COLORS.A)}
            filter={APressed ? 'url(#glow-cyan)' : undefined}
          />
          {/* B - red */}
          <circle
            cx="479.1"
            cy="212.094"
            r="18.77"
            fill={btnFill(BPressed, ABXY_COLORS.B)}
            stroke={btnStroke(BPressed, ABXY_COLORS.B)}
            filter={BPressed ? 'url(#glow-cyan)' : undefined}
          />
          {/* Options */}
          <circle
            cx="332.146"
            cy="212.094"
            r="9.804"
            fill={btnFill(optionsPressed)}
            stroke={btnStroke(optionsPressed)}
          />
          {/* Y - yellow */}
          <circle
            cx="438.047"
            cy="173.997"
            r="18.77"
            fill={btnFill(YPressed, ABXY_COLORS.Y)}
            stroke={btnStroke(YPressed, ABXY_COLORS.Y)}
            filter={YPressed ? 'url(#glow-cyan)' : undefined}
          />
          {/* X - blue */}
          <circle
            cx="399.932"
            cy="212.094"
            r="18.77"
            fill={btnFill(XPressed, ABXY_COLORS.X)}
            stroke={btnStroke(XPressed, ABXY_COLORS.X)}
            filter={XPressed ? 'url(#glow-cyan)' : undefined}
          />

          <circle
            cx={365.2 + rightX * 19}
            cy={300.8 + stickVisualY(rightY) * 19}
            r="30"
            strokeWidth={r3Pressed ? '4' : '2'}
            stroke={r3Pressed ? accent : bodyStroke}
            fill={stickFill(rightX, rightY, r3Pressed)}
            filter={r3Pressed ? 'url(#glow-cyan)' : undefined}
          />

          {/* D-pad */}
          <path d="M224.771,293.343v-22.454h-18.115v22.454c0,1.689-1.371,3.061-3.06,3.061h-22.448v18.114h22.448 c1.689,0,3.06,1.371,3.06,3.061v22.454h18.115v-22.454c0-1.689,1.371-3.061,3.06-3.061h22.448v-18.114h-22.448 C226.142,296.403,224.771,295.032,224.771,293.343z" />
          <rect
            x="225"
            y="296.3"
            width="25.2"
            height="18.4"
            fill={btnFill(rightPressed)}
            stroke={btnStroke(rightPressed)}
          />
          <rect
            x="181.2"
            y="296.3"
            width="25.2"
            height="18.4"
            fill={btnFill(leftPressed)}
            stroke={btnStroke(leftPressed)}
          />
          <rect
            x="206.5"
            y="270.9"
            width="18.4"
            height="25.2"
            fill={btnFill(upPressed)}
            stroke={btnStroke(upPressed)}
          />
          <rect
            x="206.5"
            y="314.6"
            width="18.4"
            height="25.2"
            fill={btnFill(downPressed)}
            stroke={btnStroke(downPressed)}
          />
        </g>
      </g>
    </svg>
  )
}
