import clamp from 'licia/clamp'
import compact from 'licia/compact'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import toNum from 'licia/toNum'
import { makeAutoObservable, runInAction } from 'mobx'
import SvgCanvasCtor from '@svgedit/svgcanvas'
import type { SvgCanvas } from './lib/canvasTypes'
import { buildSelectionInfo } from './lib/selection'
import { displayColor, normalizeHex, toPaintHex } from './lib/palette'
import { svgToPngBytes } from './lib/svgToPng'
import type { CanvasSize, ColorTarget, SelectionInfo, ToolMode } from './types'
import { createMcpApi } from './mcp'
import { COLOR_INPUT_FILL, COLOR_INPUT_STROKE } from './theme'

const DEFAULT_SIZE: CanvasSize = { width: 800, height: 600 }
const CANVAS_EXPANSION = 3

type ZoomBBox = {
  x: number
  y: number
  width: number
  height: number
  factor?: number
  zoom?: number
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  ready = false
  mode: ToolMode = 'select'
  colorTarget: ColorTarget = 'fill'
  fill = COLOR_INPUT_FILL
  stroke = COLOR_INPUT_STROKE
  strokeWidth = 1.5
  canvasSize = { ...DEFAULT_SIZE }
  selection: SelectionInfo = buildSelectionInfo([])
  sourceOpen = false
  sourceText = ''
  fileName = 'untitled.svg'
  filePath: string | null = null
  rulersVersion = 0
  historyVersion = 0
  spacePan = false
  isPanning = false

  private _canvas: SvgCanvas | null = null
  private workarea: HTMLElement | null = null
  private textInput: HTMLInputElement | null = null
  private panLast = { x: 0, y: 0 }

  constructor() {
    makeAutoObservable(
      this,
      {
        mcp: false,
        // Private fields are invisible to AnnotationsMap under useDefineForClassFields
        _canvas: false,
        workarea: false,
        textInput: false,
        panLast: false,
      } as never,
      { autoBind: true },
    )
  }

  get hasSelection() {
    return this.selection.elements.length > 0
  }

  get isMulti() {
    return this.selection.elements.length > 1
  }

  get canvas() {
    return this._canvas
  }

  get canUndo() {
    // Depend on historyVersion so MobX recomputes after stack changes
    void this.historyVersion
    return (this._canvas?.undoMgr.getUndoStackSize() ?? 0) > 0
  }

  get canRedo() {
    void this.historyVersion
    return (this._canvas?.undoMgr.getRedoStackSize() ?? 0) > 0
  }

  init(
    container: HTMLElement,
    workarea: HTMLElement,
    textInput: HTMLInputElement,
  ) {
    if (this._canvas) return

    this.workarea = workarea
    this.textInput = textInput

    const canvas = new SvgCanvasCtor(container, {
      canvas_expansion: CANVAS_EXPANSION,
      dimensions: [DEFAULT_SIZE.width, DEFAULT_SIZE.height],
      initFill: { color: 'ffffff', opacity: 1 },
      initStroke: { width: 1.5, color: '000000', opacity: 1 },
      initOpacity: 1,
      text: { stroke_width: 0, font_size: 24, font_family: 'sans-serif' },
      baseUnit: 'px',
      show_outside_canvas: false,
      // Method Draw keeps the active tool after each draw; svgcanvas's
      // selectNew=true also forces setMode('select') after shape tools.
      selectNew: false,
      initTool: 'select',
    }) as unknown as SvgCanvas

    canvas.textActions.setInputElem(textInput)
    canvas.bind('selected', (_win: Window, elems: Element[]) => {
      runInAction(() => {
        this.selection = buildSelectionInfo(elems || [])
        this.syncColorsFromSelection()
        // textActions.toSelectMode sets canvas mode to select without setMode()
        if (this.mode === 'text' && canvas.getMode() === 'select') {
          this.mode = 'select'
        }
      })
    })
    canvas.bind('changed', (_win: Window, elems: Element[]) => {
      runInAction(() => {
        this.historyVersion++
        const selected = compact(canvas.getSelectedElements())
        if (selected.length) {
          this.selection = buildSelectionInfo(selected)
          this.syncColorsFromSelection()
          return
        }
        // Undo/redo clears selection before applying; sync paint chips from the
        // affected elements so the UI matches the restored attributes.
        this.selection = buildSelectionInfo([])
        const el = compact(elems || []).find((e) => e.isConnected)
        if (!el) return
        this.syncColorsFromElement(el)
        canvas.setColor('fill', this.fill, true)
        canvas.setColor('stroke', this.stroke, true)
      })
    })
    canvas.bind('zoomed', (_win: Window, bbox: ZoomBBox) => {
      runInAction(() => {
        this.handleZoomed(bbox)
      })
    })

    this._canvas = canvas
    canvas.setMode('select')
    canvas.spaceKey = false
    this.updateCanvas(true)
    this.ready = true
    this.setFileName(this.fileName)

    window.addEventListener('resize', this.handleResize)
    // Capture so spaceKey is set before svgcanvas handles the event
    workarea.addEventListener('mousedown', this.onPanMouseDown, true)
    window.addEventListener('mousemove', this.onPanMouseMove)
    window.addEventListener('mouseup', this.onPanMouseUp)
    workarea.addEventListener('dblclick', this.onPanDblClick)
    workarea.addEventListener('wheel', this.onWheel, { passive: false })
  }

  setFileName(name: string) {
    this.fileName = name
    tinker.setTitle(name)
  }

  getSvgString() {
    const canvas = this._canvas
    if (!canvas) throw new Error('SVG canvas is not ready')
    return canvas.getSvgString()
  }

  loadSvgString(content: string) {
    const canvas = this._canvas
    if (!canvas) throw new Error('SVG canvas is not ready')
    if (!canvas.setSvgString(content)) {
      throw new Error('Failed to parse SVG content')
    }
    const res = canvas.getResolution()
    this.canvasSize = {
      width: Math.round(res.w),
      height: Math.round(res.h),
    }
    this.selection = buildSelectionInfo([])
    this.updateCanvas(true)
    this.historyVersion++
  }

  async openSvgFromPath(path: string) {
    try {
      await tinker.fstat(path)
    } catch {
      throw new Error(`SVG file not found: ${path}`)
    }
    const content = (await tinker.readFile(path, 'utf-8')) as string
    this.loadSvgString(content)
    this.filePath = path
    const { name } = splitPath(path)
    this.setFileName(name)
  }

  async saveSvgToPath(path: string) {
    const svg = this.getSvgString()
    await tinker.writeFile(path, svg)
    this.filePath = path
    const { name } = splitPath(path)
    this.setFileName(name)
    return path
  }

  async exportPngToPath(path: string) {
    const svg = this.getSvgString()
    const { width, height } = this.canvasSize
    const png = await svgToPngBytes(svg, width, height)
    await tinker.writeFile(path, png)
    return path
  }

  setSvgContent(content: string) {
    this.loadSvgString(content)
    this.sourceText = content
    this.sourceOpen = false
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize)
    this.workarea?.removeEventListener('mousedown', this.onPanMouseDown, true)
    window.removeEventListener('mousemove', this.onPanMouseMove)
    window.removeEventListener('mouseup', this.onPanMouseUp)
    this.workarea?.removeEventListener('dblclick', this.onPanDblClick)
    this.workarea?.removeEventListener('wheel', this.onWheel)
  }

  private handleResize = () => {
    this.updateCanvas(false)
  }

  private shouldPan(evt: MouseEvent) {
    return this.mode === 'pan' || this.spacePan || evt.button === 1
  }

  private onPanMouseDown = (evt: MouseEvent) => {
    const canvas = this._canvas
    const workarea = this.workarea
    if (!canvas || !workarea || !this.shouldPan(evt)) return

    evt.preventDefault()
    canvas.spaceKey = true
    this.isPanning = true
    this.panLast = { x: evt.clientX, y: evt.clientY }
  }

  private onPanMouseMove = (evt: MouseEvent) => {
    const workarea = this.workarea
    if (!this.isPanning || !workarea) return
    workarea.scrollLeft -= evt.clientX - this.panLast.x
    workarea.scrollTop -= evt.clientY - this.panLast.y
    this.panLast = { x: evt.clientX, y: evt.clientY }
  }

  private onPanMouseUp = () => {
    if (!this.isPanning) return
    this.isPanning = false
    if (this._canvas) {
      this._canvas.spaceKey = this.spacePan
    }
  }

  private onPanDblClick = () => {
    if (this.mode === 'pan') this.setMode('select')
  }

  private onWheel = (evt: WheelEvent) => {
    if (!evt.altKey) return
    evt.preventDefault()

    const canvas = this._canvas
    const workarea = this.workarea
    if (!canvas || !workarea) return

    const oldZoom = canvas.getZoom()
    const factor = evt.deltaY > 0 ? 0.9 : 1.1
    const newZoom = clamp(oldZoom * factor, 0.01, 64)
    if (newZoom === oldZoom) return

    const rect = workarea.getBoundingClientRect()
    const mx = evt.clientX - rect.left
    const my = evt.clientY - rect.top
    const cnvs = workarea.querySelector('#svgcanvas') as HTMLElement | null
    const oldW = cnvs?.clientWidth || workarea.clientWidth
    const oldH = cnvs?.clientHeight || workarea.clientHeight
    // Canvas-space point under the cursor before zoom
    const beforeX = workarea.scrollLeft + mx
    const beforeY = workarea.scrollTop + my

    canvas.setZoom(newZoom)

    const wOrig = workarea.clientWidth
    const hOrig = workarea.clientHeight
    const multi = CANVAS_EXPANSION
    const w = Math.max(wOrig, canvas.contentW * newZoom * multi)
    const h = Math.max(hOrig, canvas.contentH * newZoom * multi)
    workarea.style.overflow = w === wOrig && h === hOrig ? 'hidden' : 'scroll'
    if (cnvs) {
      cnvs.style.width = `${w}px`
      cnvs.style.height = `${h}px`
    }
    canvas.updateCanvas(w, h)

    // Keep the same canvas point under the cursor after scaling from center
    const scaleX = oldW ? w / oldW : 1
    const scaleY = oldH ? h / oldH : 1
    const afterX = w / 2 + (beforeX - oldW / 2) * scaleX
    const afterY = h / 2 + (beforeY - oldH / 2) * scaleY
    workarea.scrollLeft = afterX - mx
    workarea.scrollTop = afterY - my

    this.rulersVersion++
  }

  startSpacePan() {
    if (this.spacePan) return
    this.spacePan = true
    if (this._canvas) this._canvas.spaceKey = true
  }

  stopSpacePan() {
    if (!this.spacePan) return
    this.spacePan = false
    this.isPanning = false
    if (this._canvas) this._canvas.spaceKey = false
  }

  private handleZoomed(bbox: ZoomBBox) {
    const canvas = this._canvas
    const workarea = this.workarea
    if (!canvas || !workarea) return

    const zInfo = canvas.setBBoxZoom(
      bbox,
      workarea.clientWidth - 15,
      workarea.clientHeight - 15,
    )
    if (!zInfo) return

    const { zoom, bbox: bb } = zInfo
    if (zoom < 0.001) {
      canvas.setZoom(0.1)
      this.updateCanvas(true)
      return
    }

    this.updateCanvas(false, {
      x: bb.x * zoom + (bb.width * zoom) / 2,
      y: bb.y * zoom + (bb.height * zoom) / 2,
    })

    // Match Method Draw: after a zoom-box drag, return to select
    if (this.mode === 'zoom' && bb.width) {
      this.setMode('select')
    }
  }

  updateCanvas(center = false, newCtr?: { x: number; y: number }) {
    const canvas = this._canvas
    const workarea = this.workarea
    if (!canvas || !workarea) return

    const zoom = canvas.getZoom()
    const wOrig = workarea.clientWidth
    const hOrig = workarea.clientHeight
    const multi = CANVAS_EXPANSION
    let w = Math.max(wOrig, canvas.contentW * zoom * multi)
    let h = Math.max(hOrig, canvas.contentH * zoom * multi)

    workarea.style.overflow = w === wOrig && h === hOrig ? 'hidden' : 'scroll'

    const cnvs = workarea.querySelector('#svgcanvas') as HTMLElement | null
    const oldCanX = (cnvs?.clientWidth ?? wOrig) / 2
    const oldCanY = (cnvs?.clientHeight ?? hOrig) / 2
    const oldCtr = {
      x: workarea.scrollLeft + wOrig / 2,
      y: workarea.scrollTop + hOrig / 2,
    }

    if (cnvs) {
      cnvs.style.width = `${w}px`
      cnvs.style.height = `${h}px`
    }

    const offset = canvas.updateCanvas(w, h)
    const newCanX = w / 2
    const newCanY = h / 2
    const ratio = oldCanX ? newCanX / oldCanX : 1

    let ctr = newCtr
    if (!ctr) {
      ctr = {
        x: newCanX + (oldCtr.x - oldCanX) * ratio,
        y: newCanY + (oldCtr.y - oldCanY) * ratio,
      }
    } else {
      ctr = { x: ctr.x + offset.x, y: ctr.y + offset.y }
    }

    if (center) {
      if (canvas.contentW > wOrig) {
        workarea.scrollLeft = Math.max(0, offset.x - 10)
        workarea.scrollTop = Math.max(0, offset.y - 10)
      } else {
        workarea.scrollLeft = w / 2 - wOrig / 2
        workarea.scrollTop = h / 2 - hOrig / 2
      }
    } else {
      workarea.scrollLeft = ctr.x - wOrig / 2
      workarea.scrollTop = ctr.y - hOrig / 2
    }

    this.rulersVersion++
  }

  setMode(mode: ToolMode) {
    this.mode = mode
    this._canvas?.setMode(mode)
    // Freehand / line / path need a visible stroke; selecting text or
    // fill-only shapes can leave stroke=none or stroke-width=0 on canvas.
    if (mode === 'fhpath' || mode === 'line' || mode === 'path') {
      this.ensureStrokeForDrawing()
    }
  }

  private ensureStrokeForDrawing() {
    const canvas = this._canvas
    if (!canvas) return
    if (this.stroke === 'none') {
      this.applyColor('stroke', COLOR_INPUT_STROKE, true)
    }
    const width = toNum(canvas.getStrokeWidth())
    if (!(width > 0)) {
      this.setStrokeWidth(this.strokeWidth > 0 ? this.strokeWidth : 1.5)
    }
  }

  setColorTarget(target: ColorTarget) {
    this.colorTarget = target
  }

  swapColors() {
    const fill = this.fill
    this.fill = this.stroke
    this.stroke = fill
    this.applyColor('fill', this.fill)
    this.applyColor('stroke', this.stroke)
  }

  applyColor(type: ColorTarget, color: string, noUndo = false) {
    const canvas = this._canvas
    if (!canvas) return
    const normalized = normalizeHex(color)
    if (type === 'fill') this.fill = normalized
    else this.stroke = normalized
    canvas.setColor(type, normalized, noUndo)
    if (normalized === 'none') return

    // After select, svgcanvas copies fill-opacity/stroke-opacity from the
    // element; missing attrs become null. null !== 1 would spuriously push an
    // invisible opacity command onto the undo stack and make the first Undo
    // appear to do nothing.
    const raw =
      type === 'fill' ? canvas.getFillOpacity() : canvas.getStrokeOpacity()
    const opac = raw == null || raw === '' ? 1 : toNum(raw)
    if (opac !== 1) {
      canvas.setPaintOpacity(type, 1, true)
    }
  }

  setStrokeWidth(width: number) {
    this.strokeWidth = width
    this._canvas?.setStrokeWidth(width)
  }

  setCanvasSize(width: number, height: number) {
    const canvas = this._canvas
    if (!canvas) return
    const w = Math.max(1, Math.round(width))
    const h = Math.max(1, Math.round(height))
    if (canvas.setResolution(w, h)) {
      this.canvasSize = { width: w, height: h }
      this.updateCanvas(true)
    }
  }

  /** Mirror Method Draw PaintBox.update — sync fill/stroke chips from selection. */
  private paintColorFromElement(
    el: Element,
    type: 'fill' | 'stroke',
  ): string | null {
    switch (el.tagName) {
      case 'use':
      case 'image':
      case 'foreignObject':
        return null
      case 'g':
      case 'a': {
        const children = el.getElementsByTagName('*')
        if (!children.length) return null
        let common: string | null = null
        for (let i = 0; i < children.length; i++) {
          const p = children[i].getAttribute(type)
          if (i === 0) common = p
          else if (common !== p) return null
        }
        return common
      }
      default: {
        const defColor = type === 'fill' ? 'black' : 'none'
        return el.getAttribute(type) || defColor
      }
    }
  }

  private syncColorsFromElement(el: Element) {
    const fill = this.paintColorFromElement(el, 'fill')
    if (fill != null && !startWith(fill, 'url(')) {
      this.fill = toPaintHex(fill, COLOR_INPUT_STROKE)
    }

    const stroke = this.paintColorFromElement(el, 'stroke')
    if (stroke != null && !startWith(stroke, 'url(')) {
      this.stroke = toPaintHex(stroke, 'none')
    }

    const sw = el.getAttribute('stroke-width')
    if (sw) this.strokeWidth = toNum(sw) || this.strokeWidth
  }

  private syncColorsFromSelection() {
    const el = this.selection.elements[0]
    if (!el) return
    this.syncColorsFromElement(el)
  }

  setTextContent(text: string) {
    this._canvas?.setTextContent(text)
  }

  finishTextEdit() {
    const canvas = this._canvas
    if (!canvas || canvas.getMode() !== 'textedit') return
    canvas.textActions.toSelectMode(true)
    this.mode = 'select'
  }

  toggleBold() {
    const canvas = this._canvas
    if (!canvas) return
    canvas.setBold(!canvas.getBold())
    this.selection = {
      ...this.selection,
      isBold: canvas.getBold(),
    }
  }

  toggleItalic() {
    const canvas = this._canvas
    if (!canvas) return
    canvas.setItalic(!canvas.getItalic())
    this.selection = {
      ...this.selection,
      isItalic: canvas.getItalic(),
    }
  }

  setFontSize(size: number) {
    this._canvas?.setFontSize(size)
    if (this.selection.panel === 'text') {
      this.selection = { ...this.selection, fontSize: String(size) }
    }
  }

  setRoundness(rx: number) {
    this._canvas?.changeSelectedAttribute('rx', Math.max(0, rx))
    if (this.selection.panel === 'rect') {
      this.selection = {
        ...this.selection,
        attrs: { ...this.selection.attrs, rx: String(rx) },
      }
    }
  }

  newDocument() {
    const canvas = this._canvas
    if (!canvas) return
    canvas.clear()
    canvas.setResolution(DEFAULT_SIZE.width, DEFAULT_SIZE.height)
    this.canvasSize = { ...DEFAULT_SIZE }
    this.fill = COLOR_INPUT_FILL
    this.stroke = COLOR_INPUT_STROKE
    this.strokeWidth = 1.5
    canvas.setColor('fill', this.fill, true)
    canvas.setColor('stroke', this.stroke, true)
    canvas.setStrokeWidth(this.strokeWidth)
    this.filePath = null
    this.setFileName('untitled.svg')
    this.selection = buildSelectionInfo([])
    this.historyVersion++
    this.setMode('select')
    this.updateCanvas(true)
  }

  async openSvg() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'SVG', extensions: ['svg'] }],
    })
    if (result.canceled || !result.filePaths.length) return
    await this.openSvgFromPath(result.filePaths[0])
  }

  async saveSvg() {
    if (!this._canvas) return
    const result = await tinker.showSaveDialog({
      defaultPath: this.filePath || this.fileName,
      filters: [{ name: 'SVG', extensions: ['svg'] }],
    })
    if (result.canceled || !result.filePath) return
    await this.saveSvgToPath(result.filePath)
  }

  async exportPng() {
    if (!this._canvas) return
    const { name, ext } = splitPath(this.fileName)
    const stem = ext ? name.slice(0, -ext.length) : name
    const result = await tinker.showSaveDialog({
      defaultPath: `${stem}.png`,
      filters: [{ name: 'PNG', extensions: ['png'] }],
    })
    if (result.canceled || !result.filePath) return
    await this.exportPngToPath(result.filePath)
  }

  openSource() {
    const canvas = this._canvas
    if (!canvas) return
    this.sourceText = canvas.getSvgString()
    this.sourceOpen = true
  }

  closeSource() {
    this.sourceOpen = false
  }

  applySource() {
    try {
      this.setSvgContent(this.sourceText)
    } catch {
      /* invalid SVG — keep dialog open */
    }
  }

  setSourceText(text: string) {
    this.sourceText = text
  }

  undo() {
    if (!this.canUndo) return
    this._canvas?.undoMgr.undo()
  }

  redo() {
    if (!this.canRedo) return
    this._canvas?.undoMgr.redo()
  }

  cut() {
    this._canvas?.cutSelectedElements()
  }

  copy() {
    this._canvas?.copySelectedElements()
  }

  paste(clientX?: number, clientY?: number) {
    const canvas = this._canvas
    const workarea = this.workarea
    if (!canvas || !workarea) return
    const zoom = canvas.getZoom()
    let x: number
    let y: number
    if (clientX != null && clientY != null) {
      const rect = workarea.getBoundingClientRect()
      x = (workarea.scrollLeft + clientX - rect.left) / zoom - canvas.contentW
      y = (workarea.scrollTop + clientY - rect.top) / zoom - canvas.contentH
    } else {
      x =
        (workarea.scrollLeft + workarea.offsetWidth / 2) / zoom -
        canvas.contentW
      y =
        (workarea.scrollTop + workarea.offsetHeight / 2) / zoom -
        canvas.contentH
    }
    canvas.pasteElements('point', x, y)
  }

  duplicate() {
    this._canvas?.cloneSelectedElements(20, 20)
  }

  deleteSelected() {
    const canvas = this._canvas
    if (!canvas) return
    if (canvas.getMode() === 'pathedit') {
      canvas.pathActions.deletePathNode()
    } else {
      canvas.deleteSelectedElements()
    }
  }

  group() {
    this._canvas?.groupSelectedElements()
  }

  ungroup() {
    this._canvas?.ungroupSelectedElement()
  }

  moveToTop() {
    this._canvas?.moveToTopSelectedElement()
  }

  moveToBottom() {
    this._canvas?.moveToBottomSelectedElement()
  }

  moveUp() {
    this._canvas?.moveUpDownSelected('Up')
  }

  moveDown() {
    this._canvas?.moveUpDownSelected('Down')
  }

  align(type: string, relativeTo = 'page') {
    this._canvas?.alignSelectedElements(type, relativeTo)
  }

  selectAll() {
    this._canvas?.selectAllInCurrentLayer()
  }

  moveSelected(dx: number, dy: number) {
    this._canvas?.moveSelectedElements(dx, dy)
  }

  get fillDisplay() {
    return displayColor(this.fill)
  }

  get strokeDisplay() {
    return displayColor(this.stroke)
  }
}

const store = new Store()

export default store
