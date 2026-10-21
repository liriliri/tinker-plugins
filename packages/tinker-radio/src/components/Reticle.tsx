import className from 'licia/className'
import { tw } from '../theme'

interface ReticleProps {
  spin?: boolean
}

function Reticle({ spin }: ReticleProps) {
  return (
    <svg
      className={className(
        'absolute -left-10 -top-10 overflow-visible',
        tw.text.primary,
        tw.breathe,
      )}
      width="80"
      height="80"
      viewBox="-40 -40 80 80"
      aria-hidden="true"
    >
      <circle
        r="23"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray={spin ? '48 96.5' : undefined}
        className={spin ? tw.orbit : undefined}
      />
      <circle
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.9"
      />
    </svg>
  )
}

export default Reticle
