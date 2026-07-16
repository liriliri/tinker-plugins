import { memo, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
  type CodeHeaderProps,
} from '@assistant-ui/react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckIcon, CopyIcon } from 'lucide-react'
import className from 'licia/className'
import delay from 'licia/delay'
import { tw } from '../theme'
import '@assistant-ui/react-markdown/styles/dot.css'

const MarkdownTextImpl = () => (
  <MarkdownTextPrimitive
    remarkPlugins={[remarkGfm]}
    className="aui-md text-[15px] leading-relaxed"
    components={markdownComponents}
    defer
  />
)

export const MarkdownText = memo(MarkdownTextImpl)

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { t } = useTranslation()
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  return (
    <div
      className={className(
        'mt-3 flex items-center justify-between rounded-t-md border border-b-0 px-3 py-1.5 text-xs',
        tw.markdown.codeHeader,
      )}
    >
      <span className={className('font-medium lowercase', tw.text.muted)}>
        {language}
      </span>
      <button
        type="button"
        className={tw.button.action}
        aria-label={t('copy')}
        onClick={() => {
          if (code && !isCopied) copyToClipboard(code)
        }}
      >
        {isCopied ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
    </div>
  )
}

function useCopyToClipboard(copiedDuration = 3000) {
  const [isCopied, setIsCopied] = useState(false)
  const copyToClipboard = (value: string) => {
    if (!value || !navigator.clipboard) return
    void navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      delay(() => setIsCopied(false), copiedDuration)
    })
  }
  return { isCopied, copyToClipboard }
}

const markdownComponents = memoizeMarkdownComponents({
  h1: ({ className: c, ...props }) => (
    <h1
      className={className(
        'mt-5 mb-2 scroll-m-20 text-xl font-semibold first:mt-0 last:mb-0',
        c,
      )}
      {...props}
    />
  ),
  h2: ({ className: c, ...props }) => (
    <h2
      className={className(
        'mt-5 mb-2 scroll-m-20 text-lg font-semibold first:mt-0 last:mb-0',
        c,
      )}
      {...props}
    />
  ),
  h3: ({ className: c, ...props }) => (
    <h3
      className={className(
        'mt-4 mb-1.5 scroll-m-20 text-base font-semibold first:mt-0 last:mb-0',
        c,
      )}
      {...props}
    />
  ),
  h4: ({ className: c, ...props }) => (
    <h4
      className={className(
        'mt-3.5 mb-1 scroll-m-20 text-base font-medium first:mt-0 last:mb-0',
        c,
      )}
      {...props}
    />
  ),
  p: ({ className: c, ...props }) => (
    <p
      className={className('my-3 leading-relaxed first:mt-0 last:mb-0', c)}
      {...props}
    />
  ),
  a: ({ className: c, ...props }) => (
    <a className={className(tw.markdown.link, c)} {...props} />
  ),
  blockquote: ({ className: c, ...props }) => (
    <blockquote className={className(tw.markdown.blockquote, c)} {...props} />
  ),
  ul: ({ className: c, ...props }) => (
    <ul
      className={className(
        'my-3 ms-5 list-disc [&>li]:mt-1',
        tw.markdown.listMarker,
        c,
      )}
      {...props}
    />
  ),
  ol: ({ className: c, ...props }) => (
    <ol
      className={className(
        'my-3 ms-5 list-decimal [&>li]:mt-1',
        tw.markdown.listMarker,
        c,
      )}
      {...props}
    />
  ),
  hr: ({ className: c, ...props }) => (
    <hr className={className(tw.markdown.hr, c)} {...props} />
  ),
  table: ({ className: c, ...props }) => (
    <table
      className={className(
        'my-3 w-full border-separate border-spacing-0 overflow-y-auto',
        c,
      )}
      {...props}
    />
  ),
  th: ({ className: c, ...props }) => (
    <th className={className(tw.markdown.th, c)} {...props} />
  ),
  td: ({ className: c, ...props }) => (
    <td className={className(tw.markdown.td, c)} {...props} />
  ),
  tr: ({ className: c, ...props }) => (
    <tr
      className={className(
        'm-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-es-md [&:last-child>td:last-child]:rounded-ee-md',
        c,
      )}
      {...props}
    />
  ),
  li: ({ className: c, ...props }) => (
    <li className={className('leading-relaxed', c)} {...props} />
  ),
  strong: ({ className: c, ...props }) => (
    <strong className={className('font-semibold', c)} {...props} />
  ),
  pre: ({ className: c, ...props }) => (
    <pre className={className(tw.markdown.codeBlock, c)} {...props} />
  ),
  code: function Code({ className: c, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock()
    return (
      <code
        className={className(!isCodeBlock && tw.markdown.inlineCode, c)}
        {...props}
      />
    )
  },
  CodeHeader,
})
