import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'

export interface SoundPack {
  id: string
}

export const soundPacks: SoundPack[] = [
  { id: 'default' },
  { id: 'young-girl' },
  { id: 'elegant-lady' },
  { id: 'gentle-lord' },
  { id: 'graceful-beauty' },
]

export interface AgentDef {
  id: string
  name: string
  configDir: string
  configFile?: string
}

export const agents: AgentDef[] = [
  { id: 'codebuddy', name: 'CodeBuddy', configDir: '.codebuddy' },
  {
    id: 'claude-internal',
    name: 'Claude Internal',
    configDir: '.claude-internal',
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
]

export type HookType = 'ready' | 'work' | 'stop' | 'permission'

export const hookTypes: {
  id: HookType
  file: string
  event: string
  matcher?: string
}[] = [
  { id: 'ready', file: 'ready.mp3', event: 'SessionStart' },
  { id: 'work', file: 'work.mp3', event: 'UserPromptSubmit' },
  { id: 'stop', file: 'stop.mp3', event: 'Stop' },
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
  hooks?: Record<string, HookEntry[]>
}

function isAfplayHook(hook: Hook): boolean {
  return (
    hook.type === 'command' &&
    typeof hook.command === 'string' &&
    hook.command.startsWith('afplay ')
  )
}

function removeAfplayEntries(
  entries: HookEntry[],
  hookDef: (typeof hookTypes)[number],
): HookEntry[] {
  return entries.filter((entry) => {
    if (hookDef.matcher && entry.matcher !== hookDef.matcher) return true
    if (!hookDef.matcher && entry.matcher) return true
    if (!entry.hooks) return true
    return !entry.hooks.some(isAfplayHook)
  })
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

  getSoundAbsolutePath(hookType: HookType): string {
    if (this.selectedPack === 'custom') {
      return this.customSoundPaths[hookType]
    }
    const hookDef = hookTypes.find((h) => h.id === hookType)!
    return `${store.soundsDir}/${this.selectedPack}/${hookDef.file}`
  }

  get canApply(): boolean {
    if (this.selectedPack === 'custom') {
      const hasAnyEnabled = hookTypes.some((h) => this.enabledHooks[h.id])
      if (!hasAnyEnabled) return false
      for (const h of hookTypes) {
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
        const eventHooks = settings?.hooks?.[hookDef.event]
        if (!eventHooks || !Array.isArray(eventHooks)) continue

        for (const entry of eventHooks) {
          if (!entry.hooks) continue
          if (hookDef.matcher && entry.matcher !== hookDef.matcher) continue

          for (const hook of entry.hooks) {
            if (isAfplayHook(hook)) {
              const soundPath = hook.command!.replace('afplay ', '').trim()
              found = true

              runInAction(() => {
                this.enabledHooks[hookDef.id] = true
                const pack = soundPacks.find((p) =>
                  soundPath.endsWith(`/${p.id}/${hookDef.file}`),
                )
                if (pack) {
                  this.selectedPack = pack.id
                } else {
                  this.selectedPack = 'custom'
                  this.customSoundPaths[hookDef.id] = soundPath
                }
              })
              break
            }
          }
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

      for (const hookDef of hookTypes) {
        const event = hookDef.event

        if (!settings.hooks[event]) {
          settings.hooks[event] = []
        }

        settings.hooks[event] = removeAfplayEntries(
          settings.hooks[event],
          hookDef,
        )

        if (this.enabledHooks[hookDef.id]) {
          const soundPath = this.getSoundAbsolutePath(hookDef.id)
          if (soundPath) {
            const hookEntry: HookEntry = {
              hooks: [
                {
                  type: 'command',
                  command: `afplay ${soundPath}`,
                },
              ],
            }
            if (hookDef.matcher) {
              hookEntry.matcher = hookDef.matcher
            }
            settings.hooks[event].push(hookEntry)
          }
        }

        if (settings.hooks[event].length === 0) {
          delete settings.hooks[event]
        }
      }

      if (Object.keys(settings.hooks).length === 0) {
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
          const event = hookDef.event
          if (!settings.hooks[event] || !Array.isArray(settings.hooks[event]))
            continue

          settings.hooks[event] = removeAfplayEntries(
            settings.hooks[event],
            hookDef,
          )

          if (settings.hooks[event].length === 0) {
            delete settings.hooks[event]
          }
        }

        if (Object.keys(settings.hooks).length === 0) {
          delete settings.hooks
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
  selectedAgentId: string = agents[0].id
  agentStores: Map<string, AgentStore> = new Map()

  constructor() {
    makeAutoObservable(this)
    for (const agent of agents) {
      this.agentStores.set(agent.id, new AgentStore(agent))
    }
    this.init()
  }

  async init() {
    const home = await tinker.getPath('home')
    const soundsDir = agentBell.getSoundsDir()
    runInAction(() => {
      this.soundsDir = soundsDir
    })
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
