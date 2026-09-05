import clamp from 'licia/clamp'
import isFinite from 'licia/isFinite'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import { DEFAULT_STORAGE, isModelId, type PetStorage } from '../../common/types'

const localStore = new LocalStore('tinker-live2d')
const STORAGE_KEY = 'storage'
/** Legacy key from earlier builds */
const LEGACY_STORAGE_KEY = 'runtimeConfig'

function normalizeStorage(value: unknown): PetStorage {
  const config = isObj(value) ? (value as Record<string, unknown>) : {}
  const rawId = config.activeId ?? config.activeSlug
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
    scale: isFinite(scale) ? clamp(scale, 0.4, 1.5) : 0.85,
    opacity: isFinite(opacity) ? clamp(opacity, 0.2, 1) : 1,
    alwaysOnTop: config.alwaysOnTop !== false,
    position,
  }
}

export function getStorage(): PetStorage {
  const saved =
    localStore.get(STORAGE_KEY) ?? localStore.get(LEGACY_STORAGE_KEY)
  if (saved == null) return { ...DEFAULT_STORAGE }
  return normalizeStorage(saved)
}

export function saveStorage(value: PetStorage): PetStorage {
  const config = normalizeStorage(value)
  localStore.set(STORAGE_KEY, config)
  return config
}
