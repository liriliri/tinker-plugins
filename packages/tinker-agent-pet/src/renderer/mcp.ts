import { PET_ACTION_IDS } from './lib/util'
import type { Store } from './store'

function parseLoop(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'play_action') {
      return getStore().playAction(String(args.action ?? ''), {
        loop: parseLoop(args.loop),
      })
    }
    if (name === 'list_actions') {
      const store = getStore()
      return {
        actions: PET_ACTION_IDS,
        enabled: store.runtimeConfig.enabled,
        activeSlug: store.runtimeConfig.activeSlug,
        activePet: store.activePet?.displayName ?? null,
      }
    }
    if (name === 'get_status') {
      const store = getStore()
      const pet = store.activePet
      return {
        enabled: store.runtimeConfig.enabled,
        activeSlug: store.runtimeConfig.activeSlug,
        activePet: pet
          ? {
              slug: pet.slug,
              displayName: pet.displayName,
              spriteVersionNumber: pet.spriteVersionNumber,
            }
          : null,
        scale: store.runtimeConfig.scale,
        opacity: store.runtimeConfig.opacity,
        alwaysOnTop: store.runtimeConfig.alwaysOnTop,
        soundEnabled: store.runtimeConfig.soundEnabled,
        returnToDefaultAnimation: store.runtimeConfig.returnToDefaultAnimation,
        pendingAction: store.actionRequest?.id ?? null,
        looping: store.actionRequest?.loop ?? false,
      }
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}
