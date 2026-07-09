import { tw } from '../theme'

interface DotSpinnerProps {
  size?: 'sm' | 'md'
}

export default function DotSpinner({ size = 'md' }: DotSpinnerProps) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'

  return (
    <div className={`flex items-center ${gap}`}>
      <span
        className={`${dotSize} rounded-full ${tw.loading.dot} animate-dot-pulse`}
      />
      <span
        className={`${dotSize} rounded-full ${tw.loading.dot} animate-dot-pulse-2`}
      />
      <span
        className={`${dotSize} rounded-full ${tw.loading.dot} animate-dot-pulse-3`}
      />
    </div>
  )
}
