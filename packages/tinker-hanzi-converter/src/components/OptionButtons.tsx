import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import type { OptionItem } from '../types'

interface OptionButtonsProps<T extends string> {
  items: OptionItem<T>[]
  value: T
  onChange: (key: T) => void
}

const OptionButtons = observer(
  <T extends string>({ items, value, onChange }: OptionButtonsProps<T>) => {
    const { t } = useTranslation()

    return (
      <div
        className={className(
          'flex gap-0.5 p-0.5 rounded-md',
          tw.background.segmented,
        )}
      >
        {items.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={className(
              'px-2.5 py-1 text-xs rounded transition-all duration-200',
              value === key
                ? `${tw.segmented.active} ${tw.segmented.optionText}`
                : tw.segmented.inactive,
            )}
          >
            {t(label)}
          </button>
        ))}
      </div>
    )
  },
)

export default OptionButtons
