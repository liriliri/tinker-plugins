import {
  Agent,
  type AgentEvent,
  type AgentMessage,
} from '@earendil-works/pi-agent-core'
import type {
  CodingAgentEvent,
  ModelSelection,
  SerializedContentPart,
  SerializedMessage,
} from '../common/types'
import { contentToText } from '../common/util'
import { createTinkerModel, loadCodingTools } from './piLoader'
import { createTinkerStreamFn } from './tinkerStream'

const SYSTEM_PROMPT = `You are a coding assistant running inside the Tinker Coding Agent plugin.
You can read, edit, and write files, and run shell commands in the workspace.
Be concise and prefer making concrete code changes when asked.`

type EventListener = (event: CodingAgentEvent) => void

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
    ? [...messages.filter((m) => m !== streaming), streaming]
    : messages

  for (let i = 0; i < list.length; i++) {
    const msg = list[i]
    if (msg.role === 'user') {
      result.push({
        id: `user-${i}-${msg.timestamp ?? i}`,
        role: 'user',
        content: [{ type: 'text', text: contentToText(msg.content) }],
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

export class AgentHost {
  private agent: Agent | null = null
  private unsubscribe: (() => void) | null = null
  private listeners = new Set<EventListener>()
  private cwd: string | null = null
  private modelSelection: ModelSelection | null = null
  private running = false

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
      return
    }
    this.emit({
      type: 'messages',
      messages: serializeMessages(
        this.agent.state.messages,
        this.agent.state.streamingMessage ?? null,
      ),
    })
  }

  getWorkspace() {
    return this.cwd
  }

  getModel() {
    return this.modelSelection
  }

  isRunning() {
    return this.running
  }

  getMessages(): SerializedMessage[] {
    if (!this.agent) return []
    return serializeMessages(
      this.agent.state.messages,
      this.agent.state.streamingMessage ?? null,
    )
  }

  async setModel(provider: string, model: string) {
    this.modelSelection = { provider, model }
    if (this.agent) {
      this.agent.state.model = createTinkerModel(provider, model)
    }
    this.emit({ type: 'model', model: this.modelSelection })
  }

  async openWorkspace(): Promise<string | null> {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return this.cwd
    await this.setWorkspace(result.filePaths[0])
    return this.cwd
  }

  async setWorkspace(cwd: string) {
    this.cwd = cwd
    try {
      await this.recreateAgent()
      this.emit({ type: 'workspace', cwd })
      this.emitMessages()
    } catch (err) {
      this.agent = null
      const message = err instanceof Error ? err.message : String(err)
      this.emit({ type: 'error', error: message })
      throw err
    }
  }

  private async recreateAgent() {
    if (!this.cwd) return

    this.unsubscribe?.()
    this.agent = null

    const tools = await loadCodingTools(this.cwd)
    const provider = this.modelSelection?.provider || 'tinker'
    const modelId = this.modelSelection?.model || 'default'

    const agent = new Agent({
      initialState: {
        systemPrompt: SYSTEM_PROMPT,
        model: createTinkerModel(provider, modelId),
        thinkingLevel: 'off',
        tools,
      },
      streamFn: createTinkerStreamFn({
        getProvider: () => this.modelSelection?.provider,
        getModel: () => this.modelSelection?.model,
      }),
    })

    this.unsubscribe = agent.subscribe((event: AgentEvent) => {
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
        this.emitMessages()
      }
    })

    this.agent = agent
  }

  async ensureReady() {
    if (!this.cwd) {
      throw new Error('Open a workspace folder first')
    }
    if (!this.modelSelection) {
      throw new Error('Select a model first')
    }
    if (!this.agent) {
      await this.recreateAgent()
    }
  }

  async prompt(text: string) {
    await this.ensureReady()
    if (!this.agent) throw new Error('Agent not ready')
    this.running = true
    this.emit({ type: 'running', running: true })
    try {
      await this.agent.prompt(text)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.emit({ type: 'error', error: message })
      throw err
    } finally {
      this.running = false
      this.emit({ type: 'running', running: false })
      this.emitMessages()
    }
  }

  async abort() {
    this.agent?.abort()
  }
}

export const agentHost = new AgentHost()
