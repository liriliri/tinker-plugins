import sleep from 'licia/sleep'
import { openPopupWindow } from './popupWindow'
import { getRuntimeConfig, saveRuntimeConfig } from './storage'
import { clonePlain, getPetWindowSize } from './util'
import PetWindow from '../components/PetWindow'
import type { InstalledPet, PetStorage } from '../../common/types'

let petWindow: Window | null = null
let activeSlug: string | null = null
let activeAlwaysOnTop: boolean | null = null
let onStorageChange: ((storage: PetStorage) => void) | null = null
/** Windows we closed ourselves (switch / disable) — skip unload side effects. */
const intentionalCloses = new WeakSet<Window>()

export function setStorageListener(
  handler: ((storage: PetStorage) => void) | null,
) {
  onStorageChange = handler
}

function hasLiveWindow() {
  return Boolean(petWindow && !petWindow.closed)
}

/** Use screen.avail* — window.outerWidth is 0 for background WebContentsView. */
function getDefaultPosition(size: { width: number; height: number }) {
  const screen = window.screen as Screen & {
    availLeft?: number
    availTop?: number
  }
  const left = screen.availLeft || 0
  const top = screen.availTop || 0
  return {
    x: Math.round(left + window.screen.availWidth - size.width - 48),
    y: Math.round(top + window.screen.availHeight - size.height - 48),
  }
}

function clearWindowRefs(closed: Window) {
  if (petWindow === closed || petWindow?.closed) {
    petWindow = null
    activeSlug = null
    activeAlwaysOnTop = null
  }
}

/** Persist position only — never clear enabled (app quit also fires beforeunload). */
function handlePetWindowUnload(closed: Window) {
  if (intentionalCloses.has(closed)) {
    intentionalCloses.delete(closed)
    clearWindowRefs(closed)
    return
  }

  if (!closed.closed) {
    const position = {
      x: Math.round(closed.screenX),
      y: Math.round(closed.screenY),
    }
    const storage = saveRuntimeConfig(
      clonePlain({ ...getRuntimeConfig(), position }),
    )
    onStorageChange?.(storage)
  }
  clearWindowRefs(closed)
}

function closePetWindow() {
  if (!hasLiveWindow() || !petWindow) {
    petWindow = null
    activeSlug = null
    activeAlwaysOnTop = null
    return
  }
  const closing = petWindow
  intentionalCloses.add(closing)
  closing.close()
  clearWindowRefs(closing)
}

async function openPetPopupWindow(
  size: { width: number; height: number },
  position: { x: number; y: number },
  alwaysOnTop: boolean,
): Promise<Window> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await sleep(80 * attempt)
    const created = openPopupWindow(
      {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
        alwaysOnTop,
        resizable: false,
        transparent: true,
      },
      (popup, onClose) => <PetWindow popup={popup} onClose={onClose} />,
    )
    if (created && !created.closed) return created
    lastError = new Error(
      'Failed to open pet window (window.open returned null)',
    )
  }
  throw lastError ?? new Error('Failed to open pet window')
}

function persistPositionIfNeeded(
  storage: PetStorage,
  position: { x: number; y: number },
): PetStorage {
  if (
    storage.position &&
    storage.position.x === position.x &&
    storage.position.y === position.y
  ) {
    return storage
  }
  const next = saveRuntimeConfig(clonePlain({ ...storage, position }))
  onStorageChange?.(next)
  return next
}

async function showPetWindow(
  pet: InstalledPet,
  storage: PetStorage,
): Promise<PetStorage> {
  const size = getPetWindowSize(storage.scale)

  if (
    hasLiveWindow() &&
    petWindow &&
    activeSlug === pet.slug &&
    activeAlwaysOnTop === storage.alwaysOnTop
  ) {
    const position = {
      x: Math.round(petWindow.screenX),
      y: Math.round(petWindow.screenY),
    }
    petWindow.resizeTo(size.width, size.height)
    return persistPositionIfNeeded(storage, position)
  }

  const position =
    hasLiveWindow() && petWindow
      ? { x: Math.round(petWindow.screenX), y: Math.round(petWindow.screenY) }
      : (storage.position ?? getDefaultPosition(size))

  closePetWindow()
  await sleep(150)

  const created = await openPetPopupWindow(size, position, storage.alwaysOnTop)

  created.addEventListener('beforeunload', () => {
    handlePetWindowUnload(created)
  })

  petWindow = created
  activeSlug = pet.slug
  activeAlwaysOnTop = storage.alwaysOnTop

  return persistPositionIfNeeded(storage, position)
}

export async function restorePetWindow() {
  const storage = getRuntimeConfig()
  if (!storage.enabled || !storage.activeSlug) return
  if (hasLiveWindow()) return
  const installedPets = await agentPet.listInstalledPets()
  const pet = installedPets.find((item) => item.slug === storage.activeSlug)
  if (!pet) {
    const cleared = saveRuntimeConfig(
      clonePlain({ ...storage, enabled: false, activeSlug: null }),
    )
    onStorageChange?.(cleared)
    closePetWindow()
    return
  }
  onStorageChange?.(storage)
  await showPetWindow(pet, storage)
}

export async function applyStorage(
  nextStorage: PetStorage,
  installedPets: InstalledPet[],
) {
  const storage = saveRuntimeConfig(clonePlain(nextStorage))
  onStorageChange?.(storage)
  if (!storage.enabled || !storage.activeSlug) {
    closePetWindow()
    return storage
  }
  const pet = installedPets.find((item) => item.slug === storage.activeSlug)
  if (!pet) throw new Error('Enabled pet is not installed')
  return showPetWindow(pet, storage)
}

export function disposePetWindowController() {
  onStorageChange = null
}
