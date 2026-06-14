import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'

const OptionButtons = observer(
  ({
    items,
    value,
    onChange,
  }: {
    items: { key: string; label: string }[]
    value: string
    onChange: (key: string) => void
  }) => {
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
                ? `${tw.background.segmentedActive} font-medium ${tw.text.segmentedOptionActive}`
                : `${tw.text.inactive} ${tw.text.inactiveHover}`,
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
