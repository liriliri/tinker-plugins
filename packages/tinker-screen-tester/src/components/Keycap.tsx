import { tw, keycapStyle } from '../theme'

interface KeycapProps {
  label: string
}

export default function Keycap({ label }: KeycapProps) {
  return (
    <kbd className={tw.keycap} style={keycapStyle}>
      {label}
    </kbd>
  )
}
