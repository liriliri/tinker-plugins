import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'
import debounce from 'licia/debounce'
import extend from 'licia/extend'
import filter from 'licia/filter'
import find from 'licia/find'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import keys from 'licia/keys'
import map from 'licia/map'
import naturalSort from 'licia/naturalSort'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import {
  AGENTS,
  HOOK_TYPES,
  buildPetHookCommand,
  defaultActions,
  defaultEnabled,
  resolveFormat,
  type HooksFormat,
  type HookTypeDef,
} from './lib/agentHooks'
import type { AgentDef, AgentSettings, HookEventId } from './types'
import type { PetActionId } from './lib/util'
import {
  applyStorage,
  disposePetWindowController,
  restorePetWindow,
  setStorageListener,
} from './lib/petWindow'
import { getRuntimeConfig, saveRuntimeConfig } from './lib/storage'
import { clonePlain, PET_ACTION_IDS, findPetActionIndex } from './lib/util'
import { createMcpApi } from './mcp'
import {
  DEFAULT_STORAGE,
  type InstalledPet,
  type PetDownloadProgress,
  type PetOverlay,
  type PetStorage,
  type PetSearchItem,
} from '../common/types'

function failMessage(error: unknown, fallbackKey: string) {
  return isErr(error) ? errorMessage(error) : t(fallbackKey)
}

async function readAgentSettings(path: string): Promise<AgentSettings> {
  try {
    const content = await tinker.readFile(path, 'utf-8')
    return JSON.parse(content as string)
  } catch {
    return {}
  }
}

function stripPetHooks(
  settings: AgentSettings,
  hookDefs: HookTypeDef[],
  format: HooksFormat,
) {
  if (!settings.hooks) return

  for (const hookDef of hookDefs) {
    const eventName = format.getEventName(hookDef)
    const entries = settings.hooks[eventName]
    if (!entries || !isArr(entries)) continue

    // Strip only our previous pet hooks; keep sound / custom hooks.
    settings.hooks[eventName] = format.filterEntries(entries, hookDef)

    if (settings.hooks[eventName]!.length === 0) {
      delete settings.hooks[eventName]
    }
  }

  if (isEmpty(settings.hooks)) delete settings.hooks
}

class AgentHookStore {
  agent: AgentDef
  settingsPath = ''
  actions: Record<HookEventId, PetActionId> = defaultActions()
  enabledHooks: Record<HookEventId, boolean> = defaultEnabled()
  isConfigured = false
  saving = false
  message = ''

  constructor(agent: AgentDef) {
    this.agent = agent
    makeAutoObservable(this)
  }

  get hooksFormat() {
    return resolveFormat(this.agent.format)
  }

  get enabledHookTypes() {
    return this.hooksFormat.filterHookTypes(HOOK_TYPES)
  }

  async init(home: string) {
    const configFile = this.agent.configFile || 'settings.json'
    this.settingsPath = `${home}/${this.agent.configDir}/${configFile}`
    await this.loadCurrentConfig()
  }

  async loadCurrentConfig() {
    try {
      const content = await tinker.readFile(this.settingsPath, 'utf-8')
      const settings: AgentSettings = JSON.parse(content as string)
      let found = false

      for (const hookDef of HOOK_TYPES) {
        const eventName = this.hooksFormat.getEventName(hookDef)
        const entries = settings.hooks?.[eventName]
        if (!entries || !isArr(entries)) continue
        const action = this.hooksFormat.detectAction(entries, hookDef)
        if (action) {
          found = true
          runInAction(() => {
            this.enabledHooks[hookDef.id] = true
            this.actions[hookDef.id] = action
          })
        }
      }

      if (found) {
        runInAction(() => {
          this.isConfigured = true
        })
      }
    } catch {
      // settings.json not found or invalid
    }
  }

  toggleHook(hookType: HookEventId) {
    this.enabledHooks[hookType] = !this.enabledHooks[hookType]
    this.message = ''
  }

  setAction(hookType: HookEventId, action: PetActionId) {
    this.actions[hookType] = action
    this.message = ''
  }

