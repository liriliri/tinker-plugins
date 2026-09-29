import type { CSSProperties } from 'react'
import type { Slide } from '../types'

export const slides: Slide[] = [
  { id: 'white', nameKey: 'slideWhite', kind: 'solid', color: '#ffffff' },
  { id: 'red', nameKey: 'slideRed', kind: 'solid', color: '#ff0000' },
  { id: 'green', nameKey: 'slideGreen', kind: 'solid', color: '#00ff00' },
  { id: 'blue', nameKey: 'slideBlue', kind: 'solid', color: '#0000ff' },
  { id: 'black', nameKey: 'slideBlack', kind: 'solid', color: '#000000' },
  {
    id: 'lightBleed',
    nameKey: 'slideLightBleed',
    kind: 'css',
    background:
      'radial-gradient(circle at center, #ffffff 0%, #808080 45%, #000000 100%)',
  },
  {
    id: 'grayRamp',
    nameKey: 'slideGrayRamp',
    kind: 'css',
    background: 'linear-gradient(to right, #000000, #ffffff)',
  },
  {
    id: 'checkerboard',
    nameKey: 'slideCheckerboard',
    kind: 'css',
    background:
      'repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%) 0 0 / 40px 40px',
  },
]

export function slideStyle(slide: Slide): CSSProperties {
  if (slide.kind === 'solid') {
    return { background: slide.color }
  }
  return { background: slide.background }
}

export function slideThumbStyle(slide: Slide): CSSProperties {
  if (slide.id === 'checkerboard') {
    return {
      background:
        'repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%) 0 0 / 6px 6px',
    }
  }
  return slideStyle(slide)
}
