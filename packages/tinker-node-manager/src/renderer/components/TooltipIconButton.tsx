import type { ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { tw } from '../theme'

interface TooltipIconButtonProps {
  title: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

export default function TooltipIconButton({
  title,
  disabled,
  onClick,
  children,
}: TooltipIconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          title={title}
          disabled={disabled}
          onClick={onClick}
          className={tw.button.icon}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={tw.tooltip} sideOffset={4}>
          {title}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