  async applyConfig() {
    this.saving = true
    this.message = ''

    try {
      const settings = await readAgentSettings(this.settingsPath)
      if (!settings.hooks) settings.hooks = {}
      extend(settings, this.hooksFormat.initialSettings())

      stripPetHooks(settings, this.enabledHookTypes, this.hooksFormat)

      for (const hookDef of this.enabledHookTypes) {
        if (!this.enabledHooks[hookDef.id]) continue

        const eventName = this.hooksFormat.getEventName(hookDef)
        if (!settings.hooks) settings.hooks = {}
        if (!settings.hooks[eventName]) settings.hooks[eventName] = []

        settings.hooks[eventName].push(
          this.hooksFormat.buildEntry(
            buildPetHookCommand(this.actions[hookDef.id]),
            hookDef,
          ),
        )
      }

      if (settings.hooks && isEmpty(settings.hooks)) delete settings.hooks

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = true
        this.message = t('hooksApplySuccess')
      })
    } catch (err) {
      runInAction(() => {
        this.message = t('hooksApplyFailed')
      })
      console.error('Failed to write agent hooks:', err)
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async removeConfig() {
    this.saving = true
    this.message = ''

    try {
      const settings = await readAgentSettings(this.settingsPath)
      stripPetHooks(settings, HOOK_TYPES, this.hooksFormat)

      if (!settings.hooks) {
        for (const key of keys(this.hooksFormat.initialSettings())) {
          delete (settings as Record<string, unknown>)[key]
        }
      }

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = false
        this.message = t('hooksRemoveSuccess')
      })
    } catch (err) {
      runInAction(() => {
        this.message = t('hooksRemoveFailed')
      })
      console.error('Failed to remove agent hooks:', err)
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }
}

export class Store extends BaseStore {
  overlay: PetOverlay | null = null
  pets: PetSearchItem[] = []
  installedPets: InstalledPet[] = []
  storage: PetStorage = { ...DEFAULT_STORAGE }
  query = ''
  sort = 'installed'
  kind = ''
  nextCursor: number | null = 0
  loading = false
  loadingMore = false
  errorMessage = ''
  installingSlugs = new Set<string>()
  downloadProgress = new Map<string, PetDownloadProgress>()
  detailPet: PetSearchItem | null = null
  requestSequence = 0
  toastOpen = false
  toastMsg = ''
  /** Bumped request so the floating pet window can play a named action. */
  actionRequest: { id: string; token: number; loop: boolean } | null = null

  selectedAgentId = AGENTS[0]!.id
  agentHookStores: Map<string, AgentHookStore> = new Map()
  visibleAgentIds: Set<string> = new Set(map(AGENTS, (a) => a.id))

  private runSearch = debounce(() => {
    void this.loadPets(false)
  }, 320)

  constructor() {
    super()
    makeAutoObservable(this, {}, { autoBind: true })
    void tinker.setBackgroundThrottling(false)
    createMcpApi(() => this)
    for (const agent of AGENTS) {
      this.agentHookStores.set(agent.id, new AgentHookStore(agent))
    }
  }

  get visibleAgents(): AgentDef[] {
    return filter(AGENTS, (a) => this.visibleAgentIds.has(a.id)).sort((a, b) =>
      naturalSort.comparator(a.name, b.name),
    )
  }

  get selectedAgentHookStore(): AgentHookStore {
    return this.agentHookStores.get(this.selectedAgentId)!
  }

  setSelectedAgent(id: string) {
    this.selectedAgentId = id
  }

  get installedSlugSet() {
    return new Set(map(this.installedPets, (pet) => pet.slug))
  }

  get activePet() {
    return find(
      this.installedPets,
      (pet) => pet.slug === this.storage.activeSlug,
    )
  }

  setOverlay(overlay: PetOverlay | null) {
    this.overlay = overlay
  }

  setQuery(query: string) {
    this.query = query
    this.scheduleSearch()
  }

  setSort(sort: string) {
    this.sort = sort
    void this.loadPets(false)
  }

  setKind(kind: string) {
    this.kind = kind
    void this.loadPets(false)
  }

  setDetailPet(pet: PetSearchItem | null) {
    this.detailPet = pet
  }

  patchStorage(partial: Partial<PetStorage>) {
    this.storage = { ...this.storage, ...partial }
  }

