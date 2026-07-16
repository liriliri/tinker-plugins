import { observer } from 'mobx-react-lite'
import type { AppendMessage } from '@assistant-ui/react'
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import find from 'licia/find'
import type { ReactNode } from 'react'
import store from '../store'

interface RuntimeProviderProps {
  children: ReactNode
}

export const RuntimeProvider = observer(function RuntimeProvider({
  children,
}: RuntimeProviderProps) {
  const runtime = useExternalStoreRuntime({
    messages: store.messages,
    setMessages: (messages) => store.setMessages(messages),
    isRunning: store.isRunning,
    onNew: async (message: AppendMessage) => {
      const textPart = find(message.content, (c) => c.type === 'text')
      if (!textPart || textPart.type !== 'text') {
        throw new Error('errorTextOnly')
      }
      await store.prompt(textPart.text)
    },
    onCancel: () => store.abort(),
    convertMessage: (m) => m,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
})
