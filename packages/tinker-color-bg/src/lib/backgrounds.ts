import {
  AbstractShapeBg,
  AestheticFluidBg,
  AmbientLightBg,
  BigBlobBg,
  BlurDotBg,
  BlurGradientBg,
  ChaosWavesBg,
  CurveGradientBg,
  GridArrayBg,
  RandomCubesBg,
  SwirlingCurvesBg,
  TrianglesMosaicBg,
  WavyWavesBg,
  type ColorBg,
} from 'color4bg'
import each from 'licia/each'
import clone from 'licia/clone'
import keys from 'licia/keys'
import find from 'licia/find'
import noop from 'licia/noop'
import type { BgStyle, PaletteKey, RangeOption, BgConfig } from '../types'

import abstractShapeImg from '../assets/abstract-shape.jpg'
import aestheticFluidImg from '../assets/aesthetic-fluid.jpg'
import ambientLightImg from '../assets/ambient-light.jpg'
import bigBlobImg from '../assets/big-blob.jpg'
import blurDotImg from '../assets/blur-dot.jpg'
import blurGradientImg from '../assets/blur-gradient.jpg'
import chaosWavesImg from '../assets/chaos-waves.jpg'
import curveGradientImg from '../assets/curve-gradient.jpg'
import gridArrayImg from '../assets/grid-array.jpg'
import randomCubesImg from '../assets/random-cubes.jpg'
import swirlingCurvesImg from '../assets/swirling-curves.jpg'
import trianglesMosaicImg from '../assets/triangles-mosaic.jpg'
import wavyWavesImg from '../assets/wavy-waves.jpg'

type BgConstructor = new (params?: {
  dom?: string
  colors?: string[]
  seed?: number
  loop?: boolean
}) => ColorBg

export const BG_STYLES: {
  id: BgStyle
  preview: string
  palette: PaletteKey
}[] = [
  { id: 'abstract-shape', preview: abstractShapeImg, palette: 'blue' },
  { id: 'aesthetic-fluid', preview: aestheticFluidImg, palette: 'vivid' },
  { id: 'ambient-light', preview: ambientLightImg, palette: 'vivid' },
  { id: 'big-blob', preview: bigBlobImg, palette: 'pastel' },
  { id: 'blur-dot', preview: blurDotImg, palette: 'pastelglossy' },
  { id: 'blur-gradient', preview: blurGradientImg, palette: 'pastelglossy' },
  { id: 'chaos-waves', preview: chaosWavesImg, palette: 'pastel' },
  { id: 'curve-gradient', preview: curveGradientImg, palette: 'pastelglossy' },
  { id: 'grid-array', preview: gridArrayImg, palette: 'blue' },
  { id: 'random-cubes', preview: randomCubesImg, palette: 'pastelglossy' },
  {
    id: 'swirling-curves',
    preview: swirlingCurvesImg,
    palette: 'pastelglossy',
  },
  { id: 'triangles-mosaic', preview: trianglesMosaicImg, palette: 'pastel' },
  { id: 'wavy-waves', preview: wavyWavesImg, palette: 'pastelglossy' },
]

export const PALETTES: Record<PaletteKey, string[]> = {
  pastel: ['#D1ADFF', '#98D69B', '#FAE390', '#FFACD8', '#7DD5FF', '#D1ADFF'],
  pastelglossy: [
    '#FE8BFC',
    '#BD9FFB',
    '#8EDBFD',
    '#C4F5EF',
    '#E7F9FE',
    '#E9FFE0',
  ],
  vivid: ['#F00911', '#F3AA00', '#F6EE0B', '#39E90D', '#195ED2', '#F00911'],
  blue: ['#007FFE', '#3099FE', '#60B2FE', '#90CCFE', '#C0E5FE', '#F0FFFE'],
  black: ['#000000', '#3F3F3F', '#7F7F7F', '#DADADA', '#EAEAEA', '#F3F3F3'],
  blackVivid: [
    '#000000',
    '#F00911',
    '#F3AA00',
    '#F6EE0B',
    '#39E90D',
    '#195ED2',
  ],
}

export const PALETTE_KEYS = keys(PALETTES) as PaletteKey[]

const BG_CLASS_MAP: Record<BgStyle, BgConstructor> = {
  'abstract-shape': AbstractShapeBg,
  'aesthetic-fluid': AestheticFluidBg,
  'ambient-light': AmbientLightBg,
  'big-blob': BigBlobBg,
  'blur-dot': BlurDotBg,
  'blur-gradient': BlurGradientBg,
  'chaos-waves': ChaosWavesBg,
  'curve-gradient': CurveGradientBg,
  'grid-array': GridArrayBg,
  'random-cubes': RandomCubesBg,
  'swirling-curves': SwirlingCurvesBg,
  'triangles-mosaic': TrianglesMosaicBg,
  'wavy-waves': WavyWavesBg,
}

