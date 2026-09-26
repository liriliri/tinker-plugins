import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import isNum from 'licia/isNum'
import every from 'licia/every'
import clamp from 'licia/clamp'
import Color from 'licia/Color'
import rgbToHsl from 'licia/rgbToHsl'
import isObj from 'licia/isObj'
import cloneDeep from 'licia/cloneDeep'
import {
  DEFAULT_LIGHTING,
  type CameraView,
  type LightingOptions,
} from '../types'

export function isHexColor(value: unknown): value is string {
  return isStr(value) && /^#[0-9a-fA-F]{6}$/.test(value)
}

export function readLightTint(
  saved: Partial<LightingOptions> & { color?: string },
) {
  if (isNum(saved.hue) && isNum(saved.saturation)) {
    return {
      hue: clamp(saved.hue, 0, 1),
      saturation: clamp(saved.saturation, 0, 1),
    }
  }
  if (isHexColor(saved.color)) {
    const parsed = Color.parse(saved.color)
    const rgb = parsed.model === 'rgb' ? parsed.val : [244, 249, 255]
    const hsl = rgbToHsl(rgb.slice(0, 3))
    return { hue: hsl[0] / 360, saturation: hsl[1] / 100 }
  }
  return {
    hue: DEFAULT_LIGHTING.hue,
    saturation: DEFAULT_LIGHTING.saturation,
  }
}

export function isVec3(value: unknown): value is [number, number, number] {
  return isArr(value) && value.length === 3 && every(value, isNum)
}

export function cloneView(view: CameraView): CameraView {
  return cloneDeep(view)
}

export function readView(value: unknown): CameraView | null {
  if (!isObj(value)) return null
  const view = value as Partial<CameraView>
  if (!isVec3(view.position) || !isVec3(view.target)) return null
  return cloneView(view as CameraView)
}
