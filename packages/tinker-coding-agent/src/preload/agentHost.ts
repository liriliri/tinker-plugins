import {
  Agent,
  type AgentEvent,
  type AgentMessage,
} from '@earendil-works/pi-agent-core'
import type { Model } from '@earendil-works/pi-ai'
import {
  SessionManager,
  createBashTool,
  createEditTool,
  createReadTool,
  createWriteTool,
  estimateTokens,
  formatSkillsForPrompt,
  getAgentDir,
  loadSkills,
  parseSkillBlock,
  stripFrontmatter,
  type Skill,
} from '@earendil-works/pi-coding-agent'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import concat from 'licia/concat'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import now from 'licia/now'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import type {
  CodingAgentEvent,
  ContextUsageInfo,
  ModelSelection,
  SerializedContentPart,
  SerializedMessage,
  SessionInfo,
  SkillInfo,
} from '../common/types'
import { contentToText, errorMessage } from '../common/util'
import { getWorkspaceSessionDir } from './sessionPaths'
import { createTinkerStreamFn } from './tinkerStream'

const SYSTEM_PROMPT = `You are a coding assistant running inside the Tinker Coding Agent plugin.
You can read, edit, and write files, and run shell commands in the workspace.
Be concise and prefer making concrete code changes when asked.

When the user asks to use a skill by name, or a task matches an available skill's description, you MUST use the read tool to load that skill's file from its listed location and follow its instructions before proceeding.`

function findGitRepoRoot(startDir: string): string | null {
  let dir = resolve(startDir)
  while (true) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** Skill dirs under ~/.agents and project .agents (cwd up to git root). */
function collectAgentsSkillPaths(cwd: string): string[] {
  const userAgentsSkillsDir = join(homedir(), '.agents', 'skills')
  const paths = [userAgentsSkillsDir]
  const resolvedUser = resolve(userAgentsSkillsDir)

  let dir = resolve(cwd)
  const gitRoot = findGitRepoRoot(dir)
  while (true) {
    const agentsSkills = join(dir, '.agents', 'skills')
    if (resolve(agentsSkills) !== resolvedUser) {
      paths.push(agentsSkills)
    }
    if (gitRoot && dir === gitRoot) break
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return paths
}

function createCodingTools(cwd: string) {
  return [
    createReadTool(cwd),
    createBashTool(cwd),
    createEditTool(cwd),
    createWriteTool(cwd),
  ]
}

const DEFAULT_CONTEXT_WINDOW = 128000

function createTinkerModel(
  provider: string,
  modelId: string,
  contextWindow = DEFAULT_CONTEXT_WINDOW,
): Model<'openai-completions'> {
  return {
    id: modelId,
    name: modelId,
    api: 'openai-completions',
    provider: provider as Model<'openai-completions'>['provider'],
    baseUrl: '',
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow,
    maxTokens: 8192,
  }
}

type EventListener = (event: CodingAgentEvent) => void

interface ListedSession {
  id: string
  title: string
  createdAt: number
  path: string
}

/** Collapse expanded skill blocks to `/name` for UI/session titles. */
function toDisplayUserText(text: string): string {
  const skill = parseSkillBlock(text)
  if (skill) {
    return skill.userMessage
      ? `/${skill.name} ${skill.userMessage}`
      : `/${skill.name}`
  }
  if (startWith(text, '/skill:')) {
    const spaceIndex = text.indexOf(' ')
    const name = spaceIndex === -1 ? text.slice(7) : text.slice(7, spaceIndex)
    const args = spaceIndex === -1 ? '' : trim(text.slice(spaceIndex + 1))
    return args ? `/${name} ${args}` : `/${name}`
  }
  return text
}

function serializeMessages(
  messages: AgentMessage[],
  streaming?: AgentMessage | null,
): SerializedMessage[] {
  const toolResults = new Map<string, { content: string; isError: boolean }>()
  for (const msg of messages) {
    if (msg.role === 'toolResult') {
      toolResults.set(msg.toolCallId, {
        content: contentToText(msg.content),
        isError: !!msg.isError,
      })
    }
  }

  const result: SerializedMessage[] = []
  const list = streaming
    ? concat(
        filter(messages, (m) => m !== streaming),
        [streaming],
      )
    : messages

  for (let i = 0; i < list.length; i++) {
    const msg = list[i]
    if (msg.role === 'user') {
      result.push({
        id: `user-${i}-${msg.timestamp ?? i}`,
        role: 'user',
        content: [
          {
            type: 'text',
            text: toDisplayUserText(contentToText(msg.content)),
          },
        ],
      })
      continue
    }

    if (msg.role === 'assistant') {
      const parts: SerializedContentPart[] = []
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ type: 'text', text: part.text })
        } else if (part.type === 'thinking') {
          parts.push({ type: 'reasoning', text: part.thinking })
        } else if (part.type === 'toolCall') {
          const tr = toolResults.get(part.id)
          parts.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: part.name,
            args: part.arguments ?? {},
            argsText: JSON.stringify(part.arguments ?? {}, null, 2),
            result: tr?.content,
            isError: tr?.isError,
          })
        }
      }

      const isStreamingMsg = streaming === msg
      let status: SerializedMessage['status']
      if (isStreamingMsg) {
        status = { type: 'running' }
      } else if (msg.stopReason === 'error') {
        status = {
          type: 'incomplete',
          reason: 'error',
          error: msg.errorMessage,
        }
      } else if (msg.stopReason === 'aborted') {
        status = { type: 'incomplete', reason: 'cancelled' }
      } else {
        status = { type: 'complete', reason: 'stop' }
      }

      result.push({
        id: `assistant-${i}-${msg.timestamp ?? i}`,
        role: 'assistant',
        content: parts,
        status,
      })
    }
  }

  return result
}

