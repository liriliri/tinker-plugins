import find from 'licia/find'
import sleep from 'licia/sleep'
import { openPopupWindow } from './popupWindow'
import { getStorage, saveStorage } from './storage'
import { clonePlain, getPetWindowSize } from './util'
import PetWindow from '../components/PetWindow'
import type { InstalledModel, PetStorage } from '../../common/types'

let petWindow: Window | null = null
let activeAlwaysOnTop: boolean | null = null
let onStorageChange: ((storage: PetStorage) => void) | null = null
const intentionalCloses = new WeakSet<Window>()

export function setStorageListener(
  handler: ((storage: PetStorage) => void) | null,
) {
  onStorageChange = handler
}

function hasLiveWindow() {
  return Boolean(petWindow && !petWindow.closed)
}

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
    activeAlwaysOnTop = null
  }
}

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
    const storage = saveStorage(clonePlain({ ...getStorage(), position }))
    onStorageChange?.(storage)
  }
  clearWindowRefs(closed)
}

function closePetWindow() {
  if (!hasLiveWindow() || !petWindow) {
    petWindow = null
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
  const next = saveStorage(clonePlain({ ...storage, position }))
  onStorageChange?.(next)
  return next
}

async function showPetWindow(storage: PetStorage): Promise<PetStorage> {
  const size = getPetWindowSize(storage.scale)

  if (
    hasLiveWindow() &&
    petWindow &&
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
  activeAlwaysOnTop = storage.alwaysOnTop

  return persistPositionIfNeeded(storage, position)
}

export async function restorePetWindow() {
  const storage = getStorage()
  if (!storage.enabled || !storage.activeId) return
  if (hasLiveWindow()) return
  const models = await live2d.listModels()
  const model = find(models, (item) => item.id === storage.activeId)
  if (!model) {
    const cleared = saveStorage(
      clonePlain({ ...storage, enabled: false, activeId: null }),
    )
    onStorageChange?.(cleared)
    closePetWindow()
    return
  }
  onStorageChange?.(storage)
  await showPetWindow(storage)
}

export async function applyStorage(
  nextStorage: PetStorage,
  models: InstalledModel[],
) {
  const storage = saveStorage(clonePlain(nextStorage))
  onStorageChange?.(storage)
  if (!storage.enabled || !storage.activeId) {
    closePetWindow()
    return storage
  }
  const model = find(models, (item) => item.id === storage.activeId)
  if (!model) throw new Error('Enabled model is not installed')
  return showPetWindow(storage)
}

export function disposePetWindowController() {
  onStorageChange = null
}
