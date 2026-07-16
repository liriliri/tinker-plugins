import { Component, type CSSProperties, type FC, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type AssistantState,
} from '@assistant-ui/react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  SquareIcon,
} from 'lucide-react'
import className from 'licia/className'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import truncate from 'licia/truncate'
import { formatTokens } from '../../common/util'
import { tw } from '../theme'
import store from '../store'
import ModelSelect from './ModelSelect'
import { SkillSlashPopover } from './SkillSlashPopover'
import { MarkdownText } from './MarkdownText'

interface TextLikePartProps {
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

interface ErrorFallbackProps {
  message: string
}

const isEmpty = (s: AssistantState) => s.thread.messages.length === 0

const THREAD_STYLE = {
  ['--thread-max-width' as string]: '44rem',
  ['--composer-radius' as string]: '0.5rem',
  ['--composer-padding' as string]: '8px',
} as CSSProperties

export const Thread: FC = () => {
  const { t } = useTranslation()
  const empty = useAuiState(isEmpty)

  return (
    <ThreadPrimitive.Root
      className={className(
        'aui-root aui-thread-root @container flex h-full flex-col',
        tw.background.app,
      )}
      style={THREAD_STYLE}
    >
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth">
        <div
          className={className(
            'mx-auto flex w-full max-w-[var(--thread-max-width)] flex-1 flex-col px-4 pt-4',
            empty && 'justify-center',
          )}
        >
          <AuiIf condition={isEmpty}>
            <div className="mb-6 flex flex-col items-center px-4 text-center">
              <p
                className={className(
                  'animate-fade-up mb-2 text-[11px] font-medium uppercase tracking-[0.18em]',
                  tw.text.accent,
                )}
              >
                {t('welcomeEyebrow')}
              </p>
              <h1
                className={className(
                  'animate-fade-up text-2xl font-semibold tracking-tight',
                  tw.text.primary,
                )}
              >
                {t('welcomeTitle')}
              </h1>
              <p
                className={className(
                  'animate-fade-up mt-1.5 max-w-sm text-sm',
                  tw.text.secondary,
                )}
              >
                {t('welcomeHint')}
              </p>
            </div>
          </AuiIf>

          <div className="mb-14 flex flex-col gap-y-3 empty:hidden">
            <ThreadPrimitive.Messages>
              {({ message }) =>
                message.role === 'user' ? <UserMessage /> : <AssistantMessage />
              }
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter
            className={className(
              'flex flex-col gap-3 overflow-visible pb-4 md:pb-5',
              tw.background.threadFooter,
              !empty && 'sticky bottom-0 mt-auto',
            )}
          >
            <ThreadPrimitive.ScrollToBottom
              className={className(
                'absolute -top-11 z-10 self-center rounded-sm border p-2.5 shadow-sm disabled:invisible',
                tw.background.scrollToBottom,
              )}
            >
              <ArrowDownIcon className="size-4" />
            </ThreadPrimitive.ScrollToBottom>
            <Composer />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    data-role="user"
    className="animate-fade-up flex justify-end px-2"
  >
    <div className="min-w-0 max-w-[85%]">
      <div
        className={className(
          'wrap-break-word empty:hidden whitespace-pre-wrap text-[15px] leading-relaxed',
          tw.message.userBubble,
        )}
      >
        <MessagePrimitive.Parts />
      </div>
    </div>
  </MessagePrimitive.Root>
)

const hasCopyableText = (s: AssistantState) =>
  s.message.content.some(
    (part) => part.type === 'text' && !!part.text && !isStrBlank(part.text),
  )

const AssistantMessage: FC = () => {
  const showCopy = useAuiState(hasCopyableText)

  return (
    <MessagePrimitive.Root
      data-role="assistant"
      className="animate-fade-up relative"
    >
      <div
        className={className(
          'wrap-break-word leading-relaxed',
          tw.message.assistant,
        )}
      >
        <MessagePrimitive.Parts components={MESSAGE_PARTS} />
      </div>
      {showCopy && (
        <div className="ms-1 mt-0.5 flex items-center">
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="never"
            className="flex gap-1"
          >
            <ActionBarPrimitive.Copy className={tw.button.action}>
              <AuiIf condition={(s) => s.message.isCopied}>
                <CheckIcon className="size-3.5" />
              </AuiIf>
              <AuiIf condition={(s) => !s.message.isCopied}>
                <CopyIcon className="size-3.5" />
              </AuiIf>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      )}
    </MessagePrimitive.Root>
  )
}

const ReasoningPart: FC<TextLikePartProps> = ({ text }) => {
  const { t } = useTranslation()
  return (
    <details className={className('mb-2 text-xs', tw.text.muted)}>
      <summary className="cursor-pointer select-none">{t('reasoning')}</summary>
      <div className="mt-1 whitespace-pre-wrap font-mono">{text ?? ''}</div>
    </details>
  )
}

const ToolFallback: FC<ToolFallbackProps> = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const { t } = useTranslation()
  const resultText =
    result == null
      ? ''
      : isStr(result)
        ? result
        : JSON.stringify(result, null, 2)
  const preview = truncate(trim((argsText || '').replace(/\s+/g, ' ')), 64)

  return (
    <details
      className={className(
        'group/tool my-1 w-full border text-xs font-mono open:pb-2 first:mt-0 last:mb-0',
        tw.message.tool,
      )}
    >
      <summary
        className={className(
          'flex cursor-pointer list-none items-center gap-2 px-3 py-2 select-none [&::-webkit-details-marker]:hidden',
          tw.hover.recent,
        )}
      >
        <ChevronRightIcon className="size-3.5 shrink-0 transition-transform group-open/tool:rotate-90" />
        <span className={className('shrink-0 font-medium', tw.text.accent)}>
          {toolName}
        </span>
        {status?.type && (
          <span className={className('shrink-0', tw.text.muted)}>
            {status.type}
          </span>
        )}
        {preview && (
          <span className={className('min-w-0 truncate', tw.text.muted)}>
            {preview}
          </span>
        )}
      </summary>
      <div className="border-t border-dashed px-3 pt-2">
        <div className={className('mb-1 text-[11px]', tw.text.muted)}>
          {t('toolArguments')}
        </div>
        <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap opacity-90">
          {argsText || '—'}
        </pre>
        {result != null && (
          <>
            <div
              className={className(
                'mb-1 mt-3 border-t border-dashed pt-2 text-[11px]',
                tw.text.muted,
              )}
            >
              {t('toolResult')}
            </div>
            <pre
              className={className(
                'm-0 max-h-64 overflow-auto whitespace-pre-wrap',
                tw.text.primary,
              )}
            >
              {resultText}
            </pre>
          </>
        )}
      </div>
    </details>
  )
}

const Composer: FC = observer(function Composer() {
  const { t } = useTranslation()
  const contextLabel = store.context ? formatTokens(store.context.tokens) : null

  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      <ComposerPrimitive.Root className="relative flex w-full flex-col">
        <div
          className={className(
            'flex w-full flex-col gap-2 border p-[var(--composer-padding)] shadow-sm transition-[border-color,box-shadow]',
            'rounded-[var(--composer-radius)]',
            tw.background.composer,
          )}
        >
          <ComposerPrimitive.Input
            placeholder={t('composerPlaceholder')}
            rows={1}
            className={className(
              'max-h-32 min-h-10 w-full resize-none bg-transparent px-2 py-1 text-[15px] outline-none',
              tw.background.composerInput,
              tw.text.primary,
            )}
            autoFocus
          />
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <ModelSelect />
              {contextLabel && (
                <span
                  className={className(
                    'shrink-0 text-[11px] tabular-nums',
                    tw.text.muted,
                  )}
                  title={t('contextTokens')}
                >
                  {contextLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <AuiIf condition={(s) => !s.thread.isRunning}>
                <ComposerPrimitive.Send className={tw.button.send}>
                  <ArrowUpIcon className="size-4" />
                </ComposerPrimitive.Send>
              </AuiIf>
              <AuiIf condition={(s) => s.thread.isRunning}>
                <ComposerPrimitive.Cancel className={tw.button.send}>
                  <SquareIcon className="size-3.5 fill-current" />
                </ComposerPrimitive.Cancel>
              </AuiIf>
            </div>
          </div>
        </div>
        <SkillSlashPopover />
      </ComposerPrimitive.Root>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  )
})

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

const MESSAGE_PARTS = {
  Text: MarkdownText,
  Reasoning: ReasoningPart,
  tools: { Fallback: ToolFallback },
}

const ErrorFallback: FC<ErrorFallbackProps> = ({ message }) => {
  const { t, i18n } = useTranslation()
  const display = i18n.exists(message) ? t(message) : message
  return (
    <div className={className('p-6 text-sm', tw.text.danger)}>
      <p className="mb-2 font-semibold">{t('uiCrashed')}</p>
      <pre className="whitespace-pre-wrap font-mono">{display}</pre>
    </div>
  )
}