function titleFromText(text: string): string {
  const trimmed = trim(text).replace(/\s+/g, ' ')
  if (isStrBlank(trimmed)) return ''
  return truncate(trimmed, 40)
}

export class AgentHost {
  private agent: Agent | null = null
  private unsubscribe: (() => void) | null = null
  private listeners = new Set<EventListener>()
  private cwd: string | null = null
  private sessionDir: string | null = null
  private sessionManager: SessionManager | null = null
  private listedSessions: ListedSession[] = []
  private modelSelection: ModelSelection | null = null
  private skills: Skill[] = []
  private contextWindow = DEFAULT_CONTEXT_WINDOW
  private running = false
  /** When true, host keeps the workspace/agent but UI shows the welcome screen. */
  private detached = false

  onEvent(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: CodingAgentEvent) {
    let safe: CodingAgentEvent
    try {
      safe = JSON.parse(JSON.stringify(event))
    } catch (err) {
      console.error('Failed to serialize event', err)
      return
    }
    for (const listener of this.listeners) {
      try {
        listener(safe)
      } catch (err) {
        console.error(err)
      }
    }
  }

  private emitMessages() {
    if (!this.agent) {
      this.emit({ type: 'messages', messages: [] })
      this.emitContext()
      return
    }
    this.emit({
      type: 'messages',
      messages: serializeMessages(
        this.agent.state.messages,
        this.agent.state.streamingMessage ?? null,
      ),
    })
    this.emitContext()
  }

  private emitContext() {
    this.emit({ type: 'context', context: this.getContextUsage() })
  }

  private emitSessions() {
    this.emit({
      type: 'sessions',
      sessions: this.getSessions(),
      activeSessionId: this.getActiveSessionId(),
    })
  }

  private emitSkills() {
    this.emit({ type: 'skills', skills: this.getSkills() })
  }

  private refreshSkills() {
    if (!this.cwd) {
      this.skills = []
      this.emitSkills()
      this.syncSystemPrompt()
      return
    }
    const result = loadSkills({
      cwd: this.cwd,
      agentDir: getAgentDir(),
      skillPaths: collectAgentsSkillPaths(this.cwd),
      includeDefaults: false,
    })
    this.skills = result.skills
    this.emitSkills()
    this.syncSystemPrompt()
  }

  private syncSystemPrompt() {
    if (this.agent) {
      this.agent.state.systemPrompt = this.buildSystemPrompt()
    }
  }

  getWorkspace() {
    return this.detached ? null : this.cwd
  }

  getModel() {
    return this.modelSelection
  }

  getSkills(): SkillInfo[] {
    return map(this.skills, (skill) => ({
      name: skill.name,
      description: skill.description,
    }))
  }

  getContextUsage(): ContextUsageInfo {
    let tokens = Math.ceil(this.buildSystemPrompt().length / 4)
    if (this.agent) {
      for (const message of this.agent.state.messages) {
        tokens += estimateTokens(message)
      }
    }
    return {
      tokens,
      contextWindow: this.contextWindow,
    }
  }

