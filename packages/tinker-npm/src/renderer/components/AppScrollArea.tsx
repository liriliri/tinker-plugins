import type { ReactNode, UIEventHandler } from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import { tw } from '../theme'

interface AppScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  type?: 'auto' | 'always' | 'scroll' | 'hover'
  onScroll?: UIEventHandler<HTMLDivElement>
}

export default function AppScrollArea({
  children,
  className: rootClass,
  viewportClassName,
  type = 'hover',
  onScroll,
}: AppScrollAreaProps) {
  return (
    <ScrollArea.Root
      type={type}
      className={className(tw.scrollArea.root, rootClass)}
    >
      <ScrollArea.Viewport
        className={className(tw.scrollArea.viewport, viewportClassName)}
        onScroll={onScroll}
      >
        {children}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className={tw.scrollArea.scrollbar}
      >
        <ScrollArea.Thumb className={tw.scrollArea.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
