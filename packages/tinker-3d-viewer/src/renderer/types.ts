import clay from './assets/matcaps/clay.png'
import gold from './assets/matcaps/gold.png'
import graphite from './assets/matcaps/graphite.png'
import jade from './assets/matcaps/jade.png'
import metal from './assets/matcaps/metal.png'
import porcelain from './assets/matcaps/porcelain.png'

export type LoadStatus = 'idle' | 'loading' | 'ready'

export type ViewMode = 'orbit' | 'firstPerson'

export type DisplayMode =
  | 'shaded'
  | 'matcap'
  | 'matcapWireframe'
  | 'wireframe'
  | 'shadedWireframe'
  | 'skeleton'

export const MATCAP_PRESETS = [
  { id: 'porcelain', url: porcelain },
  { id: 'clay', url: clay },
  { id: 'metal', url: metal },
  { id: 'gold', url: gold },
  { id: 'jade', url: jade },
  { id: 'graphite', url: graphite },
] as const

export type MatcapPresetId = (typeof MATCAP_PRESETS)[number]['id']
export const DEFAULT_MATCAP_PRESET: MatcapPresetId = 'porcelain'

export const WIREFRAME_COLOR_PRESETS = [
  '#D1D5DB',
  '#FFFFFF',
  '#38BDF8',
  '#4ADE80',
  '#FBBF24',
  '#F472B6',
] as const

export const DEFAULT_WIREFRAME_COLOR = WIREFRAME_COLOR_PRESETS[0]

export interface ModelInfo {
  fileName: string
  sourceFormat: string
  byteLength: number
}
