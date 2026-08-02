export type BgStyle =
  | 'abstract-shape'
  | 'aesthetic-fluid'
  | 'ambient-light'
  | 'big-blob'
  | 'blur-dot'
  | 'blur-gradient'
  | 'chaos-waves'
  | 'curve-gradient'
  | 'grid-array'
  | 'random-cubes'
  | 'swirling-curves'
  | 'triangles-mosaic'
  | 'wavy-waves'

export type PaletteKey =
  'pastel' | 'pastelglossy' | 'vivid' | 'blue' | 'black' | 'blackVivid'

export interface RangeOption {
  name: string
  label: string
  min: number
  max: number
  step: number
  value: number
}

export interface BgConfig {
  style: BgStyle
  colors: string[]
  seed: number
  loop: boolean
  options: Record<string, number>
}