  isRunning() {
    return this.running
  }

  getActiveSessionId() {
    return this.sessionManager?.getSessionId() ?? null
  }

  getSessions(): SessionInfo[] {
    const sessions = map(this.listedSessions, ({ id, title, createdAt }) => ({
      id,
      title,
      createdAt,
    }))
    const activeId = this.getActiveSessionId()
    if (activeId && !some(sessions, (s) => s.id === activeId)) {
      sessions.unshift({
        id: activeId,
        title: this.sessionManager?.getSessionName() || '',
        createdAt: now(),
      })
    }
    return sessions
  }

  getMessages(): SerializedMessage[] {
    if (!this.agent) return []
    return serializeMessages(
      this.agent.state.messages,
      this.agent.state.streamingMessage ?? null,
    )
  }

  private hasModelSelection() {
    return !!(this.modelSelection?.provider && this.modelSelection?.model)
  }

  private findSessionPath(id: string): string | null {
    const listed = find(this.listedSessions, (s) => s.id === id)
    if (listed?.path) return listed.path
    if (this.sessionManager?.getSessionId() === id) {
      return this.sessionManager.getSessionFile() ?? null
    }
    return null
  }

  private async refreshListedSessions() {
    if (!this.cwd || !this.sessionDir) {
      this.listedSessions = []
      this.emitSessions()
      return
    }

    const listed = await SessionManager.list(this.cwd, this.sessionDir)
    this.listedSessions = map(listed, (session) => ({
      id: session.id,
      title: session.name || titleFromText(session.firstMessage),
      createdAt: session.created.getTime(),
      path: session.path,
    }))
    this.emitSessions()
  }

  private updateActiveTitle() {
    if (!this.sessionManager || !this.agent) return
    if (this.sessionManager.getSessionName()) return

    const firstUser = find(
      this.agent.state.messages,
      (msg) => msg.role === 'user',
    )
    if (!firstUser) return
    const title = titleFromText(
      toDisplayUserText(contentToText(firstUser.content)),
    )
    if (!title) return
    this.sessionManager.appendSessionInfo(title)
    void this.refreshListedSessions()
  }

  async setModel(provider: string, model: string) {
    if (!provider || !model) return
    this.modelSelection = { provider, model }
    this.contextWindow = await this.resolveContextWindow(provider, model)
    if (this.agent) {
      this.agent.state.model = createTinkerModel(
        provider,
        model,
        this.contextWindow,
      )
    }
    this.sessionManager?.appendModelChange(provider, model)
    this.emit({ type: 'model', model: this.modelSelection })
    this.emitContext()
  }

  private async resolveContextWindow(provider: string, model: string) {
    try {
      const providers = await tinker.getAIProviders()
      const match = find(providers, (p) => p.name === provider)
      const info = find(match?.models ?? [], (m) => m.name === model)
      if (info?.contextWindow && info.contextWindow > 0) {
        return info.contextWindow
      }
    } catch {
      // fall through to default
    }
    return DEFAULT_CONTEXT_WINDOW
  }

  private isModelAvailable(
    providers: tinker.AiProviderInfo[],
    selection: ModelSelection,
  ) {
    return some(
      providers,
      (provider) =>
        provider.name === selection.provider &&
        some(provider.models, (m) => m.name === selection.model),
    )
  }

  async ensureDefaultModel() {
    const providers = await tinker.getAIProviders()
    if (
      this.modelSelection &&
      this.hasModelSelection() &&
      this.isModelAvailable(providers, this.modelSelection)
    ) {
      return this.modelSelection
    }

    for (const provider of providers) {
      const first = provider.models[0]
      if (!first?.name) continue
      await this.setModel(provider.name, first.name)
      return this.modelSelection
    }

    this.modelSelection = null
    this.emit({ type: 'model', model: null })
    return null
  }

  async openWorkspace(): Promise<string | null> {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return this.cwd
    await this.setWorkspace(result.filePaths[0])
    return this.cwd
  }

  private async openOrCreateSession(cwd: string, sessionDir: string) {
    const listed = await SessionManager.list(cwd, sessionDir)
    if (listed[0]?.path) {
      return SessionManager.open(listed[0].path, sessionDir, cwd)
    }
    return SessionManager.create(cwd, sessionDir)
  }

