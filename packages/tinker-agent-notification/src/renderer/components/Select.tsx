import className from 'licia/className'
import { ChevronDown } from 'lucide-react'
import { tw } from '../theme'

interface SelectProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  flex?: boolean
}

const Select = ({ value, onChange, children, flex }: SelectProps) => (
  <div
    className={className(
      'relative inline-flex items-center rounded-md',
      flex ? 'flex-1' : '',
      tw.border.card,
      tw.background.primary,
    )}
  >
    <select
      className={className(
        'appearance-none pl-3 pr-8 py-2 rounded-md text-sm border-0 outline-none',
        'bg-transparent',
        'cursor-pointer',
        flex ? 'w-full' : '',
        tw.text.primary,
      )}
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className={className(
        'absolute right-2.5 pointer-events-none',
        tw.text.muted,
      )}
    />
  </div>
)

export default Select
