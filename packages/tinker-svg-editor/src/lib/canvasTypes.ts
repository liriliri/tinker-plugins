import type SvgCanvasBase from '@svgedit/svgcanvas'

export type SvgCanvas = SvgCanvasBase & {
  updateCanvas: (w: number, h: number) => { x: number; y: number }
  getSelectedElements: () => Element[]
  setColor: (
    type: 'fill' | 'stroke',
    val: string,
    preventUndo?: boolean,
  ) => void
  getStrokeWidth: () => number | string
  setStrokeWidth: (val: number) => void
  setStrokeAttr: (attr: string, val: string) => void
  setPaintOpacity: (
    type: 'fill' | 'stroke',
    val: number,
    preventUndo?: boolean,
  ) => void
  /** Runtime may be null when copied from a missing SVG attribute. */
  getFillOpacity: () => number | string | null
  getStrokeOpacity: () => number | string | null
  getOpacity: () => number
  clear: () => void
  cloneSelectedElements: (x: number, y: number) => void
  alignSelectedElements: (type: string, relativeTo?: string) => void
  setRotationAngle: (angle: number, preventUndo?: boolean) => void
  setBold: (bold: boolean) => void
  setItalic: (italic: boolean) => void
  getBold: () => boolean
  getItalic: () => boolean
  getFontSize: () => number | string
  getFontFamily: () => string
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setTextContent: (text: string) => void
  selectAllInCurrentLayer: () => void
  getDocumentTitle: () => string
  setDocumentTitle: (title: string) => void
  getCurConfig: () => {
    dimensions: [number, number]
    canvas_expansion: number
    initFill: { color: string; opacity: number }
    initStroke: { width: number; color: string; opacity: number }
  }
  setBBoxZoom: (
    val:
      | string
      | {
          x: number
          y: number
          width: number
          height: number
          factor?: number
          zoom?: number
        },
    editorW: number,
    editorH: number,
  ) =>
    | {
        zoom: number
        bbox: { x: number; y: number; width: number; height: number }
      }
    | undefined
  contentW: number
  contentH: number
  spaceKey: boolean
  textActions: {
    setInputElem: (elem: HTMLInputElement | HTMLTextAreaElement) => void
    setFontSize?: (size: number) => void
    toSelectMode: (selectElem?: boolean | Element) => void
  }
  undoMgr: {
    undo: () => void
    redo: () => void
    getUndoStackSize: () => number
    getRedoStackSize: () => number
    resetUndoStack: () => void
  }
}
