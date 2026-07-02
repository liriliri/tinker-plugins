import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'
import endWith from 'licia/endWith'
import isEmpty from 'licia/isEmpty'
import isWindows from 'licia/isWindows'
import isArr from 'licia/isArr'
import naturalSort from 'licia/naturalSort'
import type { HookTypeDef } from './types'
import type { HooksFormat } from './lib/hooksFormat'
import { resolveFormat } from './lib/hooksFormat'

interface SoundPack {
  id: string
}

export const soundPacks: SoundPack[] = [
  { id: 'default' },
  { id: 'young-girl' },
  { id: 'elegant-lady' },
  { id: 'gentle-lord' },
  { id: 'graceful-beauty' },
]

interface AgentDef {
  id: string
  name: string
  configDir: string
  configFile?: string
  requireDir?: boolean
  format?: 'default' | 'cursor'
}

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

type HookType = 'ready' | 'work' | 'stop' | 'permission'

export const hookTypes: {
  id: HookType
  file: string
  event: string
  matcher?: string
  cursorEvent?: string
}[] = [
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

interface Hook {
  type: string
  command?: string
}

interface HookEntry {
  matcher?: string
  hooks?: Hook[]
}

interface Settings {
  version?: number
  hooks?: Record<string, HookEntry[]>
}

function buildPlayCommand(soundPath: string): string {
  if (isWindows) {
    return `powershell -ExecutionPolicy Bypass -File "${store.playScript}" "${soundPath}"`
  }
  return `afplay "${soundPath}"`
}

export class AgentStore {
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
  message: string = ''

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

  get enabledHookTypes(): typeof hookTypes {
    return this.hooksFormat.filterHookTypes(hookTypes)
  }

  getSoundAbsolutePath(hookType: HookType): string {
    if (this.selectedPack === 'custom') {
      return this.customSoundPaths[hookType]
    }
    const hookDef = hookTypes.find((h) => h.id === hookType)!
    return `${store.soundsDir}/${this.selectedPack}/${hookDef.file}`
  }

  get canApply(): boolean {
    if (this.selectedPack === 'custom') {
      const hookTypesToCheck = this.enabledHookTypes
      const hasAnyEnabled = hookTypesToCheck.some(
        (h) => this.enabledHooks[h.id],
      )
      if (!hasAnyEnabled) return false
      for (const h of hookTypesToCheck) {
        if (this.enabledHooks[h.id] && !this.customSoundPaths[h.id])
          return false
      }
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
            const pack = soundPacks.find((p) =>
              endWith(soundPath, `/${p.id}/${hookDef.file}`),
            )
            if (pack) {
              this.selectedPack = pack.id
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
    this.message = ''
  }

  toggleHook(hookType: HookType) {
    this.enabledHooks[hookType] = !this.enabledHooks[hookType]
    this.message = ''
  }

  async applyConfig() {
    this.saving = true
    this.message = ''

    try {
      let settings: Settings = {}
      try {
        const content = await tinker.readFile(this.settingsPath, 'utf-8')
        settings = JSON.parse(content as string)
      } catch {
        // file doesn't exist yet
      }

      if (!settings.hooks) {
        settings.hooks = {}
      }

      Object.assign(settings, this.hooksFormat.initialSettings())

      for (const hookDef of this.enabledHookTypes) {
        const eventName = this.hooksFormat.getEventName(hookDef)

        if (!settings.hooks[eventName]) {
          settings.hooks[eventName] = []
        }

        settings.hooks[eventName] = this.hooksFormat.filterEntries(
          settings.hooks[eventName],
          hookDef,
        )

        if (this.enabledHooks[hookDef.id]) {
          const soundPath = this.getSoundAbsolutePath(hookDef.id)
          if (soundPath) {
            settings.hooks[eventName].push(
              this.hooksFormat.buildEntry(buildPlayCommand(soundPath), hookDef),
            )
          }
        }

        if (settings.hooks[eventName].length === 0) {
          delete settings.hooks[eventName]
        }
      }

      if (isEmpty(settings.hooks)) {
        delete settings.hooks
      }

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = true
        this.message = t('applySuccess')
      })
    } catch (err) {
      runInAction(() => {
        this.message = t('applyFailed')
      })
      console.error('Failed to write settings:', err)
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
      const content = await tinker.readFile(this.settingsPath, 'utf-8')
      const settings: Settings = JSON.parse(content as string)

      if (settings.hooks) {
        for (const hookDef of hookTypes) {
          const eventName = this.hooksFormat.getEventName(hookDef)
          if (!settings.hooks[eventName] || !isArr(settings.hooks[eventName]))
            continue

          settings.hooks[eventName] = this.hooksFormat.filterEntries(
            settings.hooks[eventName],
            hookDef,
          )

          if (settings.hooks[eventName].length === 0) {
            delete settings.hooks[eventName]
          }
        }

        if (isEmpty(settings.hooks)) {
          delete settings.hooks
          for (const key of Object.keys(this.hooksFormat.initialSettings())) {
            delete (settings as any)[key]
          }
        }
      }

      await tinker.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8',
      )

      runInAction(() => {
        this.isConfigured = false
        this.message = t('removeSuccess')
      })
    } catch (err) {
      runInAction(() => {
        this.message = t('removeFailed')
      })
      console.error('Failed to update settings:', err)
    } finally {
      runInAction(() => {
        this.saving = false
      })
    }
  }
}

class Store {
  soundsDir: string = ''
  playScript: string = ''
  selectedAgentId: string = agents[0].id
  agentStores: Map<string, AgentStore> = new Map()
  visibleAgentIds: Set<string> = new Set(agents.map((a) => a.id))

  constructor() {
    makeAutoObservable(this)
    for (const agent of agents) {
      this.agentStores.set(agent.id, new AgentStore(agent))
    }
    this.init()
  }

  get visibleAgents(): AgentDef[] {
    return agents
      .filter((a) => this.visibleAgentIds.has(a.id))
      .sort((a, b) => naturalSort.comparator(a.name, b.name))
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

  getSoundAbsolutePath(packId: string, file: string): string {
    return `${this.soundsDir}/${packId}/${file}`
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
