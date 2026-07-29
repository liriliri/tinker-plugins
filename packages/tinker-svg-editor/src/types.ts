export type ToolMode =
  | 'select'
  | 'fhpath'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'path'
  | 'text'
  | 'zoom'
  | 'pan'

export type ColorTarget = 'fill' | 'stroke'

export type PanelKind = 'canvas' | 'rect' | 'text' | 'g' | 'element'

export interface SelectionInfo {
  elements: Element[]
  panel: PanelKind
  attrs: Record<string, string>
  fontSize: string
  isBold: boolean
  isItalic: boolean
}

export interface CanvasSize {
  width: number
  height: number
}
