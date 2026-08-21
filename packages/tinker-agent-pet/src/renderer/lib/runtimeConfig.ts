import clamp from 'licia/clamp'
import isObj from 'licia/isObj'
import LocalStore from 'licia/LocalStore'
import {
  DEFAULT_RUNTIME_CONFIG,
  type PetRuntimeConfig,
} from '../../common/types'

const storage = new LocalStore('tinker-agent-pet')
const STORAGE_RUNTIME = 'runtimeConfig'

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

function normalizeRuntimeConfig(value: unknown): PetRuntimeConfig {
  const config = isObj(value) ? (value as Record<string, unknown>) : {}
  const slug = config.activeSlug
  const activeSlug =
    typeof slug === 'string' && SLUG_RE.test(slug) ? slug : null
  const positionValue = isObj(config.position)
    ? (config.position as Record<string, unknown>)
    : null
  const position =
    positionValue &&
    Number.isFinite(positionValue.x) &&
    Number.isFinite(positionValue.y)
      ? {
          x: Math.round(Number(positionValue.x)),
          y: Math.round(Number(positionValue.y)),
        }
      : null
  const scale = Number(config.scale)
  const opacity = Number(config.opacity)
  return {
    activeSlug,
    enabled: config.enabled === true,
    scale: Number.isFinite(scale) ? clamp(scale, 0.4, 1.4) : 0.72,
    opacity: Number.isFinite(opacity) ? clamp(opacity, 0.2, 1) : 1,
    alwaysOnTop: config.alwaysOnTop !== false,
    soundEnabled: config.soundEnabled === true,
    returnToDefaultAnimation: config.returnToDefaultAnimation !== false,
    position,
  }
}

export function getRuntimeConfig(): PetRuntimeConfig {
  const saved = storage.get(STORAGE_RUNTIME)
  if (saved == null) return { ...DEFAULT_RUNTIME_CONFIG }
  return normalizeRuntimeConfig(saved)
}

export function saveRuntimeConfig(value: PetRuntimeConfig): PetRuntimeConfig {
  const config = normalizeRuntimeConfig(value)
  storage.set(STORAGE_RUNTIME, config)
  return config
}
