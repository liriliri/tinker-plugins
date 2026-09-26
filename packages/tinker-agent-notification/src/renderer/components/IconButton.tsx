import className from 'licia/className'
import type { ReactNode, MouseEvent } from 'react'
import { tw } from '../theme'

interface IconButtonProps {
  onClick: (e: MouseEvent) => void
  children: ReactNode
  disabled?: boolean
  invisible?: boolean
  className?: string
}

function IconButton({
  onClick,
  children,
  disabled,
  invisible,
  className: extra,
}: IconButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={className(
        'flex items-center justify-center w-8 h-8 rounded shrink-0',
        'transition-all duration-200',
        invisible
          ? 'invisible'
          : className(
              'cursor-pointer',
              tw.text.icon,
              tw.accent.hoverText,
              tw.accent.hoverBg,
              'active:scale-90',
            ),
        extra,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default IconButton
