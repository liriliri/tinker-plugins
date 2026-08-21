import { openPopupWindow } from './popupWindow'
import { getRuntimeConfig, saveRuntimeConfig } from './runtimeConfig'
import { clonePlain, getPetWindowSize } from './util'
import PetWindow from '../components/PetWindow'
import type { InstalledPet, PetRuntimeConfig } from '../../common/types'

let petWindow: Window | null = null
let activeSlug: string | null = null
let activeAlwaysOnTop: boolean | null = null
let onConfigChange: ((config: PetRuntimeConfig) => void) | null = null
/** Windows we closed ourselves (switch / disable) — skip unload side effects. */
const intentionalCloses = new WeakSet<Window>()

export function setRuntimeConfigListener(
  handler: ((config: PetRuntimeConfig) => void) | null,
) {
  onConfigChange = handler
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
    const config = saveRuntimeConfig(
      clonePlain({ ...getRuntimeConfig(), position }),
    )
    onConfigChange?.(config)
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

async function showPetWindow(
  pet: InstalledPet,
  config: PetRuntimeConfig,
): Promise<PetRuntimeConfig> {
  const size = getPetWindowSize(config.scale)
  const position =
    hasLiveWindow() && petWindow
      ? { x: Math.round(petWindow.screenX), y: Math.round(petWindow.screenY) }
      : (config.position ?? getDefaultPosition(size))

  if (
    hasLiveWindow() &&
    petWindow &&
    activeSlug === pet.slug &&
    activeAlwaysOnTop === config.alwaysOnTop
  ) {
    return config
  }

  closePetWindow()

  const created = openPopupWindow(
    {
      width: size.width,
      height: size.height,
      x: position.x,
      y: position.y,
      alwaysOnTop: config.alwaysOnTop,
      resizable: false,
      transparent: true,
    },
    (popup, onClose) => <PetWindow popup={popup} onClose={onClose} />,
  )

  if (!created) {
    throw new Error('Failed to open pet window (window.open returned null)')
  }

  created.addEventListener('beforeunload', () => {
    handlePetWindowUnload(created)
  })

  petWindow = created
  activeSlug = pet.slug
  activeAlwaysOnTop = config.alwaysOnTop

  if (
    config.position &&
    config.position.x === position.x &&
    config.position.y === position.y
  ) {
    return config
  }

  const next = saveRuntimeConfig(clonePlain({ ...config, position }))
  onConfigChange?.(next)
  return next
}

export async function restorePetWindow() {
  const config = getRuntimeConfig()
  if (!config.enabled || !config.activeSlug) return
  if (hasLiveWindow()) return
  const installedPets = await agentPet.listInstalledPets()
  const pet = installedPets.find((item) => item.slug === config.activeSlug)
  if (!pet) {
    const cleared = saveRuntimeConfig(
      clonePlain({ ...config, enabled: false, activeSlug: null }),
    )
    onConfigChange?.(cleared)
    closePetWindow()
    return
  }
  onConfigChange?.(config)
  await showPetWindow(pet, config)
}

export async function applyPetRuntimeConfig(
  nextConfig: PetRuntimeConfig,
  installedPets: InstalledPet[],
) {
  const config = saveRuntimeConfig(clonePlain(nextConfig))
  onConfigChange?.(config)
  if (!config.enabled || !config.activeSlug) {
    closePetWindow()
    return config
  }
  const pet = installedPets.find((item) => item.slug === config.activeSlug)
  if (!pet) throw new Error('Enabled pet is not installed')
  return showPetWindow(pet, config)
}

export function disposePetWindowController() {
  onConfigChange = null
}
