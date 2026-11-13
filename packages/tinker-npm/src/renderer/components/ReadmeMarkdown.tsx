import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import className from 'licia/className'
import { tw } from '../theme'

interface ReadmeMarkdownProps {
  content: string
}

export default function ReadmeMarkdown({ content }: ReadmeMarkdownProps) {
  return (
    <div
      className={className(
        'npm-readme text-[13px] leading-relaxed',
        tw.text.primary,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {content}
      </Markdown>
    </div>
  )
}
