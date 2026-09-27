import clamp from 'licia/clamp'
import isFinite from 'licia/isFinite'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import toNum from 'licia/toNum'
import { storage } from 'tinker-share/store/Base'
import { DEFAULT_STORAGE, isModelId, type PetStorage } from '../../common/types'

const STORAGE_KEY = 'runtimeConfig'

function normalizeStorage(value: unknown): PetStorage {
  const config = isObj(value) ? (value as Record<string, unknown>) : {}
  const rawId = config.activeId
  const activeId = isStr(rawId) && isModelId(rawId) ? rawId : null
  const positionValue = isObj(config.position)
    ? (config.position as Record<string, unknown>)
    : null
  const x = positionValue ? toNum(positionValue.x) : NaN
  const y = positionValue ? toNum(positionValue.y) : NaN
  const position =
    positionValue && isFinite(x) && isFinite(y)
      ? { x: Math.round(x), y: Math.round(y) }
      : null
  const scale = toNum(config.scale)
  const opacity = toNum(config.opacity)
  return {
    activeId,
    enabled: config.enabled === true,
    scale: isFinite(scale) ? clamp(scale, 0.4, 1.5) : DEFAULT_STORAGE.scale,
    opacity: isFinite(opacity)
      ? clamp(opacity, 0.2, 1)
      : DEFAULT_STORAGE.opacity,
    alwaysOnTop: config.alwaysOnTop !== false,
    position,
  }
}

export function getRuntimeConfig(): PetStorage {
  const saved = storage.get(STORAGE_KEY)
  if (saved == null) return { ...DEFAULT_STORAGE }
  return normalizeStorage(saved)
}

export function saveRuntimeConfig(value: PetStorage): PetStorage {
  const config = normalizeStorage(value)
  storage.set(STORAGE_KEY, config)
  return config
}
