import { makeAutoObservable, runInAction } from 'mobx'
import type { ThreadMessageLike } from '@assistant-ui/react'
import map from 'licia/map'
import now from 'licia/now'
import raf from 'licia/raf'
import type {
  CodingAgentEvent,
  ContextUsageInfo,
  ModelSelection,
  SessionInfo,
  SkillInfo,
} from '../common/types'
import { isValidSelection } from './lib/model'
import { toThreadMessage } from './lib/toThreadMessage'
import {
  addRecentWorkspace,
  getRecentWorkspaces,
  removeRecentWorkspace,
} from './lib/recentWorkspaces'

class Store {
  ready = false
  workspace: string | null = null
  sessions: SessionInfo[] = []
  activeSessionId: string | null = null
  recentWorkspaces: string[] = getRecentWorkspaces()

  toastOpen = false
  toastMsg = ''

  providers: tinker.AiProviderInfo[] = []
  model: ModelSelection | null = null

  skills: SkillInfo[] = []
  context: ContextUsageInfo | null = null

  messages: readonly ThreadMessageLike[] = []
  isRunning = false

  constructor() {
    makeAutoObservable(this)
  }

  async init() {
    codingAgent.onEvent((event) => this.handleEvent(event))

    const [workspace, sessions, activeSessionId] = await Promise.all([
      codingAgent.getWorkspace(),
      codingAgent.getSessions(),
      codingAgent.getActiveSessionId(),
    ])

    runInAction(() => {
      this.workspace = workspace
      this.sessions = sessions
      this.activeSessionId = activeSessionId
      this.ready = true
    })

    if (workspace) {
      await this.hydrateWorkspaceState()
    }
  }

  private async hydrateWorkspaceState() {
    await this.ensureProvidersAndModel()

    const [skills, context, messages, isRunning] = await Promise.all([
      codingAgent.getSkills(),
      codingAgent.getContextUsage(),
      codingAgent.getMessages(),
      codingAgent.isRunning(),
    ])

    runInAction(() => {
      this.skills = skills
      this.context = context
      this.messages = map(messages, toThreadMessage)
      this.isRunning = isRunning
    })
  }

  private async ensureProvidersAndModel() {
    const [providers, model] = await Promise.all([
      codingAgent.listProviders(),
      codingAgent.ensureDefaultModel(),
    ])
    runInAction(() => {
      this.providers = providers
      this.model = isValidSelection(model) ? model : null
    })
  }

  private handleEvent(event: CodingAgentEvent) {
    switch (event.type) {
      case 'workspace':
        this.workspace = event.cwd
        if (event.cwd) {
          void this.ensureProvidersAndModel()
        }
        break
      case 'sessions':
        this.sessions = event.sessions
        this.activeSessionId = event.activeSessionId
        break
      case 'error':
        this.showError(event.error)
        break
      case 'model':
        this.model = isValidSelection(event.model) ? event.model : null
        break
      case 'skills':
        this.skills = event.skills
        break
      case 'context':
        this.context = event.context
        break
      case 'messages':
        this.messages = map(event.messages, toThreadMessage)
        break
      case 'running':
        this.isRunning = event.running
        break
    }
  }

  showError(message: string) {
    this.toastMsg = message
    this.toastOpen = false
    raf(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  private rememberWorkspace(path: string) {
    this.recentWorkspaces = addRecentWorkspace(path)
  }

  forgetRecentWorkspace(path: string) {
    this.recentWorkspaces = removeRecentWorkspace(path)
  }

  async openWorkspace() {
    const path = await codingAgent.openWorkspace()
    if (path) this.rememberWorkspace(path)
  }

  async openRecentWorkspace(path: string) {
    try {
      const stats = await tinker.fstat(path)
      if (!stats.isDirectory) throw new Error('not a directory')
    } catch {
      this.forgetRecentWorkspace(path)
      this.showError('folderNotFound')
      return
    }

    try {
      await codingAgent.setWorkspace(path)
      this.rememberWorkspace(path)
    } catch {
      // Host already emits the error event for toast display.
    }
  }

  leaveWorkspace() {
    codingAgent.leaveWorkspace()
  }

  createSession() {
    return codingAgent.createSession()
  }

  selectSession(id: string) {
    return codingAgent.selectSession(id)
  }

  deleteSession(id: string) {
    return codingAgent.deleteSession(id)
  }

  setModel(provider: string, model: string) {
    this.model = { provider, model }
    codingAgent.setModel(provider, model)
  }

  setMessages(messages: readonly ThreadMessageLike[]) {
    this.messages = messages
  }

  private appendOptimisticUserMessage(text: string) {
    const userMessage: ThreadMessageLike = {
      id: `local-user-${now()}`,
      role: 'user',
      content: [{ type: 'text', text }],
    }
    this.messages = [...this.messages, userMessage]
    this.isRunning = true
  }

  async prompt(text: string) {
    this.appendOptimisticUserMessage(text)
    try {
      await codingAgent.prompt(text)
    } catch (err) {
      runInAction(() => {
        this.isRunning = false
      })
      throw err
    }
  }

  async abort() {
    this.isRunning = false
    await codingAgent.abort()
  }
}

const store = new Store()

export default store
