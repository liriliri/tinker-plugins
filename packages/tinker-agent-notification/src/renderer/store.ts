import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'
import endWith from 'licia/endWith'
import extend from 'licia/extend'
import filter from 'licia/filter'
import find from 'licia/find'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import isWindows from 'licia/isWindows'
import keys from 'licia/keys'
import map from 'licia/map'
import naturalSort from 'licia/naturalSort'
import some from 'licia/some'
import BaseStore from 'tinker-share/store/Base'
import type { HooksFormat } from './lib/hooksFormat'
import { resolveFormat } from './lib/hooksFormat'
import type { HookType, HookTypeDef, Settings } from './types'

interface AgentDef {
  id: string
  name: string
  configDir: string
  configFile?: string
  requireDir?: boolean
  format?: 'default' | 'cursor'
}

export const soundPackIds = [
  'default',
  'young-girl',
  'elegant-lady',
  'gentle-lord',
  'graceful-beauty',
] as const

const agents: AgentDef[] = [
  { id: 'codebuddy', name: 'CodeBuddy', configDir: '.codebuddy' },
  {
    id: 'tclaude',
    name: 'TClaude',
    configDir: '.tclaude',
    requireDir: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    configDir: '.claude',
  },
  {
    id: 'codex',
    name: 'Codex',
    configDir: '.codex',
    configFile: 'hooks.json',
  },
  {
    id: 'tcodex',
    name: 'TCodex',
    configDir: '.tcodex',
    configFile: 'hooks.json',
    requireDir: true,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    configDir: '.cursor',
    configFile: 'hooks.json',
    format: 'cursor',
  },
]

const hookTypes: HookTypeDef[] = [
  {
    id: 'ready',
    file: 'ready.mp3',
    event: 'SessionStart',
    cursorEvent: 'sessionStart',
  },
  {
    id: 'work',
    file: 'work.mp3',
    event: 'UserPromptSubmit',
    cursorEvent: 'beforeSubmitPrompt',
  },
  { id: 'stop', file: 'stop.mp3', event: 'Stop', cursorEvent: 'stop' },
  {
    id: 'permission',
    file: 'permission.mp3',
    event: 'Notification',
    matcher: 'permission_prompt',
  },
]

function buildPlayCommand(soundPath: string): string {
  if (isWindows) {
    return `powershell -ExecutionPolicy Bypass -File "${store.playScript}" "${soundPath}"`
  }
  return `afplay "${soundPath}"`
}

async function readSettings(path: string): Promise<Settings> {
  try {
    const content = await tinker.readFile(path, 'utf-8')
    return JSON.parse(content as string)
  } catch {
    return {}
  }
}

function stripSoundHooks(
  settings: Settings,
  hookDefs: HookTypeDef[],
  format: HooksFormat,
) {
  if (!settings.hooks) return

  for (const hookDef of hookDefs) {
    const eventName = format.getEventName(hookDef)
    if (!settings.hooks[eventName] || !isArr(settings.hooks[eventName])) {
      continue
    }

    settings.hooks[eventName] = format.filterEntries(
      settings.hooks[eventName],
      hookDef,
    )

    if (settings.hooks[eventName].length === 0) {
      delete settings.hooks[eventName]
    }
  }

  if (isEmpty(settings.hooks)) {
    delete settings.hooks
  }
}

class AgentStore {
  agent: AgentDef
  settingsPath: string = ''
  selectedPack: string = 'default'
  customSoundPaths: Record<HookType, string> = {
    ready: '',
    work: '',
    stop: '',
    permission: '',
  }
  enabledHooks: Record<HookType, boolean> = {
    ready: true,
    work: true,
    stop: true,
    permission: true,
  }
  isConfigured: boolean = false
  saving: boolean = false

  constructor(agent: AgentDef) {
    this.agent = agent
    makeAutoObservable(this)
  }

  async init(home: string) {
    const configFile = this.agent.configFile || 'settings.json'
    this.settingsPath = `${home}/${this.agent.configDir}/${configFile}`
    await this.loadCurrentConfig()
  }

  get hooksFormat(): HooksFormat {
    return resolveFormat(this.agent.format)
  }

  get enabledHookTypes(): HookTypeDef[] {
    return this.hooksFormat.filterHookTypes(hookTypes)
  }

  getSoundAbsolutePath(hookType: HookType): string {
    if (this.selectedPack === 'custom') {
      return this.customSoundPaths[hookType]
    }
    const hookDef = find(hookTypes, (h) => h.id === hookType)!
    return `${store.soundsDir}/${this.selectedPack}/${hookDef.file}`
  }

  get canApply(): boolean {
    if (this.selectedPack === 'custom') {
      const hookTypesToCheck = this.enabledHookTypes
      if (!some(hookTypesToCheck, (h) => this.enabledHooks[h.id])) return false
      return !some(
        hookTypesToCheck,
        (h) => this.enabledHooks[h.id] && !this.customSoundPaths[h.id],
      )
    }
    return true
  }