  setErrorMessage(message: string) {
    this.errorMessage = message
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  scheduleSearch() {
    this.runSearch()
  }

  async refreshLocalState() {
    const installed = await agentPet.listInstalledPets()
    runInAction(() => {
      this.installedPets = installed
      this.storage = getRuntimeConfig()
    })
  }

  async loadPets(append = false) {
    if (
      append &&
      (this.loading || this.loadingMore || this.nextCursor === null)
    )
      return
    const sequence = ++this.requestSequence
    runInAction(() => {
      if (append) this.loadingMore = true
      else this.loading = true
      this.errorMessage = ''
    })
    try {
      const response = await agentPet.searchPets({
        query: this.query,
        sort: this.sort,
        kinds: this.kind ? [this.kind] : [],
        cursor: append ? (this.nextCursor ?? 0) : 0,
        limit: 24,
      })
      if (sequence !== this.requestSequence) return
      runInAction(() => {
        this.pets = append ? [...this.pets, ...response.pets] : response.pets
        this.nextCursor = response.nextCursor
      })
    } catch (error) {
      if (sequence !== this.requestSequence) return
      runInAction(() => {
        this.errorMessage = failMessage(error, 'loadPetsFailed')
      })
    } finally {
      if (sequence === this.requestSequence) {
        runInAction(() => {
          this.loading = false
          this.loadingMore = false
        })
      }
    }
  }

  updateDownloadProgress(slug: string, progress: PetDownloadProgress) {
    const next = new Map(this.downloadProgress)
    next.set(slug, progress)
    this.downloadProgress = next
  }

  async installPet(pet: PetSearchItem) {
    const nextInstalling = new Set(this.installingSlugs)
    nextInstalling.add(pet.slug)
    this.installingSlugs = nextInstalling
    this.updateDownloadProgress(pet.slug, {
      receivedBytes: 0,
      totalBytes: null,
      percent: null,
    })
    this.errorMessage = ''
    try {
      await agentPet.installPet(clonePlain(pet), (progress) => {
        runInAction(() => this.updateDownloadProgress(pet.slug, progress))
      })
      await this.refreshLocalState()
    } catch (error) {
      runInAction(() => {
        this.errorMessage = failMessage(error, 'downloadFailed')
      })
      this.showError(this.errorMessage)
    } finally {
      runInAction(() => {
        const completed = new Set(this.installingSlugs)
        completed.delete(pet.slug)
        this.installingSlugs = completed
        const completedProgress = new Map(this.downloadProgress)
        completedProgress.delete(pet.slug)
        this.downloadProgress = completedProgress
      })
    }
  }

  async enablePet(slug: string) {
    try {
      const pet = find(this.installedPets, (item) => item.slug === slug)
      const config = clonePlain(this.storage)
      this.storage = await applyStorage(
        {
          ...config,
          activeSlug: slug,
          enabled: true,
          soundEnabled: Boolean(pet?.soundUrl) && config.soundEnabled,
        },
        this.installedPets,
      )
      this.detailPet = null
    } catch (error) {
      this.showError(failMessage(error, 'enablePetFailed'))
    }
  }

  async disablePet() {
    const config = clonePlain(this.storage)
    this.storage = await applyStorage(
      { ...config, enabled: false },
      this.installedPets,
    )
  }

  playAction(action: string, options: { loop?: boolean } = {}) {
    if (!this.storage.enabled || !this.activePet) {
      throw new Error(t('noPetEnabled'))
    }
    const index = findPetActionIndex(action)
    if (index < 0) {
      throw new Error(
        t('unknownAction', {
          action,
          available: PET_ACTION_IDS.join(', '),
        }),
      )
    }
    const id = PET_ACTION_IDS[index]!
    // idle already loops as the default pose; treat loop as no-op there.
    const loop = id !== 'idle' && Boolean(options.loop)
    this.actionRequest = { id, token: Date.now(), loop }
    return {
      action: id,
      loop,
      slug: this.activePet.slug,
      displayName: this.activePet.displayName,
    }
  }

  async uninstallPet(slug: string) {
    if (this.storage.activeSlug === slug) await this.disablePet()
    await agentPet.uninstallPet(slug)
    if (this.storage.activeSlug === slug) {
      this.storage = saveRuntimeConfig(
        clonePlain({
          ...this.storage,
          activeSlug: null,
          enabled: false,
        }),
      )
    }
    await this.refreshLocalState()
  }

  async saveSettings(partial?: Partial<PetStorage>) {
    try {
      this.storage = await applyStorage(
        { ...clonePlain(this.storage), ...partial },
        this.installedPets,
      )
    } catch (error) {
      this.showError(failMessage(error, 'saveSettingsFailed'))
    }
  }

  async init() {
    setStorageListener((storage) => {
      runInAction(() => {
        this.storage = storage
      })
    })
    await this.refreshLocalState()
    try {
      await restorePetWindow()
    } catch (error) {
      console.error('[tinker-agent-pet] restore failed', error)
    }
    void Promise.all([this.loadPets(false), this.initAgentHooks()])
  }

  async initAgentHooks() {
    const home = await tinker.getPath('home')
    for (const agent of AGENTS) {
      if (agent.requireDir) {
        try {
          const stat = await tinker.fstat(`${home}/${agent.configDir}`)
          if (!stat.isDirectory) throw new Error()
        } catch {
          runInAction(() => {
            this.visibleAgentIds.delete(agent.id)
          })
          continue
        }
      }
      await this.agentHookStores.get(agent.id)?.init(home)
    }
    if (!this.visibleAgentIds.has(this.selectedAgentId)) {
      const first = this.visibleAgents[0]
      if (first) this.selectedAgentId = first.id
    }
  }

  dispose() {
    disposePetWindowController()
  }
}

const store = new Store()
export default store
