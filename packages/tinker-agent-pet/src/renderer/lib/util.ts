import type { CSSProperties } from 'react'
import fileSize from 'licia/fileSize'
import findIdx from 'licia/findIdx'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import trim from 'licia/trim'
import { defaultPetPreviewUrl } from '../../common/petAssets'
import type { PetDownloadProgress } from '../../common/types'
import { tw } from '../theme'

export function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function progressLabel(progress: PetDownloadProgress | undefined) {
  if (!progress) return '…'
  return progress.percent == null
    ? fileSize(progress.receivedBytes)
    : `${progress.percent}%`
}

export function getPetPreviewUrl(slug: string, previewUrl?: string) {
  return previewUrl || defaultPetPreviewUrl(slug)
}

export function petAccentStyle(color?: string): CSSProperties {
  return {
    ['--pet-accent' as string]: color || tw.brand.accent,
  }
}

/** Structured-clone–safe deep plain object (strips MobX proxies). */
export function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const FRAME_WIDTH = 192
export const FRAME_HEIGHT = 208

export function getPetWindowSize(scale: number) {
  return {
    width: Math.round(FRAME_WIDTH * scale),
    height: Math.round(FRAME_HEIGHT * scale),
  }
}

export const PET_ACTIONS = [
  { id: 'idle', row: 0, frames: 6, durationMs: 1100 },
  { id: 'waving', row: 3, frames: 4, durationMs: 700 },
  { id: 'jumping', row: 4, frames: 5, durationMs: 840 },
  { id: 'running', row: 7, frames: 6, durationMs: 820 },
  { id: 'review', row: 8, frames: 6, durationMs: 1030 },
  { id: 'waiting', row: 6, frames: 6, durationMs: 1010 },
] as const

export type PetActionId = (typeof PET_ACTIONS)[number]['id']

export const PET_ACTION_IDS: PetActionId[] = map(
  [...PET_ACTIONS],
  (action) => action.id,
)

export function findPetActionIndex(action: string): number {
  const id = lowerCase(trim(action))
  return findIdx(PET_ACTIONS, (item) => item.id === id)
}
