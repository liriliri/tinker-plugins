import clamp from 'licia/clamp'
import isFinite from 'licia/isFinite'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import LocalStore from 'licia/LocalStore'
import toNum from 'licia/toNum'
import { DEFAULT_STORAGE, type PetStorage } from '../../common/types'

const localStore = new LocalStore('tinker-agent-pet')
const STORAGE_KEY = 'runtimeConfig'

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

function normalizeStorage(value: unknown): PetStorage {
  const config = isObj(value) ? (value as Record<string, unknown>) : {}
  const slug = config.activeSlug
  const activeSlug = isStr(slug) && SLUG_RE.test(slug) ? slug : null
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
    activeSlug,
    enabled: config.enabled === true,
    scale: isFinite(scale) ? clamp(scale, 0.4, 1.4) : 0.72,
    opacity: isFinite(opacity) ? clamp(opacity, 0.2, 1) : 1,
    alwaysOnTop: config.alwaysOnTop !== false,
    soundEnabled: config.soundEnabled === true,
    returnToDefaultAnimation: config.returnToDefaultAnimation !== false,
    position,
  }
}

export function getRuntimeConfig(): PetStorage {
  const saved = localStore.get(STORAGE_KEY)
  if (saved == null) return { ...DEFAULT_STORAGE }
  return normalizeStorage(saved)
}

export function saveRuntimeConfig(value: PetStorage): PetStorage {
  const config = normalizeStorage(value)
  localStore.set(STORAGE_KEY, config)
  return config
}
