import type { SourceMeta } from '../types'

interface Props {
  source: SourceMeta
  className?: string
}

const SourceIcon = ({ source, className = 'w-4 h-4' }: Props) => {
  return (
    <img
      src={source.favicon}
      alt=""
      aria-hidden="true"
      className={`rounded-sm shrink-0 object-cover ${className}`}
    />
  )
}

export default SourceIcon
