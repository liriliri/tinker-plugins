import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import type { Tool } from '../types'

const tools: { key: Tool; label: string; icon: string }[] = [
  { key: 'pinyin', label: 'tabPinyin', icon: '拼' },
  { key: 'rmb', label: 'tabRmb', icon: '¥' },
  { key: 'chinese', label: 'tabChinese', icon: '繁' },
]

const ToolTabs = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'flex gap-1 p-0.5 rounded-lg',
        tw.background.segmented,
      )}
    >
      {tools.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => store.setCurrentTool(key)}
          className={className(
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
            store.currentTool === key
              ? `${tw.background.segmentedActive} font-medium ${tw.text.segmentedActive}`
              : `${tw.text.inactive} ${tw.text.inactiveHover}`,
          )}
        >
          <span
            className={className(
              'text-xs font-bold w-5 h-5 flex items-center justify-center rounded',
              store.currentTool === key ? tw.badge.active : tw.badge.inactive,
            )}
          >
            {icon}
          </span>
          {t(label)}
        </button>
      ))}
    </div>
  )
})

export default ToolTabs
