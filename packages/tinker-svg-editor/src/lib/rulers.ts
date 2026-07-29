import toNum from 'licia/toNum'

const RULER_INTERVALS: number[] = []
for (let i = 0.1; i < 1e5; i *= 10) {
  RULER_INTERVALS.push(i)
  RULER_INTERVALS.push(2 * i)
  RULER_INTERVALS.push(5 * i)
}

const RULER_THICKNESS = 16

interface RulersUpdateOptions {
  svgCanvasEl: HTMLElement
  contentEl: SVGSVGElement
  zoom: number
  rulerXCanvas: HTMLCanvasElement
  rulerYCanvas: HTMLCanvasElement
  tickColor: string
}

function prepareCanvas(
  canvas: HTMLCanvasElement,
  length: number,
  isX: boolean,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const dpr = window.devicePixelRatio || 1
  const wrap = canvas.parentElement
  if (wrap) {
    if (isX) wrap.style.width = `${length}px`
    else wrap.style.height = `${length}px`
  }

  const fresh = canvas.cloneNode(true) as HTMLCanvasElement
  canvas.replaceWith(fresh)
  canvas = fresh

  if (isX) {
    canvas.style.width = `${length}px`
    canvas.style.height = `${RULER_THICKNESS}px`
    canvas.width = Math.floor(length * dpr)
    canvas.height = Math.floor(RULER_THICKNESS * dpr)
  } else {
    canvas.style.width = `${RULER_THICKNESS}px`
    canvas.style.height = `${length}px`
    canvas.width = Math.floor(RULER_THICKNESS * dpr)
    canvas.height = Math.floor(length * dpr)
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, ctx: null }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(
    0,
    0,
    isX ? length : RULER_THICKNESS,
    isX ? RULER_THICKNESS : length,
  )
  return { canvas, ctx }
}

function drawAxis(
  canvas: HTMLCanvasElement,
  length: number,
  isX: boolean,
  contentDim: number,
  zoom: number,
  tickColor: string,
): HTMLCanvasElement {
  const prepared = prepareCanvas(canvas, length, isX)
  const ctx = prepared.ctx
  if (!ctx) return prepared.canvas

  const uMulti = zoom
  const rawM = 50 / uMulti
  let multi = 1
  for (const num of RULER_INTERVALS) {
    multi = num
    if (rawM <= num) break
  }

  const bigInt = multi * uMulti
  ctx.font = "600 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  ctx.fillStyle = tickColor
  ctx.strokeStyle = tickColor
  ctx.beginPath()

  let rulerD = ((contentDim / uMulti) % multi) * uMulti
  let labelPos = rulerD - bigInt

  while (rulerD < length) {
    labelPos += bigInt
    const curD = Math.round(rulerD) + 0.5
    if (isX) {
      ctx.moveTo(curD, RULER_THICKNESS)
      ctx.lineTo(curD, 0)
    } else {
      ctx.moveTo(RULER_THICKNESS, curD)
      ctx.lineTo(0, curD)
    }

    const num = (labelPos - contentDim) / uMulti
    let label: string | number
    if (multi >= 1) {
      label = Math.round(num)
    } else {
      const decs = String(multi).split('.')[1]?.length ?? 1
      label = Number(num.toFixed(decs))
    }

    if (label !== 0 && label !== 1000 && Number(label) % 1000 === 0) {
      label = Number(label) / 1000 + 'K'
    }

    if (isX) {
      ctx.fillText(String(label), rulerD + 2, 8)
    } else {
      const chars = String(label).split('')
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], 1, rulerD + 9 + i * 9)
      }
    }

    const part = bigInt / 10
    for (let i = 1; i < 10; i++) {
      const subD = Math.round(rulerD + part * i) + 0.5
      const lineNum = i % 2 ? 12 : 10
      if (isX) {
        ctx.moveTo(subD, 15)
        ctx.lineTo(subD, lineNum)
      } else {
        ctx.moveTo(15, subD)
        ctx.lineTo(lineNum, subD)
      }
    }

    rulerD += bigInt
  }

  ctx.stroke()
  return prepared.canvas
}

export function updateRulers(opts: RulersUpdateOptions) {
  const {
    svgCanvasEl,
    contentEl,
    zoom,
    rulerXCanvas,
    rulerYCanvas,
    tickColor,
  } = opts

  const width = svgCanvasEl.offsetWidth
  const height = svgCanvasEl.offsetHeight
  const contentX = toNum(contentEl.getAttribute('x') || 0)
  const contentY = toNum(contentEl.getAttribute('y') || 0)

  drawAxis(rulerXCanvas, width, true, contentX, zoom, tickColor)
  drawAxis(rulerYCanvas, height, false, contentY, zoom, tickColor)
}