const STYLE_OPTIONS: Record<BgStyle, RangeOption[]> = {
  'abstract-shape': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
    { name: 'wavy', label: 'wavy', min: 0, max: 20, step: 1, value: 10 },
  ],
  'aesthetic-fluid': [
    {
      name: 'scale',
      label: 'scale',
      min: 0.01,
      max: 0.3,
      step: 0.01,
      value: 0.15,
    },
  ],
  'ambient-light': [
    { name: 'speed', label: 'speed', min: 1, max: 10, step: 1, value: 1 },
    {
      name: 'pattern scale',
      label: 'patternScale',
      min: 0,
      max: 1,
      step: 0.05,
      value: 1,
    },
    {
      name: 'edge blur',
      label: 'edgeBlur',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0,
    },
    {
      name: 'brightness',
      label: 'brightness',
      min: 0,
      max: 1.2,
      step: 0.01,
      value: 0.2,
    },
    {
      name: 'darkness',
      label: 'darkness',
      min: 0,
      max: 1,
      step: 0.01,
      value: 0,
    },
  ],
  'big-blob': [],
  'blur-dot': [],
  'blur-gradient': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
  ],
  'chaos-waves': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
    { name: 'speed', label: 'speed', min: 1, max: 20, step: 1, value: 1 },
  ],
  'curve-gradient': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
    { name: 'speed', label: 'speed', min: 1, max: 20, step: 1, value: 1 },
    { name: 'scale', label: 'scale', min: 0.01, max: 4, step: 0.01, value: 1 },
  ],
  'grid-array': [
    { name: 'scale', label: 'scale', min: 1, max: 200, step: 1, value: 100 },
    {
      name: 'u_w',
      label: 'unitWidth',
      min: 0.1,
      max: 0.99,
      step: 0.01,
      value: 0.8,
    },
    {
      name: 'u_h',
      label: 'unitHeight',
      min: 0.1,
      max: 0.99,
      step: 0.01,
      value: 0.8,
    },
    {
      name: 'amplitude',
      label: 'amplitude',
      min: 0,
      max: 5,
      step: 0.01,
      value: 0.5,
    },
    { name: 'radius', label: 'radius', min: 0, max: 1, step: 0.01, value: 0.1 },
    {
      name: 'borderwidth',
      label: 'borderWidth',
      min: 0.01,
      max: 0.1,
      step: 0.01,
      value: 0.01,
    },
    {
      name: 'rotateCanvas',
      label: 'rotateCanvas',
      min: 0,
      max: 360,
      step: 1,
      value: 0,
    },
    {
      name: 'rotateUnit',
      label: 'rotateUnit',
      min: 0,
      max: 360,
      step: 1,
      value: 0,
    },
    { name: 'speed', label: 'speed', min: 1, max: 10, step: 1, value: 5 },
  ],
  'random-cubes': [],
  'swirling-curves': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
    { name: 'speed', label: 'speed', min: 0.1, max: 5, step: 0.01, value: 0.1 },
    {
      name: 'density',
      label: 'density',
      min: 100,
      max: 2000,
      step: 100,
      value: 1500,
    },
    { name: 'scale', label: 'scale', min: 0.1, max: 50, step: 0.1, value: 8 },
  ],
  'triangles-mosaic': [
    { name: 'noise', label: 'noise', min: 0, max: 0.5, step: 0.01, value: 0.1 },
    { name: 'speed', label: 'speed', min: 1, max: 10, step: 1, value: 10 },
  ],
  'wavy-waves': [],
}

export function getStyleOptions(style: BgStyle): RangeOption[] {
  return STYLE_OPTIONS[style]
}

export function getDefaultOptions(style: BgStyle): Record<string, number> {
  const result: Record<string, number> = {}
  each(STYLE_OPTIONS[style], (opt) => {
    result[opt.name] = opt.value
  })
  return result
}

export function createBg(domId: string, config: BgConfig): ColorBg {
  const BgClass = BG_CLASS_MAP[config.style]
  const bg = new BgClass({
    dom: domId,
    colors: config.colors,
    seed: config.seed,
    loop: config.loop,
  })
  applyOptions(bg, config.options)
  return bg
}

export function applyOptions(bg: ColorBg, options: Record<string, number>) {
  each(options, (value, key) => {
    bg.update(key, value)
  })
}

export function destroyBg(bg: ColorBg | null) {
  if (!bg) return
  // ColorBg.destroy does not cancel its RAF loop
  ;(bg as ColorBg & { _update: () => void })._update = noop
  try {
    bg.destroy()
  } catch {
    // canvas may already be detached
  }
}

export function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let left = count
    const tick = () => {
      left -= 1
      if (left <= 0) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

export function styleLabelKey(style: BgStyle): string {
  return `style.${style}`
}

export function getStyleEntry(style: BgStyle) {
  return find(BG_STYLES, (item) => item.id === style) ?? BG_STYLES[0]
}

export function defaultPaletteForStyle(style: BgStyle): string[] {
  return clone(PALETTES[getStyleEntry(style).palette])
}
