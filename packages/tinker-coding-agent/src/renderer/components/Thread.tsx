import { Component, type FC, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type AssistantState,
} from '@assistant-ui/react'
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, SquareIcon } from 'lucide-react'
import { tw } from '../theme'
import className from 'licia/className'

interface TextPartProps {
  text?: string
}

interface ReasoningPartProps {
  text?: string
}

interface ToolFallbackProps {
  toolName: string
  argsText: string
  result?: unknown
  status?: { type?: string }
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: string | null
}

const isEmpty = (s: AssistantState) => s.thread.messages.length === 0

export const Thread: FC = () => {
  const { t } = useTranslation()
  const empty = useAuiState(isEmpty)

  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto px-4">
        <div
          className={className(
            'mx-auto flex w-full max-w-3xl flex-1 flex-col py-4',
            empty && 'justify-center',
          )}
        >
          {empty && (
            <div className={className('text-center py-12', tw.text.muted)}>
              <p className={className('text-base mb-1', tw.text.primary)}>
                {t('welcomeTitle')}
              </p>
              <p className="text-sm">{t('welcomeHint')}</p>
            </div>
          )}

          <ThreadPrimitive.Messages>
            {({ message }) =>
              message.role === 'user' ? <UserMessage /> : <AssistantMessage />
            }
          </ThreadPrimitive.Messages>
        </div>

        <ThreadPrimitive.ViewportFooter
          className={className(
            'sticky bottom-0 mx-auto w-full max-w-3xl pb-4 pt-8',
            tw.gradient.composerFooter,
          )}
        >
          <ThreadPrimitive.ScrollToBottom
            className={className(
              'absolute -top-10 left-1/2 -translate-x-1/2 rounded-full p-2 shadow',
              tw.background.toolbar,
              tw.text.muted,
            )}
          >
            <ArrowDownIcon className="size-4" />
          </ThreadPrimitive.ScrollToBottom>
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

const UserMessage: FC = () => (
  <MessagePrimitive.Root className="mb-6 flex justify-end">
    <div
      className={className(
        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
        tw.bubble.user,
      )}
    >
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
)

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root className="mb-6 flex flex-col gap-2 group">
    <div
      className={className(
        'rounded-2xl px-4 py-3 text-sm leading-relaxed border',
        tw.background.toolbar,
        tw.text.primary,
        tw.border.divider,
      )}
    >
      <MessagePrimitive.Parts
        components={{
          Text: TextPart,
          Reasoning: ReasoningPart,
          tools: { Fallback: ToolFallback },
        }}
      />
    </div>
    <ActionBarPrimitive.Root
      hideWhenRunning
      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <ActionBarPrimitive.Copy className={tw.button.icon}>
        <CopyIcon className="size-3.5" />
      </ActionBarPrimitive.Copy>
    </ActionBarPrimitive.Root>
  </MessagePrimitive.Root>
)

const TextPart: FC<TextPartProps> = ({ text }) => (
  <p className="whitespace-pre-wrap m-0">{text ?? ''}</p>
)

const ReasoningPart: FC<ReasoningPartProps> = ({ text }) => {
  const { t } = useTranslation()
  return (
    <details className={className('mb-2 text-xs', tw.text.muted)}>
      <summary className="cursor-pointer select-none">{t('reasoning')}</summary>
      <div className="mt-1 whitespace-pre-wrap">{text ?? ''}</div>
    </details>
  )
}

const ToolFallback: FC<ToolFallbackProps> = ({
  toolName,
  argsText,
  result,
  status,
}) => (
  <div
    className={className(
      'my-2 rounded-lg border px-3 py-2 text-xs font-mono',
      tw.border.divider,
      tw.background.tool,
    )}
  >
    <div className={className('font-semibold mb-1', tw.text.primary)}>
      {toolName}
      <span className={className('ml-2 font-normal', tw.text.muted)}>
        {status?.type}
      </span>
    </div>
    <pre
      className={className('whitespace-pre-wrap m-0 opacity-80', tw.text.muted)}
    >
      {argsText}
    </pre>
    {result != null && (
      <pre
        className={className(
          'mt-2 whitespace-pre-wrap m-0 border-t pt-2',
          tw.border.divider,
          tw.text.primary,
        )}
      >
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    )}
  </div>
)

const Composer: FC = () => {
  const { t } = useTranslation()
  const running = useAuiState((s) => s.thread.isRunning)

  return (
    <ComposerPrimitive.Root
      className={className(
        'flex flex-col rounded-2xl border shadow-sm',
        tw.border.divider,
        tw.background.toolbar,
      )}
    >
      <ComposerPrimitive.Input
        placeholder={t('composerPlaceholder')}
        rows={1}
        className={className(
          'max-h-40 min-h-12 w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none',
          tw.text.primary,
        )}
      />
      <div className="flex items-center justify-end gap-2 px-3 pb-3">
        {running ? (
          <ComposerPrimitive.Cancel className={tw.button.secondary}>
            <SquareIcon className="size-3.5 fill-current" />
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send className={tw.button.primary}>
            <ArrowUpIcon className="size-4" />
          </ComposerPrimitive.Send>
        )}
      </div>
    </ComposerPrimitive.Root>
  )
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: error?.message || String(error) }
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback message={this.state.error} />
    }
    return this.props.children
  }
}

const ErrorFallback: FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation()
  return (
    <div className={className('p-6 text-sm', tw.text.danger)}>
      <p className="font-semibold mb-2">{t('uiCrashed')}</p>
      <pre className="whitespace-pre-wrap">{message}</pre>
    </div>
  )
}
