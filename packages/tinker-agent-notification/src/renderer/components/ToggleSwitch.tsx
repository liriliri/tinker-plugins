import className from 'licia/className'
import { tw } from '../theme'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className={className(
        'relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer',
        'focus:outline-none',
        checked ? tw.toggle.on : tw.toggle.off,
      )}
      onClick={onChange}
    >
      <div
        className={className(
          'absolute top-0.5 w-4 h-4 rounded-full shadow-sm',
          tw.toggle.thumb,
          'transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default ToggleSwitch
