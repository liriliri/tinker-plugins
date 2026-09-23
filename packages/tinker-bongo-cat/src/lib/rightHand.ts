import clamp from 'licia/clamp'
import max from 'licia/max'
import { tw } from '../theme'

/** Port of Mver `bezier` — factorial table is n!/1000. */
const FACT = [
  0.001, 0.001, 0.002, 0.006, 0.024, 0.12, 0.72, 5.04, 40.32, 362.88, 3628.8,
  39916.8, 479001.6, 6227020.8, 87178291.2, 1307674368.0, 20922789888.0,
  355687428096.0, 6402373705728.0, 121645100408832.0, 2432902008176640.0,
  51090942171709440.0,
]

function bezier(
  ratio: number,
  points: number[],
  length: number,
): [number, number] {
  const nn = length / 2 - 1
  let xx = 0
  let yy = 0

  for (let point = 0; point <= nn; point++) {
    const tmp =
      (FACT[nn] / (FACT[point] * FACT[nn - point])) *
      Math.pow(ratio, point) *
      Math.pow(1 - ratio, nn - point)
    xx += points[2 * point] * tmp
    yy += points[2 * point + 1] * tmp
  }

  return [xx / 1000, yy / 1000]
}

interface RightHandResult {
  mouseX: number
  mouseY: number
  polygon: number[]
}

/** Port of Mver `setrighthand` ("kuvster's magic"). */
export function computeRightHand(
  tipX: number,
  tipY: number,
  dx = -38,
  dy = -50,
): RightHandResult {
  const oof = 6
  const pss: number[] = [211.0, 159.0]
  const dist = max(Math.hypot(211 - tipX, 159 - tipY), 1)
  const centreleft0 = 211 - (0.7237 * dist) / 2
  const centreleft1 = 159 + (0.69 * dist) / 2

  for (let i = 1; i < oof; i++) {
    const bez = [211, 159, centreleft0, centreleft1, tipX, tipY]
    const [p0, p1] = bezier(i / oof, bez, 6)
    pss.push(p0, p1)
  }
  pss.push(tipX, tipY)

  let a = tipY - centreleft1
  let b = centreleft0 - tipX
  let le = max(Math.hypot(a, b), 1)
  a = tipX + (a / le) * 60
  b = tipY + (b / le) * 60

  const a1 = 258
  const a2 = 228
  const dist2 = max(Math.hypot(a1 - a, a2 - b), 1)
  const centreright0 = a1 - (0.6 * dist2) / 2
  const centreright1 = a2 + (0.8 * dist2) / 2
  const push = 20

  let s = tipX - centreleft0
  let t = tipY - centreleft1
  le = max(Math.hypot(s, t), 1)
  s *= push / le
  t *= push / le

  let s2 = a - centreright0
  let t2 = b - centreright1
  le = max(Math.hypot(s2, t2), 1)
  s2 *= push / le
  t2 *= push / le

  for (let i = 1; i < oof; i++) {
    const bez = [tipX, tipY, tipX + s, tipY + t, a + s2, b + t2, a, b]
    const [p0, p1] = bezier(i / oof, bez, 8)
    pss.push(p0, p1)
  }
  pss.push(a, b)

  for (let i = oof - 1; i > 0; i--) {
    const bez = [a1, a2, centreright0, centreright1, a, b]
    const [p0, p1] = bezier(i / oof, bez, 6)
    pss.push(p0, p1)
  }
  pss.push(a1, a2)

  const mouseX = (a + tipX) / 2 - 52 - 15
  const mouseY = (b + tipY) / 2 - 34 + 5

  const iter = 25
  const polygon: number[] = [pss[0] + dx, pss[1] + dy]
  for (let i = 1; i < iter; i++) {
    const [p0, p1] = bezier(i / iter, pss, 38)
    polygon.push(p0 + dx, p1 + dy)
  }
  polygon.push(pss[36] + dx, pss[37] + dy)

  return { mouseX, mouseY, polygon }
}

/** Map screen cursor → scene tip (Mver standard::draw). */
export function cursorToTip(
  screenX: number,
  screenY: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  const fx = clamp(screenX / screenW, 0, 1)
  const fy = clamp(screenY / screenH, 0, 1)
  return {
    x: -97 * fx + 44 * fy + 184,
    y: -76 * fx - 40 * fy + 324,
  }
}

export function drawArmOutline(
  ctx: CanvasRenderingContext2D,
  polygon: number[],
  color: string,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.globalAlpha = 0.3
  ctx.lineWidth = 7
  tracePolygon(ctx, polygon)
  ctx.stroke()

  ctx.globalAlpha = 1
  ctx.lineWidth = 6
  tracePolygon(ctx, polygon)
  ctx.stroke()
  ctx.restore()
}

export function drawArmFill(
  ctx: CanvasRenderingContext2D,
  polygon: number[],
  pattern: CanvasPattern | null,
) {
  ctx.save()
  tracePolygon(ctx, polygon, true)
  ctx.fillStyle = pattern ?? tw.arm.fill
  ctx.fill()
  ctx.restore()
}

function tracePolygon(
  ctx: CanvasRenderingContext2D,
  polygon: number[],
  close = false,
) {
  ctx.beginPath()
  ctx.moveTo(polygon[0], polygon[1])
  for (let i = 2; i < polygon.length; i += 2) {
    ctx.lineTo(polygon[i], polygon[i + 1])
  }
  if (close) ctx.closePath()
}
