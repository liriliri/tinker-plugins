export const SLIDER_MIN = 0
export const SLIDER_MAX = 100

export function normalizeSlider(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * SLIDER_MAX
}

export function denormalizeSlider(value: number, min: number, max: number) {
  return min + (value / SLIDER_MAX) * (max - min)
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatHue(value: number) {
  return `${Math.round(value)}°`
}

export function formatCount(value: number) {
  return String(Math.round(value))
}
