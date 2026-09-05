import isErr from 'licia/isErr'

/** Structured-clone–safe deep plain object (strips MobX proxies). */
export function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function errorMessage(err: unknown, fallback: string): string {
  return isErr(err) ? err.message : fallback
}

export const BASE_WIDTH = 300
export const BASE_HEIGHT = 420

export function getPetWindowSize(scale: number) {
  return {
    width: Math.round(BASE_WIDTH * scale),
    height: Math.round(BASE_HEIGHT * scale),
  }
}
