import clamp from 'licia/clamp'
import max from 'licia/max'
import min from 'licia/min'
import toInt from 'licia/toInt'

export interface BurstParticle {
  x: number
  length: number
  color: string
  rise: number
  durationMs: number
  born: number
}

const BURST_SPEED = 170
const BURST_BOTTOM = 18
const BURST_WIDTH = 12
const BURST_MIN = 12
const BURST_MAX = 96
const BURST_GROW_PER_MS = 0.07

export function burstLength(holdMs: number) {
  return clamp(BURST_MIN + holdMs * BURST_GROW_PER_MS, BURST_MIN, BURST_MAX)
}

export function burstTiming(deskH: number) {
  const rise = max(deskH - BURST_BOTTOM - BURST_MIN, 48)
  const durationMs = max(520, Math.round((rise / BURST_SPEED) * 1000))
  return { rise, durationMs }
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export function drawBursts(
  ctx: CanvasRenderingContext2D,
  bursts: BurstParticle[],
  now: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]
    const t = clamp((now - b.born) / b.durationMs, 0, 1)
    if (t >= 1) {
      bursts.splice(i, 1)
      continue
    }
    const eased = easeOutCubic(t)
    const y = height - BURST_BOTTOM - eased * b.rise
    // Fade early so trails disappear mid-flight instead of lingering
    const fadeStart = 0.42
    const fadeEnd = 0.62
    const alpha =
      t <= fadeStart
        ? 1
        : t >= fadeEnd
          ? 0
          : 1 - (t - fadeStart) / (fadeEnd - fadeStart)
    const x = b.x - BURST_WIDTH / 2
    const top = y - b.length
    const r = min(2, BURST_WIDTH / 2, b.length / 2)

    ctx.globalAlpha = alpha
    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.moveTo(x + r, top)
    ctx.arcTo(x + BURST_WIDTH, top, x + BURST_WIDTH, top + b.length, r)
    ctx.arcTo(x + BURST_WIDTH, top + b.length, x, top + b.length, r)
    ctx.arcTo(x, top + b.length, x, top, r)
    ctx.arcTo(x, top, x + BURST_WIDTH, top, r)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function syncCanvasSize(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
) {
  const dpr = min(window.devicePixelRatio || 1, 2)
  const w = max(1, toInt(cssW * dpr))
  const h = max(1, toInt(cssH * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}
