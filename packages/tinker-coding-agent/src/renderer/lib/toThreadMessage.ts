import type { ThreadMessageLike } from '@assistant-ui/react'
import type { SerializedMessage } from '../../common/types'

export function toThreadMessage(msg: SerializedMessage): ThreadMessageLike {
  const content =
    msg.content.length === 0
      ? [{ type: 'text' as const, text: '' }]
      : msg.content.map((part) => {
          if (part.type === 'text') {
            return { type: 'text' as const, text: part.text || '' }
          }
          if (part.type === 'reasoning') {
            return { type: 'reasoning' as const, text: part.text || '' }
          }
          return {
            type: 'tool-call' as const,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: part.args || {},
            argsText: part.argsText || '{}',
            result: part.result,
            isError: part.isError,
          }
        })

  return {
    id: msg.id,
    role: msg.role,
    content,
    ...(msg.role === 'assistant'
      ? {
          status: msg.status ?? {
            type: 'complete' as const,
            reason: 'stop' as const,
          },
        }
      : {}),
  }
}
