import {
  createAssistantMessageEventStream,
  parseStreamingJson,
  type Api,
  type AssistantMessage,
  type Context,
  type Model,
  type SimpleStreamOptions,
  type StopReason,
  type ToolCall,
} from '@earendil-works/pi-ai'
import cloneDeep from 'licia/cloneDeep'
import isEmpty from 'licia/isEmpty'
import isStr from 'licia/isStr'
import map from 'licia/map'
import now from 'licia/now'
import startWith from 'licia/startWith'
import { contentToText, errorMessage } from '../common/util'

interface TinkerStreamConfig {
  getProvider: () => string | undefined
  getModel: () => string | undefined
}

interface NormalizedToolCall {
  id: string
  name: string
  arguments: string
}

interface JsonSchemaObject {
  type: string
  properties?: Record<string, unknown>
  [key: string]: unknown
}

function emptyUsage(): AssistantMessage['usage'] {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  }
}

function createPartial(
  model: Model<Api>,
  stopReason: StopReason = 'stop',
): AssistantMessage {
  return {
    role: 'assistant',
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: emptyUsage(),
    stopReason,
    timestamp: now(),
  }
}

function toTinkerMessages(context: Context): tinker.AiMessage[] {
  const messages: tinker.AiMessage[] = []

  if (context.systemPrompt) {
    messages.push({ role: 'system', content: context.systemPrompt })
  }

  for (const msg of context.messages) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: contentToText(msg.content) })
      continue
    }

    if (msg.role === 'assistant') {
      const textParts: string[] = []
      const reasoningParts: string[] = []
      const toolCalls: tinker.AiMessage['toolCalls'] = []

      for (const part of msg.content) {
        if (part.type === 'text') textParts.push(part.text)
        else if (part.type === 'thinking') reasoningParts.push(part.thinking)
        else if (part.type === 'toolCall') {
          toolCalls!.push({
            id: part.id,
            type: 'function',
            function: {
              name: part.name,
              arguments: JSON.stringify(part.arguments ?? {}),
            },
          })
        }
      }

      messages.push({
        role: 'assistant',
        content: textParts.join('') || undefined,
        reasoningContent: reasoningParts.join('') || undefined,
        toolCalls: toolCalls!.length ? toolCalls : undefined,
      })
      continue
    }

    if (msg.role === 'toolResult') {
      messages.push({
        role: 'tool',
        content: contentToText(msg.content),
        toolCallId: msg.toolCallId,
        toolName: msg.toolName,
      })
    }
  }

  return messages
}

function toTinkerTools(context: Context): tinker.AiCallOption['tools'] {
  if (isEmpty(context.tools)) return undefined
  return map(context.tools!, (tool) => {
    let parameters: JsonSchemaObject = { type: 'object', properties: {} }
    try {
      parameters = cloneDeep(tool.parameters ?? parameters) as JsonSchemaObject
    } catch {
      // keep fallback empty object schema
    }
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters,
      },
    }
  })
}

function normalizeToolCalls(
  raw: tinker.AiChunk['toolCalls'],
): NormalizedToolCall[] {
  if (isEmpty(raw)) return []
  return map(raw!, (item, i) => {
    const record = item as Record<string, unknown>
    const fn = record.function as Record<string, unknown> | undefined
    const id =
      (record.id as string) || (record.toolCallId as string) || `tool_${i}`
    const name =
      (record.name as string) ||
      (record.toolName as string) ||
      (fn?.name as string) ||
      'unknown'
    let args = record.arguments ?? record.args ?? fn?.arguments ?? '{}'
    if (!isStr(args)) args = JSON.stringify(args ?? {})
    return { id, name, arguments: args as string }
  })
}

