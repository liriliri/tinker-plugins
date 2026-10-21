import className from 'licia/className'
import { tw } from '../theme'

function Reticle() {
  return (
    <svg
      className={className('h-full w-full overflow-visible', tw.text.primary)}
      viewBox="-40 -40 80 80"
      aria-hidden="true"
    >
      <circle
        r="23"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
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
