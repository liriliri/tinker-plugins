import type { ReactNode } from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import { tw } from '../theme'

interface AppScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  type?: 'auto' | 'always' | 'scroll' | 'hover'
}

/** Overlay scrollbar so content width stays stable (no layout jump). */
export default function AppScrollArea({
  children,
  className: rootClass,
  viewportClassName,
  type = 'hover',
}: AppScrollAreaProps) {
  return (
    <ScrollArea.Root
      type={type}
      className={className(tw.scrollArea.root, rootClass)}
    >
      <ScrollArea.Viewport
        className={className(tw.scrollArea.viewport, viewportClassName)}
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