export function createTinkerStreamFn(config: TinkerStreamConfig) {
  return (
    model: Model<Api>,
    context: Context,
    options?: SimpleStreamOptions,
  ) => {
    const stream = createAssistantMessageEventStream()

    ;(async () => {
      const partial = createPartial(model)
      let textIndex = -1
      let thinkingIndex = -1
      let textStarted = false
      let thinkingStarted = false
      const toolCallIndexes = new Map<string, number>()
      let currentTask: tinker.AiStreamTask | undefined
      let finalized = false

      const finalize = (reason: 'stop' | 'toolUse' | 'length') => {
        if (finalized) return
        finalized = true

        if (thinkingStarted && thinkingIndex >= 0) {
          const block = partial.content[thinkingIndex]
          if (block?.type === 'thinking') {
            stream.push({
              type: 'thinking_end',
              contentIndex: thinkingIndex,
              content: block.thinking,
              partial,
            })
          }
        }
        if (textStarted && textIndex >= 0) {
          const block = partial.content[textIndex]
          if (block?.type === 'text') {
            stream.push({
              type: 'text_end',
              contentIndex: textIndex,
              content: block.text,
              partial,
            })
          }
        }

        for (const [id, contentIndex] of toolCallIndexes) {
          const block = partial.content[contentIndex]
          if (block?.type === 'toolCall') {
            const toolCall: ToolCall = {
              type: 'toolCall',
              id: block.id || id,
              name: block.name,
              arguments: block.arguments ?? {},
            }
            stream.push({
              type: 'toolcall_end',
              contentIndex,
              toolCall,
              partial,
            })
          }
        }

        partial.stopReason = reason
        stream.push({
          type: 'done',
          reason,
          message: partial,
        })
      }

      const fail = (reason: 'aborted' | 'error', message: string) => {
        if (finalized) return
        finalized = true
        partial.stopReason = reason
        partial.errorMessage = message
        stream.push({
          type: 'error',
          reason,
          error: partial,
        })
      }

      const abortHandler = () => {
        currentTask?.abort()
        fail('aborted', 'Request aborted')
      }
      options?.signal?.addEventListener('abort', abortHandler)
      if (options?.signal?.aborted) {
        abortHandler()
      }

      try {
        if (options?.signal?.aborted) {
          fail('aborted', 'Request aborted')
          return
        }

        stream.push({ type: 'start', partial })

        const provider = config.getProvider()
        const modelId = config.getModel() || model.id

        const option = JSON.parse(
          JSON.stringify({
            provider,
            model: modelId,
            messages: toTinkerMessages(context),
            tools: toTinkerTools(context),
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
          }),
        ) as tinker.AiCallOption

        currentTask = tinker.callAIStream(option, (chunk) => {
          if (finalized || options?.signal?.aborted) {
            return
          }

          if (chunk.error) {
            fail('error', chunk.error)
            return
          }

          if (chunk.reasoningContent) {
            if (!thinkingStarted) {
              thinkingIndex = partial.content.length
              partial.content.push({ type: 'thinking', thinking: '' })
              stream.push({
                type: 'thinking_start',
                contentIndex: thinkingIndex,
                partial,
              })
              thinkingStarted = true
            }
            const block = partial.content[thinkingIndex]
            if (block?.type === 'thinking') {
              block.thinking += chunk.reasoningContent
              stream.push({
                type: 'thinking_delta',
                contentIndex: thinkingIndex,
                delta: chunk.reasoningContent,
                partial,
              })
            }
          }

          if (chunk.content) {
            if (!textStarted) {
              textIndex = partial.content.length
              partial.content.push({ type: 'text', text: '' })
              stream.push({
                type: 'text_start',
                contentIndex: textIndex,
                partial,
              })
              textStarted = true
            }
            const block = partial.content[textIndex]
            if (block?.type === 'text') {
              block.text += chunk.content
              stream.push({
                type: 'text_delta',
                contentIndex: textIndex,
                delta: chunk.content,
                partial,
              })
            }
          }

          const toolCalls = normalizeToolCalls(chunk.toolCalls)
          for (const tc of toolCalls) {
            let contentIndex = toolCallIndexes.get(tc.id)
            if (contentIndex === undefined) {
              contentIndex = partial.content.length
              toolCallIndexes.set(tc.id, contentIndex)
              partial.content.push({
                type: 'toolCall',
                id: tc.id,
                name: tc.name,
                arguments: {},
              })
              stream.push({
                type: 'toolcall_start',
                contentIndex,
                partial,
              })
            }

            const block = partial.content[contentIndex]
            if (block?.type === 'toolCall') {
              const prev = JSON.stringify(block.arguments ?? {})
              const nextArgs = parseStreamingJson<Record<string, unknown>>(
                tc.arguments,
              )
              block.arguments = nextArgs
              const delta =
                startWith(tc.arguments, prev) && prev !== '{}'
                  ? tc.arguments.slice(prev.length)
                  : tc.arguments
              if (delta) {
                stream.push({
                  type: 'toolcall_delta',
                  contentIndex,
                  delta,
                  partial,
                })
              }
            }
          }

          if (chunk.done) {
            finalize(toolCallIndexes.size > 0 ? 'toolUse' : 'stop')
          }
        })

        if (options?.signal?.aborted) {
          currentTask.abort()
          fail('aborted', 'Request aborted')
        }

        await currentTask

        if (options?.signal?.aborted) {
          fail('aborted', 'Request aborted')
        } else {
          finalize(toolCallIndexes.size > 0 ? 'toolUse' : 'stop')
        }
      } catch (err) {
        const aborted = options?.signal?.aborted
        fail(aborted ? 'aborted' : 'error', errorMessage(err))
      } finally {
        options?.signal?.removeEventListener('abort', abortHandler)
      }
    })()

    return stream
  }
}
