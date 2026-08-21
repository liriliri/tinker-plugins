import fileSize from 'licia/fileSize'
import findIdx from 'licia/findIdx'
import map from 'licia/map'
import type { PetDownloadProgress } from '../../common/types'
import type { PetActionId } from '../types'

const TRUSTED_ASSET_HOST = 'assets.petdex.dev'

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
  return previewUrl || `https://${TRUSTED_ASSET_HOST}/pets/${slug}/preview.webp`
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

type PetAction = {
  id: PetActionId
  row: number
  frames: number
  durationMs: number
}

export const PET_ACTIONS: PetAction[] = [
  { id: 'idle', row: 0, frames: 6, durationMs: 1100 },
  { id: 'waving', row: 3, frames: 4, durationMs: 700 },
  { id: 'jumping', row: 4, frames: 5, durationMs: 840 },
  { id: 'running', row: 7, frames: 6, durationMs: 820 },
  { id: 'review', row: 8, frames: 6, durationMs: 1030 },
  { id: 'waiting', row: 6, frames: 6, durationMs: 1010 },
]

export const PET_ACTION_IDS = map(PET_ACTIONS, (action) => action.id)

export function findPetActionIndex(action: string): number {
  const id = action.trim().toLowerCase()
  return findIdx(PET_ACTIONS, (item) => item.id === id)
}