  async loadCurrentConfig() {
    try {
      const content = await tinker.readFile(this.settingsPath, 'utf-8')
      const settings: Settings = JSON.parse(content as string)
      let found = false

      for (const hookDef of hookTypes) {
        const eventName = this.hooksFormat.getEventName(hookDef)
        const entries = settings?.hooks?.[eventName]
        if (!entries || !isArr(entries)) continue

        const soundPath = this.hooksFormat.detectSound(entries, hookDef)
        if (soundPath) {
          found = true
          runInAction(() => {
            this.enabledHooks[hookDef.id] = true
            const packId = find(soundPackIds, (id) =>
              endWith(soundPath, `/${id}/${hookDef.file}`),
            )
            if (packId) {
              this.selectedPack = packId
            } else {
              this.selectedPack = 'custom'
              this.customSoundPaths[hookDef.id] = soundPath
            }
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

  async selectCustomSound(hookType: HookType) {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: t('audioFiles'),
          extensions: ['mp3', 'wav', 'aiff', 'aac', 'ogg', 'm4a', 'flac'],
        },
      ],
    })

    if (!result.canceled && result.filePaths.length > 0) {
      runInAction(() => {
        this.customSoundPaths[hookType] = result.filePaths[0]
        this.selectedPack = 'custom'
      })
    }
  }

  setSelectedPack(id: string) {
    this.selectedPack = id
  }

  toggleHook(hookType: HookType) {
    this.enabledHooks[hookType] = !this.enabledHooks[hookType]
  }

  async applyConfig(): Promise<boolean> {
    this.saving = true

    try {
      const settings = await readSettings(this.settingsPath)
      if (!settings.hooks) settings.hooks = {}
      extend(settings, this.hooksFormat.initialSettings())

      stripSoundHooks(settings, this.enabledHookTypes, this.hooksFormat)

      for (const hookDef of this.enabledHookTypes) {
        if (!this.enabledHooks[hookDef.id]) continue

        const soundPath = this.getSoundAbsolutePath(hookDef.id)
        if (!soundPath) continue

        const eventName = this.hooksFormat.getEventName(hookDef)
        if (!settings.hooks) settings.hooks = {}
        if (!settings.hooks[eventName]) settings.hooks[eventName] = []

        settings.hooks[eventName].push(
          this.hooksFormat.buildEntry(buildPlayCommand(soundPath), hookDef),
        )
      }

      if (settings.hooks && isEmpty(settings.hooks)) {
        delete settings.hooks
      }

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = true
      })
      return true
    } catch (err) {
      console.error('Failed to write settings:', err)
      return false
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }

  async removeConfig(): Promise<boolean> {
    this.saving = true

    try {
      const settings = await readSettings(this.settingsPath)
      stripSoundHooks(settings, hookTypes, this.hooksFormat)

      if (!settings.hooks) {
        for (const key of keys(this.hooksFormat.initialSettings())) {
          delete settings[key as keyof Settings]
        }
      }

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = false
      })
      return true
    } catch (err) {
      console.error('Failed to update settings:', err)
      return false
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }
}

class Store extends BaseStore {
  soundsDir: string = ''
  playScript: string = ''
  selectedAgentId: string = agents[0].id
  agentStores: Map<string, AgentStore> = new Map()
  visibleAgentIds: Set<string> = new Set(map(agents, (a) => a.id))

  constructor() {
    super()
    makeAutoObservable(this)
    for (const agent of agents) {
      this.agentStores.set(agent.id, new AgentStore(agent))
    }
    this.init()
  }

  get visibleAgents(): AgentDef[] {
    return filter(agents, (a) => this.visibleAgentIds.has(a.id)).sort((a, b) =>
      naturalSort.comparator(a.name, b.name),
    )
  }

  async init() {
    const home = await tinker.getPath('home')
    const soundsDir = agentNotification.getSoundsDir()
    const playScript = agentNotification.getPlayScript()
    runInAction(() => {
      this.soundsDir = soundsDir
      this.playScript = playScript
    })

    for (const agent of agents) {
      if (agent.requireDir) {
        try {
          const stat = await tinker.fstat(`${home}/${agent.configDir}`)
          if (!stat.isDirectory) throw new Error()
        } catch {
          runInAction(() => {
            this.visibleAgentIds.delete(agent.id)
          })
        }
      }
    }

    for (const agentStore of this.agentStores.values()) {
      await agentStore.init(home)
    }
  }

  setSelectedAgent(id: string) {
    this.selectedAgentId = id
  }

  get selectedAgentStore(): AgentStore {
    return this.agentStores.get(this.selectedAgentId)!
  }
}

const store = new Store()
export default store