  private async bindSession(sessionManager: SessionManager) {
    this.sessionManager = sessionManager
    const context = sessionManager.buildSessionContext()
    if (context.model?.provider && context.model.modelId) {
      this.modelSelection = {
        provider: context.model.provider,
        model: context.model.modelId,
      }
      this.contextWindow = await this.resolveContextWindow(
        context.model.provider,
        context.model.modelId,
      )
      this.emit({ type: 'model', model: this.modelSelection })
    }
    await this.recreateAgent(context.messages)
    await this.refreshListedSessions()
    this.emitMessages()
  }

  private showWorkspaceUi() {
    if (!this.cwd) return
    this.detached = false
    const name = splitPath(this.cwd).name || this.cwd
    tinker.setTitle(name)
    this.emit({ type: 'workspace', cwd: this.cwd })
    this.emitSessions()
    this.emitSkills()
    this.emitMessages()
    this.emit({ type: 'running', running: this.running })
    if (this.modelSelection) {
      this.emit({ type: 'model', model: this.modelSelection })
    }
    this.emitContext()
  }

  async setWorkspace(cwd: string) {
    try {
      const stats = await tinker.fstat(cwd)
      if (!stats.isDirectory) {
        throw new Error('errorNotDirectory')
      }
    } catch (err) {
      const key =
        isErr(err) && err.message === 'errorNotDirectory'
          ? 'errorNotDirectory'
          : 'folderNotFound'
      this.emit({ type: 'error', error: key })
      throw err
    }

    if (this.cwd === cwd) {
      this.refreshSkills()
      this.showWorkspaceUi()
      return
    }

    if (this.running && this.agent) {
      await this.agent.waitForIdle()
    }

    const previous = {
      cwd: this.cwd,
      sessionDir: this.sessionDir,
      sessionManager: this.sessionManager,
      listedSessions: this.listedSessions,
      detached: this.detached,
    }

    this.cwd = cwd
    this.sessionDir = getWorkspaceSessionDir(cwd)
    this.detached = false
    this.refreshSkills()

    try {
      const sessionManager = await this.openOrCreateSession(
        cwd,
        this.sessionDir,
      )
      await this.bindSession(sessionManager)
      this.showWorkspaceUi()
    } catch (err) {
      this.agent = null
      this.cwd = previous.cwd
      this.sessionDir = previous.sessionDir
      this.sessionManager = previous.sessionManager
      this.listedSessions = previous.listedSessions
      this.detached = previous.detached
      this.refreshSkills()
      this.emit({ type: 'error', error: errorMessage(err) })
      throw err
    }
  }

  /** Return to welcome UI without stopping an in-flight agent run. */
  leaveWorkspace() {
    if (!this.cwd) return
    this.detached = true
    tinker.setTitle('')
    this.emit({ type: 'workspace', cwd: null })
  }

  async createSession() {
    if (!this.cwd || !this.sessionDir) return null

    const context = this.sessionManager?.buildSessionContext()
    const activeEmpty =
      !!this.sessionManager &&
      isEmpty(context?.messages) &&
      isEmpty(this.agent?.state.messages)
    if (activeEmpty) {
      this.emitSessions()
      return this.getActiveSessionId()
    }

    this.agent?.abort()
    const sessionManager = SessionManager.create(this.cwd, this.sessionDir)
    await this.bindSession(sessionManager)
    return this.getActiveSessionId()
  }

  async selectSession(id: string) {
    if (!this.cwd || !this.sessionDir || id === this.getActiveSessionId())
      return

    const sessionPath = this.findSessionPath(id)
    if (!sessionPath || !existsSync(sessionPath)) return

    this.agent?.abort()
    const sessionManager = SessionManager.open(
      sessionPath,
      this.sessionDir,
      this.cwd,
    )
    await this.bindSession(sessionManager)
  }

  async deleteSession(id: string) {
    if (!this.cwd || !this.sessionDir) return

    const sessionPath = this.findSessionPath(id)
    const removingActive = this.getActiveSessionId() === id

    if (removingActive) {
      this.agent?.abort()
    }

    if (sessionPath && existsSync(sessionPath)) {
      unlinkSync(sessionPath)
    }

    await this.refreshListedSessions()

    if (!removingActive) return

    const next = this.listedSessions[0]
    if (next?.path && existsSync(next.path)) {
      const sessionManager = SessionManager.open(
        next.path,
        this.sessionDir,
        this.cwd,
      )
      await this.bindSession(sessionManager)
      return
    }

    const sessionManager = SessionManager.create(this.cwd, this.sessionDir)
    await this.bindSession(sessionManager)
  }

