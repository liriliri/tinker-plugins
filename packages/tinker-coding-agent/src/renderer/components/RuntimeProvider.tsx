import { useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react'
import type { CodingAgentEvent } from '../../common/types'
import { toThreadMessage } from '../lib/toThreadMessage'

interface RuntimeProviderProps {
  children: ReactNode
}

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const [messages, setMessages] = useState<readonly ThreadMessageLike[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    codingAgent.getMessages().then((msgs) => {
      if (!cancelled) setMessages(msgs.map(toThreadMessage))
    })
    codingAgent.isRunning().then((running) => {
      if (!cancelled) setIsRunning(running)
    })

    const off = codingAgent.onEvent((event: CodingAgentEvent) => {
      if (event.type === 'messages') {
        setMessages(event.messages.map(toThreadMessage))
      } else if (event.type === 'running') {
        setIsRunning(event.running)
      }
    })

    return () => {
      cancelled = true
      off()
    }
  }, [])

  const onNew = useCallback(async (message: AppendMessage) => {
    const textPart = message.content.find((c) => c.type === 'text')
    if (!textPart || textPart.type !== 'text') {
      throw new Error('Only text messages are supported')
    }

    const userMessage: ThreadMessageLike = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: [{ type: 'text', text: textPart.text }],
    }
    setMessages((current) => [...current, userMessage])
    setIsRunning(true)

    try {
      await codingAgent.prompt(textPart.text)
    } catch (err) {
      setIsRunning(false)
      throw err
    }
  }, [])

  const onCancel = useCallback(async () => {
    await codingAgent.abort()
  }, [])

  const runtime = useExternalStoreRuntime({
    messages,
    setMessages,
    isRunning,
    onNew,
    onCancel,
    convertMessage: (m) => m,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
