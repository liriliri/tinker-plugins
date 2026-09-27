import className from 'licia/className'
import { tw } from '../theme'

interface DotSpinnerProps {
  size?: 'sm' | 'md'
}

export default function DotSpinner({ size = 'md' }: DotSpinnerProps) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'

  return (
    <div className={className('flex items-center', gap)}>
      <span
        className={className(
          dotSize,
          'rounded-full animate-dot-pulse',
          tw.loading.dot,
        )}
      />
      <span
        className={className(
          dotSize,
          'rounded-full animate-dot-pulse-2',
          tw.loading.dot,
        )}
      />
      <span
        className={className(
          dotSize,
          'rounded-full animate-dot-pulse-3',
          tw.loading.dot,
        )}
      />
    </div>
  )
}