  private buildSystemPrompt() {
    const skillsPrompt = formatSkillsForPrompt(this.skills)
    return skillsPrompt ? `${SYSTEM_PROMPT}${skillsPrompt}` : SYSTEM_PROMPT
  }

  private expandSkillCommand(text: string): string {
    if (!startWith(text, '/')) return text

    const spaceIndex = text.indexOf(' ')
    const command =
      spaceIndex === -1 ? text.slice(1) : text.slice(1, spaceIndex)
    const args = spaceIndex === -1 ? '' : trim(text.slice(spaceIndex + 1))
    const skillName = startWith(command, 'skill:') ? command.slice(6) : command
    const skill = find(this.skills, (s) => s.name === skillName)
    if (!skill) return text

    try {
      const content = readFileSync(skill.filePath, 'utf-8')
      const body = trim(stripFrontmatter(content))
      const skillBlock = `<skill name="${skill.name}" location="${skill.filePath}">\nReferences are relative to ${skill.baseDir}.\n\n${body}\n</skill>`
      return args ? `${skillBlock}\n\n${args}` : skillBlock
    } catch (err) {
      console.error('Failed to expand skill', err)
      return text
    }
  }

  private async recreateAgent(messages: AgentMessage[] = []) {
    if (!this.cwd) return

    this.unsubscribe?.()
    this.agent = null

    const tools = createCodingTools(this.cwd)
    const provider = this.modelSelection?.provider || 'tinker'
    const modelId = this.modelSelection?.model || 'default'

    const agent = new Agent({
      initialState: {
        systemPrompt: this.buildSystemPrompt(),
        model: createTinkerModel(provider, modelId, this.contextWindow),
        thinkingLevel: 'off',
        tools,
        messages,
      },
      streamFn: createTinkerStreamFn({
        getProvider: () => this.modelSelection?.provider,
        getModel: () => this.modelSelection?.model,
      }),
    })

    this.unsubscribe = agent.subscribe((event: AgentEvent) => {
      if (event.type === 'message_end') {
        const message = event.message
        if (
          message.role === 'user' ||
          message.role === 'assistant' ||
          message.role === 'toolResult'
        ) {
          this.sessionManager?.appendMessage(message)
        }
        this.updateActiveTitle()
      }

      if (
        event.type === 'message_update' ||
        event.type === 'message_end' ||
        event.type === 'message_start' ||
        event.type === 'turn_end' ||
        event.type === 'agent_end'
      ) {
        this.emitMessages()
      }
      if (event.type === 'agent_start') {
        this.running = true
        this.emit({ type: 'running', running: true })
      }
      if (event.type === 'agent_end') {
        this.running = false
        this.emit({ type: 'running', running: false })
        void this.refreshListedSessions()
      }
    })

    this.agent = agent
  }

  async ensureReady() {
    if (!this.cwd) {
      throw new Error('errorOpenWorkspaceFirst')
    }
    await this.ensureDefaultModel()
    if (!this.modelSelection) {
      throw new Error('errorSelectModelFirst')
    }
    if (!this.agent) {
      const messages = this.sessionManager?.buildSessionContext().messages ?? []
      await this.recreateAgent(messages)
    }
  }

  async prompt(text: string) {
    try {
      await this.ensureReady()
    } catch (err) {
      this.emit({ type: 'error', error: errorMessage(err) })
      throw err
    }
    if (!this.agent) {
      this.emit({ type: 'error', error: 'errorAgentNotReady' })
      throw new Error('errorAgentNotReady')
    }
    const expanded = this.expandSkillCommand(text)
    this.running = true
    this.emit({ type: 'running', running: true })
    try {
      await this.agent.prompt(expanded)
    } catch (err) {
      this.emit({ type: 'error', error: errorMessage(err) })
      throw err
    } finally {
      this.running = false
      this.emit({ type: 'running', running: false })
      this.emitMessages()
      void this.refreshListedSessions()
    }
  }

  async abort() {
    this.agent?.abort()
    if (this.running) {
      this.running = false
      this.emit({ type: 'running', running: false })
    }
  }
}

export const agentHost = new AgentHost()
